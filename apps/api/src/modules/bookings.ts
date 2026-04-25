import { BookingType, CreditStatus, WalletTransactionType } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getOrCreateNextRide, reserveCreditForBooking, toMoney } from "../lib/domain.js";
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

    return reply.code(201).send(booking);
  });

  app.post("/bookings/:id/cancel", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({ late: z.boolean().optional().default(false) })
      .parse(request.body ?? {});

    const booking = await prisma.booking.findFirst({
      where: { id: params.id, userId: request.auth!.userId },
      include: {
        route: true,
        creditEntries: true,
      },
    });
    if (!booking) {
      return reply.notFound("Reserva nao encontrada.");
    }
    if (booking.status === "CANCELLED") {
      return reply.badRequest("Reserva ja cancelada.");
    }

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
            status: body.late ? CreditStatus.PERDIDO : CreditStatus.DISPONIVEL,
            bookingId: null,
            description: body.late
              ? `Cancelamento tardio · ${booking.route.name}`
              : `Credito devolvido · ${booking.route.name}`,
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId: request.auth!.userId,
            bookingId: booking.id,
            rideInstanceId: booking.rideInstanceId,
            type: body.late
              ? WalletTransactionType.CREDITO_PERDIDO
              : WalletTransactionType.CREDITO_DEVOLVIDO,
            description: body.late
              ? `Cancelamento tardio · ${booking.route.name}`
              : `Credito devolvido · ${booking.route.name}`,
            amount: body.late ? -(toMoney(credit.monetaryValue) / 2) : 0,
          },
        });
      }
    });

    return { ok: true };
  });
}
