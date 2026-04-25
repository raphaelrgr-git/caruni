import { CreditStatus, RideStatus, WalletTransactionType } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toMoney } from "../lib/domain.js";
import { prisma } from "../prisma.js";

export async function registerRidesModule(app: FastifyInstance) {
  app.post(
    "/rides/:id/driver-confirm",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const body = z.object({ boarded: z.boolean().default(true) }).parse(request.body ?? {});

      const ride = await prisma.rideInstance.findUnique({
        where: { id: params.id },
        include: {
          route: true,
          bookings: { include: { user: true, creditEntries: true } },
        },
      });
      if (!ride) {
        return reply.notFound("Viagem nao encontrada.");
      }
      if (ride.route.driverId !== request.auth!.userId) {
        return reply.forbidden("Apenas o motorista desta rota pode confirmar embarque.");
      }

      await prisma.rideInstance.update({
        where: { id: ride.id },
        data: {
          driverConfirmedAt: new Date(),
          passengerBoarded: body.boarded,
        },
      });

      if (!body.boarded) {
        const booking = ride.bookings[0];
        const credit = booking?.creditEntries[0];
        if (booking && credit) {
          await prisma.$transaction(async (tx) => {
            await tx.creditLedgerEntry.update({
              where: { id: credit.id },
              data: {
                status: CreditStatus.PERDIDO,
                description: `No-show · ${ride.route.name}`,
              },
            });
            await tx.walletTransaction.create({
              data: {
                userId: booking.userId,
                bookingId: booking.id,
                rideInstanceId: ride.id,
                type: WalletTransactionType.CREDITO_PERDIDO,
                description: `No-show · ${ride.route.name}`,
                amount: -toMoney(credit.monetaryValue),
              },
            });
          });
        }
      }

      return { ok: true };
    },
  );

  app.post(
    "/rides/:id/passenger-confirm",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const ride = await prisma.rideInstance.findUnique({
        where: { id: params.id },
        include: {
          route: true,
          bookings: {
            where: { userId: request.auth!.userId, status: "ACTIVE" },
            include: { creditEntries: true },
          },
        },
      });
      if (!ride) {
        return reply.notFound("Viagem nao encontrada.");
      }
      const booking = ride.bookings[0];
      if (!booking) {
        return reply.forbidden("Usuario nao participa desta viagem.");
      }

      const updatedRide = await prisma.rideInstance.update({
        where: { id: ride.id },
        data: {
          passengerConfirmedAt: new Date(),
          status:
            ride.driverConfirmedAt && ride.passengerBoarded !== false
              ? RideStatus.CONFIRMED
              : ride.status,
        },
      });

      if (updatedRide.driverConfirmedAt && updatedRide.passengerConfirmedAt) {
        const credit = booking.creditEntries[0];
        if (credit && credit.status === CreditStatus.RESERVADO) {
          await prisma.$transaction(async (tx) => {
            await tx.creditLedgerEntry.update({
              where: { id: credit.id },
              data: {
                status: CreditStatus.CONSUMIDO,
                rideInstanceId: ride.id,
                description: `Viagem confirmada · ${ride.route.name}`,
              },
            });

            await tx.walletTransaction.createMany({
              data: [
                {
                  userId: booking.userId,
                  bookingId: booking.id,
                  rideInstanceId: ride.id,
                  type: WalletTransactionType.CREDITO_CONSUMIDO,
                  description: `Credito consumido · ${ride.route.name}`,
                  amount: -toMoney(credit.monetaryValue),
                },
                {
                  userId: ride.route.driverId,
                  bookingId: booking.id,
                  rideInstanceId: ride.id,
                  type: WalletTransactionType.REPASSE,
                  description: `Repasse de viagem · ${ride.route.name}`,
                  amount: toMoney(credit.monetaryValue),
                },
              ],
            });
          });
        }
      }

      return { ok: true };
    },
  );

  app.post("/rides/:id/dispute", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const ride = await prisma.rideInstance.findUnique({
      where: { id: params.id },
      include: {
        route: true,
        bookings: true,
      },
    });
    if (!ride) {
      return reply.notFound("Viagem nao encontrada.");
    }
    const authorized =
      ride.route.driverId === request.auth!.userId ||
      ride.bookings.some((booking) => booking.userId === request.auth!.userId);
    if (!authorized) {
      return reply.forbidden("Usuario nao pode abrir disputa nesta viagem.");
    }

    await prisma.rideInstance.update({
      where: { id: ride.id },
      data: { status: RideStatus.DISPUTE },
    });

    return { ok: true };
  });
}
