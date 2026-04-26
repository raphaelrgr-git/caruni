import {
  ConnectionKind,
  CreditStatus,
  RideStatus,
  UserRole,
  WalletTransactionType,
} from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toMoney } from "../lib/domain.js";
import {
  buildBookingDeepLink,
  buildRideDeepLink,
  createNotification,
} from "../lib/notifications.js";
import { prisma } from "../prisma.js";

// ---------------------------------------------------------------------------
// Streak helpers
// ---------------------------------------------------------------------------

async function updateStreak(userId: string, role: UserRole, planId: string | null) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  const existing = await prisma.userStreak.findUnique({ where: { userId } });

  let currentStreak = existing?.currentStreak ?? 0;
  let longestStreak = existing?.longestStreak ?? 0;
  const totalRides = (existing?.totalRides ?? 0) + 1;
  let freeRidesEarned = existing?.freeRidesEarned ?? 0;
  let milestone5 = existing?.milestone5 ?? false;
  let milestone10 = existing?.milestone10 ?? false;
  let milestone20 = existing?.milestone20 ?? false;

  if (existing?.lastRideAt) {
    const last = new Date(existing.lastRideAt);
    const lastStart = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    if (lastStart.getTime() === todayStart.getTime()) {
      // Same day — don't increment streak again
    } else if (lastStart.getTime() === yesterdayStart.getTime()) {
      // Consecutive day
      currentStreak += 1;
    } else {
      // Gap — reset
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  // Passenger: 1 free credit every 8 consecutive trips
  if (role === UserRole.PASSAGEIRO && currentStreak > 0 && currentStreak % 8 === 0) {
    freeRidesEarned += 1;
    // Grant a free credit if we have a planId reference
    if (planId) {
      await prisma.creditLedgerEntry.create({
        data: {
          userId,
          planId,
          status: CreditStatus.DISPONIVEL,
          monetaryValue: 0,
          description: `🔥 Viagem grátis · streak de ${currentStreak} viagens`,
          expiresAt: new Date(Date.now() + 7 * 86_400_000),
        },
      });
    }
  }

  // Driver: milestones
  if (role === UserRole.MOTORISTA) {
    if (!milestone5 && currentStreak >= 5) milestone5 = true;
    if (!milestone10 && currentStreak >= 10) milestone10 = true;
    if (!milestone20 && currentStreak >= 20) milestone20 = true;
  }

  await prisma.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak,
      longestStreak,
      lastRideAt: now,
      totalRides,
      freeRidesEarned,
      milestone5,
      milestone10,
      milestone20,
    },
    update: {
      currentStreak,
      longestStreak,
      lastRideAt: now,
      totalRides,
      freeRidesEarned,
      milestone5,
      milestone10,
      milestone20,
    },
  });
}

async function upsertConnectionPair({
  userId,
  connectedUserId,
  kind,
}: {
  userId: string;
  connectedUserId: string;
  kind: ConnectionKind;
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
      lastInteractedAt: new Date(),
    },
    update: {
      kind,
      tripsTogether: { increment: 1 },
      lastInteractedAt: new Date(),
      isHidden: false,
    },
  });
}

