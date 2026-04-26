import { BookingStatus, BookingType, CreditStatus, UserRole, WalletTransactionType } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getAvailableCredit, getOrCreateNextRide, reserveCreditForBooking, toMoney } from "../lib/domain.js";
import {
  buildBookingDeepLink,
  buildRideDeepLink,
  createNotification,
} from "../lib/notifications.js";
import { createRouteSystemMessage } from "./chat.js";
import { prisma } from "../prisma.js";

export async function registerBookingsModule(app: FastifyInstance) {
  app.post("/bookings", { preHandler: app.authenticate }, async (request, reply) => {
    const body = z
      .object({
        routeId: z.string().min(1),
        weekdays: z.array(z.number().int().min(0).max(6)).min(1),
        type: z.enum([BookingType.RECORRENTE, BookingType.AVULSO]).default(BookingType.AVULSO),
      })
      .parse(request.body);

    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      select: { role: true },
    });
    if (!user) {
      return reply.notFound("Usuario nao encontrado.");
    }
    if (user.role !== UserRole.PASSAGEIRO) {
      return reply.forbidden("Apenas passageiros podem reservar vagas.");
    }

    const ride = await getOrCreateNextRide(body.routeId);
    if (!ride) {
      return reply.badRequest("Nao foi possivel gerar a proxima viagem.");
    }

    const booking = await reserveCreditForBooking({
      userId: request.auth!.userId,
      routeId: body.routeId,
      rideInstanceId: ride.id,
      type: body.type,
      weekdays: body.weekdays,
    });

    const passenger = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      select: { name: true },
    });
    if (passenger) {
      await createRouteSystemMessage(
        body.routeId,
        `${passenger.name} reservou uma vaga nesta rota.`,
      );
    }

    // Notify driver about new passenger
    const route = await prisma.route.findUnique({
      where: { id: body.routeId },
      select: { driverId: true, name: true },
    });
    if (route && passenger) {
      void createNotification({
        userId: route.driverId,
        kind:
          booking.status === BookingStatus.PENDING_APPROVAL
            ? "RESERVA_PRIVADA_PENDENTE"
            : "BOOKING_NEW_PASSENGER",
        title:
          booking.status === BookingStatus.PENDING_APPROVAL
            ? "Nova solicitação privada"
            : "Nova reserva",
        message:
          booking.status === BookingStatus.PENDING_APPROVAL
            ? `${passenger.name} solicitou aprovação para entrar na rota.`
            : `${passenger.name} reservou uma vaga na sua rota.`,
        actionRequired: false,
        deepLink: buildRideDeepLink(ride.id),
      });
    }

    return reply.code(201).send(booking);
  });

  app.post("/bookings/:id/cancel", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: request.auth!.userId },
      include: {
        route: true,
        rideInstance: true,
        creditEntries: true,
      },
    });
    if (!booking) {
      return reply.notFound("Reserva nao encontrada.");
    }
    if (booking.status === "CANCELLED") {
      return reply.badRequest("Reserva ja cancelada.");
    }

    const late =
      booking.rideInstance?.scheduledAt != null
        ? booking.rideInstance.scheduledAt.getTime() - Date.now() <= 2 * 60 * 60 * 1000
        : false;

    const credit = booking.creditEntries[0];
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      if (credit) {
        await tx.creditLedgerEntry.update({
          where: { id: credit.id },
          data: {
            status: late ? CreditStatus.PERDIDO : CreditStatus.DISPONIVEL,
            bookingId: null,
            description: late
              ? `Cancelamento tardio · ${booking.route.name}`
              : `Credito devolvido · ${booking.route.name}`,
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId: request.auth!.userId,
            bookingId: booking.id,
            rideInstanceId: booking.rideInstanceId,
            type: late
              ? WalletTransactionType.CREDITO_PERDIDO
              : WalletTransactionType.CREDITO_DEVOLVIDO,
            description: late
              ? `Cancelamento tardio · ${booking.route.name}`
              : `Credito devolvido · ${booking.route.name}`,
            amount: late ? -(toMoney(credit.monetaryValue) / 2) : 0,
          },
        });
      }
    });

    await createRouteSystemMessage(
      booking.routeId,
      late
        ? "Uma reserva foi cancelada tardiamente com penalidade."
        : "Uma reserva foi cancelada e o crédito foi devolvido.",
    );

    // Notify driver about passenger cancellation
    void createNotification({
      userId: booking.route.driverId,
      kind: "BOOKING_CANCELLED_BY_PASSENGER",
      title: "Passageiro cancelou",
      message: `Uma reserva foi cancelada na rota ${booking.route.name}.`,
      deepLink: booking.rideInstanceId ? buildRideDeepLink(booking.rideInstanceId) : undefined,
    });

    return { ok: true, late };
  });

  app.post(
    "/routes/:id/private-bookings/:bookingId/approve",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = z
        .object({ id: z.string().min(1), bookingId: z.string().min(1) })
        .parse(request.params);

      const route = await prisma.route.findUnique({
        where: { id: params.id },
        include: {
          bookings: { where: { status: BookingStatus.ACTIVE } },
        },
      });
      if (!route) return reply.notFound("Rota nao encontrada.");
      if (route.driverId !== request.auth!.userId) {
        return reply.forbidden("Apenas o motorista da rota pode aprovar reservas privadas.");
      }

      const booking = await prisma.booking.findUnique({
        where: { id: params.bookingId },
        include: { user: true, route: true, rideInstance: true },
      });
      if (!booking || booking.routeId !== route.id || booking.status !== BookingStatus.PENDING_APPROVAL) {
        return reply.notFound("Solicitação privada não encontrada.");
      }
      if (route.bookings.length >= route.seats) {
        return reply.badRequest("A rota já está lotada.");
      }

      const credit = await getAvailableCredit(booking.userId);
      if (!credit) {
        return reply.badRequest("O passageiro está sem crédito disponível para confirmar a vaga.");
      }

      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.ACTIVE,
            approvedAt: new Date(),
            approvedByDriverAt: new Date(),
          },
        });

        await tx.creditLedgerEntry.update({
          where: { id: credit.id },
          data: {
            status: CreditStatus.RESERVADO,
            bookingId: booking.id,
            rideInstanceId: booking.rideInstanceId,
            description: `Credito reservado · ${route.name}`,
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId: booking.userId,
            bookingId: booking.id,
            rideInstanceId: booking.rideInstanceId,
            type: WalletTransactionType.CREDITO_RESERVADO,
            description: `Credito reservado · ${route.name}`,
            amount: 0,
          },
        });
      });

      await createRouteSystemMessage(route.id, `${booking.user.name} foi aprovado para entrar na rota.`);
      void createNotification({
        userId: booking.userId,
        kind: "RESERVA_PRIVADA_APROVADA",
        title: "Sua solicitação foi aprovada",
        message: `O motorista aprovou sua entrada na rota ${route.name}.`,
        deepLink: buildBookingDeepLink(booking.id),
      });

      return { ok: true };
    },
  );

  app.post(
    "/routes/:id/private-bookings/:bookingId/reject",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = z
        .object({ id: z.string().min(1), bookingId: z.string().min(1) })
        .parse(request.params);

      const route = await prisma.route.findUnique({
        where: { id: params.id },
      });
      if (!route) return reply.notFound("Rota nao encontrada.");
      if (route.driverId !== request.auth!.userId) {
        return reply.forbidden("Apenas o motorista da rota pode recusar reservas privadas.");
      }

      const booking = await prisma.booking.findUnique({
        where: { id: params.bookingId },
        include: { user: true },
      });
      if (!booking || booking.routeId !== route.id || booking.status !== BookingStatus.PENDING_APPROVAL) {
        return reply.notFound("Solicitação privada não encontrada.");
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      await createRouteSystemMessage(route.id, `${booking.user.name} não foi aprovado para esta vaga privada.`);
      void createNotification({
        userId: booking.userId,
        kind: "RESERVA_PRIVADA_RECUSADA",
        title: "Solicitação não aprovada",
        message: `O motorista recusou sua solicitação na rota ${route.name}.`,
        deepLink: "/app/buscar",
      });

      return { ok: true };
    },
  );
}
