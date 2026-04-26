import { CreditStatus, RideStatus, RouteStatus, WalletTransactionType } from "@prisma/client";
import { prisma } from "../prisma.js";
import { buildBookingDeepLink, buildRideDeepLink, createNotification } from "./notifications.js";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function checkConfirmationReminders(): Promise<void> {
  const now = new Date();
  const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const windowMs = 90_000; // ±1.5 min window

  // T-12h reminder
  const rides12h = await prisma.rideInstance.findMany({
    where: {
      status: RideStatus.SCHEDULED,
      scheduledAt: {
        gte: new Date(in12h.getTime() - windowMs),
        lte: new Date(in12h.getTime() + windowMs),
      },
      reminderSentAt: null,
    },
    include: {
      route: true,
      bookings: {
        where: { status: "ACTIVE" },
        select: { id: true, userId: true },
      },
    },
  });

  for (const ride of rides12h) {
    await createNotification({
      userId: ride.route.driverId,
      kind: "RIDE_CONFIRMATION_REMINDER",
      title: "Confirme sua viagem",
      message: `Sua viagem parte às ${formatTime(ride.scheduledAt)}. Confirme presença em até 12h.`,
      actionRequired: true,
      deepLink: buildRideDeepLink(ride.id),
      expiresAt: ride.scheduledAt,
    });

    for (const booking of ride.bookings) {
      await createNotification({
        userId: booking.userId,
        kind: "RIDE_CONFIRMATION_REMINDER",
        title: "Confirme sua carona",
        message: `A carona parte às ${formatTime(ride.scheduledAt)}. Confirme sua presença.`,
        actionRequired: true,
        deepLink: buildBookingDeepLink(booking.id),
        expiresAt: ride.scheduledAt,
      });
    }

    await prisma.rideInstance.update({
      where: { id: ride.id },
      data: { reminderSentAt: now },
    });
  }

  // T-1h urgent reminder
  const rides1h = await prisma.rideInstance.findMany({
    where: {
      status: RideStatus.SCHEDULED,
      scheduledAt: {
        gte: new Date(in1h.getTime() - windowMs),
        lte: new Date(in1h.getTime() + windowMs),
      },
      urgentReminderSentAt: null,
    },
    include: {
      route: true,
      bookings: {
        where: { status: "ACTIVE" },
        select: { id: true, userId: true },
      },
    },
  });

  for (const ride of rides1h) {
    await createNotification({
      userId: ride.route.driverId,
      kind: "RIDE_CONFIRMATION_URGENT",
      title: "Última chance: confirme agora",
      message: `Sua viagem parte em 1h (${formatTime(ride.scheduledAt)}). Confirme presença ou ela será cancelada.`,
      actionRequired: true,
      deepLink: buildRideDeepLink(ride.id),
      expiresAt: ride.scheduledAt,
    });

    for (const booking of ride.bookings) {
      await createNotification({
        userId: booking.userId,
        kind: "RIDE_CONFIRMATION_URGENT",
        title: "Última chance: confirme agora",
        message: `A carona parte em 1h (${formatTime(ride.scheduledAt)}). Confirme ou perca sua vaga.`,
        actionRequired: true,
        deepLink: buildBookingDeepLink(booking.id),
        expiresAt: ride.scheduledAt,
      });
    }

    await prisma.rideInstance.update({
      where: { id: ride.id },
      data: { urgentReminderSentAt: now },
    });
  }
}

async function autoCancelUnconfirmed(): Promise<void> {
  // Rides that departed 30+ minutes ago and are still SCHEDULED
  const staleRides = await prisma.rideInstance.findMany({
    where: {
      status: RideStatus.SCHEDULED,
      scheduledAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
    },
    include: {
      route: true,
      bookings: {
        where: { status: "ACTIVE" },
        select: { id: true, userId: true },
      },
    },
  });

  for (const ride of staleRides) {
    await prisma.rideInstance.update({
      where: { id: ride.id },
      data: { status: RideStatus.CANCELLED },
    });

    await createNotification({
      userId: ride.route.driverId,
      kind: "RIDE_CANCELLED_AUTO",
      title: "Viagem cancelada automaticamente",
      message: "Sua viagem foi cancelada por falta de confirmação no prazo.",
    });

    for (const booking of ride.bookings) {
      await createNotification({
        userId: booking.userId,
        kind: "RIDE_CANCELLED_AUTO",
        title: "Carona cancelada",
        message: "A carona foi cancelada automaticamente por falta de confirmação do motorista.",
      });
    }
  }
}

async function expireRouteChangeConfirmations(): Promise<void> {
  const now = new Date();
  const pending = await prisma.routeChangeConfirmation.findMany({
    where: {
      status: "PENDING",
      deadlineAt: { lte: now },
    },
    include: {
      route: true,
      booking: {
        include: {
          creditEntries: true,
        },
      },
    },
  });

  for (const confirmation of pending) {
    await prisma.$transaction(async (tx) => {
      await tx.routeChangeConfirmation.update({
        where: { id: confirmation.id },
        data: { status: "EXPIRED" },
      });

      if (confirmation.booking.status === "ACTIVE") {
        await tx.booking.update({
          where: { id: confirmation.bookingId },
          data: { status: "CANCELLED", cancelledAt: now },
        });
      }

      const credit = confirmation.booking.creditEntries[0];
      if (credit) {
        await tx.creditLedgerEntry.update({
          where: { id: credit.id },
          data: {
            status: CreditStatus.DISPONIVEL,
            bookingId: null,
            description: `Credito devolvido · alteração sem resposta na rota ${confirmation.route.name}`,
          },
        });
        await tx.walletTransaction.create({
          data: {
            userId: confirmation.userId,
            bookingId: confirmation.bookingId,
            rideInstanceId: confirmation.booking.rideInstanceId,
            type: WalletTransactionType.CREDITO_DEVOLVIDO,
            description: `Credito devolvido · alteração sem resposta na rota ${confirmation.route.name}`,
            amount: 0,
          },
        });
      }

      const remaining = await tx.routeChangeConfirmation.count({
        where: {
          routeId: confirmation.routeId,
          status: "PENDING",
        },
      });
      if (remaining === 0) {
        await tx.route.update({
          where: { id: confirmation.routeId },
          data: { status: RouteStatus.ATIVA },
        });
      }
    });

    await createNotification({
      userId: confirmation.userId,
      kind: "ROTA_ALTERADA_REMOVIDO",
      title: "Você foi removido da carona alterada",
      message: "Como não houve confirmação no prazo, sua vaga foi liberada sem penalidade.",
      deepLink: buildBookingDeepLink(confirmation.bookingId),
    });
  }
}

export function startScheduler(): void {
  setInterval(() => {
    void checkConfirmationReminders().catch(console.error);
    void autoCancelUnconfirmed().catch(console.error);
    void expireRouteChangeConfirmations().catch(console.error);
  }, 60_000);
}