async function syncConnectionsForConfirmedRide(rideId: string) {
  const ride = await prisma.rideInstance.findUnique({
    where: { id: rideId },
    include: {
      route: true,
      bookings: {
        where: { status: "ACTIVE" },
        include: {
          user: true,
        },
      },
    },
  });

  if (!ride || ride.status !== RideStatus.CONFIRMED) return;

  const passengers = ride.bookings.map((booking) => booking.user);

  for (const passenger of passengers) {
    await upsertConnectionPair({
      userId: ride.route.driverId,
      connectedUserId: passenger.id,
      kind: ConnectionKind.MOTORISTA_PASSAGEIRO,
    });
    await upsertConnectionPair({
      userId: passenger.id,
      connectedUserId: ride.route.driverId,
      kind: ConnectionKind.MOTORISTA_PASSAGEIRO,
    });
  }

  for (let index = 0; index < passengers.length; index += 1) {
    for (let next = index + 1; next < passengers.length; next += 1) {
      await upsertConnectionPair({
        userId: passengers[index]!.id,
        connectedUserId: passengers[next]!.id,
        kind: ConnectionKind.PASSAGEIRO_PASSAGEIRO,
      });
      await upsertConnectionPair({
        userId: passengers[next]!.id,
        connectedUserId: passengers[index]!.id,
        kind: ConnectionKind.PASSAGEIRO_PASSAGEIRO,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

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
      const user = await prisma.user.findUnique({
        where: { id: request.auth!.userId },
        select: { role: true },
      });
      if (!user || user.role !== UserRole.MOTORISTA) {
        return reply.forbidden("Apenas motoristas podem confirmar embarque.");
      }
      if (ride.route.driverId !== request.auth!.userId) {
        return reply.forbidden("Apenas o motorista desta rota pode confirmar embarque.");
      }

      const updatedRide = await prisma.rideInstance.update({
        where: { id: ride.id },
        data: {
          driverConfirmedAt: new Date(),
          passengerBoarded: body.boarded,
          status:
            ride.passengerConfirmedAt && body.boarded ? RideStatus.CONFIRMED : ride.status,
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

      // Update driver streak and notify when ride is fully confirmed
      if (updatedRide.status === RideStatus.CONFIRMED && ride.status !== RideStatus.CONFIRMED) {
        void updateStreak(request.auth!.userId, UserRole.MOTORISTA, null);
        void syncConnectionsForConfirmedRide(updatedRide.id);

        // Notify all passengers that the ride is confirmed
        for (const booking of ride.bookings) {
          void createNotification({
            userId: booking.userId,
            kind: "RIDE_CONFIRMED",
            title: "Viagem confirmada!",
            message: `O motorista confirmou a viagem. Tudo certo para ${new Date(ride.scheduledAt).toLocaleDateString("pt-BR")}.`,
            deepLink: buildBookingDeepLink(booking.id),
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
      const user = await prisma.user.findUnique({
        where: { id: request.auth!.userId },
        select: { role: true },
      });
      if (!user || user.role !== UserRole.PASSAGEIRO) {
        return reply.forbidden("Apenas passageiros podem confirmar a propria viagem.");
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
                ...(booking.negotiatedExtraAmount.gt(0)
                  ? [
                      {
                        userId: booking.userId,
                        bookingId: booking.id,
                        rideInstanceId: ride.id,
                        type: WalletTransactionType.NEGOCIACAO_EXTRA_COBRADO,
                        description: `Extra negociado · ${ride.route.name}`,
                        amount: -toMoney(booking.negotiatedExtraAmount),
                      },
                      {
                        userId: ride.route.driverId,
                        bookingId: booking.id,
                        rideInstanceId: ride.id,
                        type: WalletTransactionType.NEGOCIACAO_EXTRA_REPASSE,
                        description: `Repasse extra negociado · ${ride.route.name}`,
                        amount: toMoney(booking.negotiatedExtraAmount),
                      },
                    ]
                  : []),
              ],
            });
          });
        }

        // Update passenger streak and notify when ride is fully confirmed
        if (updatedRide.status === RideStatus.CONFIRMED && ride.status !== RideStatus.CONFIRMED) {
          // Find active plan for free credit granting
          const sub = await prisma.userSubscription.findFirst({
            where: { userId: request.auth!.userId, status: "ACTIVE" },
            include: { plan: true },
          });
          void updateStreak(request.auth!.userId, UserRole.PASSAGEIRO, sub?.planId ?? null);
          void syncConnectionsForConfirmedRide(updatedRide.id);

          // Notify driver that passenger confirmed
          void createNotification({
            userId: ride.route.driverId,
            kind: "RIDE_CONFIRMED",
            title: "Viagem confirmada!",
            message: `O passageiro confirmou presença. A viagem de ${new Date(ride.scheduledAt).toLocaleDateString("pt-BR")} está confirmada.`,
            deepLink: buildRideDeepLink(ride.id),
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

    // Notify the other party about the dispute
    const isDriver = ride.route.driverId === request.auth!.userId;
    if (isDriver) {
      for (const booking of ride.bookings) {
        void createNotification({
          userId: booking.userId,
          kind: "RIDE_DISPUTE_OPENED",
          title: "Disputa aberta",
          message: "O motorista abriu uma disputa para esta viagem. Nossa equipe irá analisar.",
          deepLink: buildBookingDeepLink(booking.id),
        });
      }
    } else {
      void createNotification({
        userId: ride.route.driverId,
        kind: "RIDE_DISPUTE_OPENED",
        title: "Disputa aberta",
        message: "Um passageiro abriu uma disputa para esta viagem. Nossa equipe irá analisar.",
        deepLink: buildRideDeepLink(ride.id),
      });
    }

    return { ok: true };
  });
}
