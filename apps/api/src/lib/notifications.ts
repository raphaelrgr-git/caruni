import type { NotificationKind, Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";

// SSE connection map: userId → Set of writer functions
const sseClients = new Map<string, Set<(data: string) => void>>();

export function buildRideDeepLink(rideId: string): string {
  return `/app/viagem-ativa?rideId=${encodeURIComponent(rideId)}`;
}

export function buildBookingDeepLink(bookingId: string): string {
  return `/app/minhas-caronas?bookingId=${encodeURIComponent(bookingId)}`;
}

export function buildRouteChatDeepLink(routeId: string, rideId?: string | null): string {
  const base = `/app/chat/${encodeURIComponent(routeId)}`;
  return rideId ? `${base}?rideId=${encodeURIComponent(rideId)}` : base;
}

export function registerSseClient(userId: string, writer: (data: string) => void): () => void {
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId)!.add(writer);
  return () => sseClients.get(userId)?.delete(writer);
}

export async function createNotification(params: {
  userId: string;
  kind: NotificationKind;
  title: string;
  message: string;
  actionRequired?: boolean;
  deepLink?: string;
  expiresAt?: Date;
  metadata?: Prisma.InputJsonValue;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      kind: params.kind,
      title: params.title,
      message: params.message,
      actionRequired: params.actionRequired ?? false,
      deepLink: params.deepLink ?? null,
      expiresAt: params.expiresAt ?? null,
      metadata: params.metadata ?? undefined,
    },
  });

  // Push to any open SSE streams for this user
  const clients = sseClients.get(params.userId);
  if (clients && clients.size > 0) {
    const payload = JSON.stringify({ type: "notification", data: notification });
    clients.forEach((write) => {
      try {
        write(payload);
      } catch {
        // Connection was already closed — ignore
      }
    });
  }

  return notification;
}
