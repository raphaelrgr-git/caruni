import { ConnectionKind, RideStatus } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

async function upsertConnection({
  userId,
  connectedUserId,
  kind,
  interactedAt,
}: {
  userId: string;
  connectedUserId: string;
  kind: ConnectionKind;
  interactedAt: Date;
}) {
  if (userId === connectedUserId) return;

  await prisma.connection.upsert({
    where: {
      userId_connectedUserId: {
        userId,
        connectedUserId,
      },
    },
    create: {
      userId,
      connectedUserId,
      kind,
      tripsTogether: 1,
      lastInteractedAt: interactedAt,
    },
    update: {
      kind,
      lastInteractedAt: interactedAt,
      isHidden: false,
    },
  });
}

async function ensureConnectionsFromHistory(userId: string) {
  const rides = await prisma.rideInstance.findMany({
    where: {
      status: RideStatus.CONFIRMED,
      OR: [
        { route: { driverId: userId } },
        { bookings: { some: { userId, status: "ACTIVE" } } },
      ],
    },
    include: {
      route: true,
      bookings: {
        where: { status: "ACTIVE" },
        include: { user: true },
      },
    },
  });

  const pairs = new Map<
    string,
    { userId: string; connectedUserId: string; kind: ConnectionKind; count: number; last: Date }
  >();

  const collect = ({
    userId,
    connectedUserId,
    kind,
    interactedAt,
  }: {
    userId: string;
    connectedUserId: string;
    kind: ConnectionKind;
    interactedAt: Date;
  }) => {
    if (userId === connectedUserId) return;
    const key = `${userId}:${connectedUserId}`;
    const current = pairs.get(key);
    if (!current) {
      pairs.set(key, {
        userId,
        connectedUserId,
        kind,
        count: 1,
        last: interactedAt,
      });
      return;
    }
    current.count += 1;
    if (interactedAt > current.last) current.last = interactedAt;
  };

  for (const ride of rides) {
    const passengers = ride.bookings.map((booking) => booking.user);
    for (const passenger of passengers) {
      collect({
        userId: ride.route.driverId,
        connectedUserId: passenger.id,
        kind: ConnectionKind.MOTORISTA_PASSAGEIRO,
        interactedAt: ride.updatedAt,
      });
      collect({
        userId: passenger.id,
        connectedUserId: ride.route.driverId,
        kind: ConnectionKind.MOTORISTA_PASSAGEIRO,
        interactedAt: ride.updatedAt,
      });
    }

    for (let index = 0; index < passengers.length; index += 1) {
      for (let next = index + 1; next < passengers.length; next += 1) {
        collect({
          userId: passengers[index]!.id,
          connectedUserId: passengers[next]!.id,
          kind: ConnectionKind.PASSAGEIRO_PASSAGEIRO,
          interactedAt: ride.updatedAt,
        });
        collect({
          userId: passengers[next]!.id,
          connectedUserId: passengers[index]!.id,
          kind: ConnectionKind.PASSAGEIRO_PASSAGEIRO,
          interactedAt: ride.updatedAt,
        });
      }
    }
  }

  for (const pair of pairs.values()) {
    await prisma.connection.upsert({
      where: {
        userId_connectedUserId: {
          userId: pair.userId,
          connectedUserId: pair.connectedUserId,
        },
      },
      create: {
        userId: pair.userId,
        connectedUserId: pair.connectedUserId,
        kind: pair.kind,
        tripsTogether: pair.count,
        lastInteractedAt: pair.last,
      },
      update: {
        kind: pair.kind,
        tripsTogether: pair.count,
        lastInteractedAt: pair.last,
      },
    });
  }
}

export async function registerConnectionsModule(app: FastifyInstance) {
  app.get("/connections", { preHandler: app.authenticate }, async (request) => {
    const query = z
      .object({
        sort: z.enum(["recentes", "recorrentes"]).default("recorrentes"),
      })
      .parse(request.query);

    await ensureConnectionsFromHistory(request.auth!.userId);

    const orderBy =
      query.sort === "recentes"
        ? [{ lastInteractedAt: "desc" as const }, { tripsTogether: "desc" as const }]
        : [{ tripsTogether: "desc" as const }, { lastInteractedAt: "desc" as const }];

    const connections = await prisma.connection.findMany({
      where: {
        userId: request.auth!.userId,
        isHidden: false,
      },
      include: {
        connectedUser: {
          include: {
            university: true,
          },
        },
      },
      orderBy,
    });

    return connections.map((connection) => ({
      id: connection.id,
      tripsTogether: connection.tripsTogether,
      lastInteractedAt: connection.lastInteractedAt,
      strong: connection.tripsTogether >= 5,
      connectedUser: {
        id: connection.connectedUser.id,
        name: connection.connectedUser.name,
        photoUrl: connection.connectedUser.photoUrl,
        university: connection.connectedUser.university
          ? {
              name: connection.connectedUser.university.name,
              city: connection.connectedUser.university.city,
            }
          : null,
      },
    }));
  });

  app.post("/connections/:id/hide", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const connection = await prisma.connection.findFirst({
      where: { id, userId: request.auth!.userId },
    });
    if (!connection) return reply.notFound("Conexão não encontrada.");
    await prisma.connection.update({
      where: { id },
      data: { isHidden: true },
    });
    return { ok: true };
  });

  app.post("/connections/:id/block", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const connection = await prisma.connection.findFirst({
      where: { id, userId: request.auth!.userId },
    });
    if (!connection) return reply.notFound("Conexão não encontrada.");
    await prisma.connection.update({
      where: { id },
      data: { isHidden: true, isBlocked: true },
    });
    return { ok: true };
  });

  app.delete("/connections/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const connection = await prisma.connection.findFirst({
      where: { id, userId: request.auth!.userId },
    });
    if (!connection) return reply.notFound("Conexão não encontrada.");
    await prisma.connection.delete({ where: { id } });
    return { ok: true };
  });

  app.get("/connections/:id/routes", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const connection = await prisma.connection.findFirst({
      where: { id, userId: request.auth!.userId, isBlocked: false },
      include: { connectedUser: true },
    });
    if (!connection) return reply.notFound("Conexão não encontrada.");

    if (connection.connectedUser.role !== "MOTORISTA") {
      return [];
    }

    const routes = await prisma.route.findMany({
      where: { driverId: connection.connectedUserId },
      include: {
        driver: true,
        bookings: { where: { status: "ACTIVE" } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return routes.map((route) => ({
      id: route.id,
      name: route.name,
      city: route.city,
      originLabel: route.originLabel,
      destinationLabel: route.destinationLabel,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      departureTime: route.departureTime,
      weekdays: route.weekdays,
      seats: route.seats,
      occupiedSeats: route.bookings.length,
      driver: {
        id: route.driver.id,
        name: route.driver.name,
        photoUrl: route.driver.photoUrl,
      },
    }));
  });
}
