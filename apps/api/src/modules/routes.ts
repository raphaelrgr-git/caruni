import {
  BookingStatus,
  CreditStatus,
  NotificationKind,
  RouteStatus,
  RouteVisibilityMode,
  UserRole,
  WalletTransactionType,
} from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config.js";
import { generateRideInstancesForRoute, resolveRealRoute } from "../lib/domain.js";
import { buildBookingDeepLink, createNotification } from "../lib/notifications.js";
import { prisma } from "../prisma.js";
import { createRouteSystemMessage } from "./chat.js";

const routeVisibilitySchema = z.nativeEnum(RouteVisibilityMode);

function normalizeSeatSplit(seats: number, visibilityMode: RouteVisibilityMode, publicSeats?: number, privateSeats?: number) {
  if (visibilityMode === RouteVisibilityMode.PUBLICA) {
    return { publicSeats: seats, privateSeats: 0 };
  }
  if (visibilityMode === RouteVisibilityMode.PRIVADA) {
    return { publicSeats: 0, privateSeats: seats };
  }

  const normalizedPublicSeats = publicSeats ?? Math.ceil(seats / 2);
  const normalizedPrivateSeats = privateSeats ?? seats - normalizedPublicSeats;
  if (normalizedPublicSeats < 0 || normalizedPrivateSeats < 0 || normalizedPublicSeats + normalizedPrivateSeats !== seats) {
    throw new Error("No modo híbrido, vagas públicas e privadas devem somar o total de assentos.");
  }
  return { publicSeats: normalizedPublicSeats, privateSeats: normalizedPrivateSeats };
}

function buildRouteChangeSnapshot(params: {
  previousDepartureTime: string;
  nextDepartureTime: string;
  previousOriginLabel: string;
  nextOriginLabel: string;
  previousDestinationLabel: string;
  nextDestinationLabel: string;
  previousDistanceMeters: number;
  nextDistanceMeters: number;
  previousDurationSeconds: number;
  nextDurationSeconds: number;
}) {
  const impactMinutes = Math.round((params.nextDurationSeconds - params.previousDurationSeconds) / 60);
  return {
    ...params,
    impactMinutes,
  };
}

export async function registerRoutesModule(app: FastifyInstance) {
  app.get("/routes", async (request) => {
    const query = z
      .object({
        origin: z.string().optional(),
        destination: z.string().optional(),
        driverId: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(50),
      })
      .parse(request.query);

    const routes = await prisma.route.findMany({
      where: {
        AND: [
          query.origin
            ? {
                OR: [
                  { originLabel: { contains: query.origin, mode: "insensitive" } },
                  { city: { contains: query.origin, mode: "insensitive" } },
                ],
              }
            : {},
          query.destination
            ? {
                destinationLabel: { contains: query.destination, mode: "insensitive" },
              }
            : {},
          query.driverId ? { driverId: query.driverId } : {},
        ],
      },
      include: {
        driver: true,
        bookings: { where: { status: "ACTIVE" } },
      },
      take: query.limit,
      orderBy: { createdAt: "desc" },
    });

    return routes.map((route) => ({
      id: route.id,
      name: route.name,
      city: route.city,
      originLabel: route.originLabel,
      originLat: route.originLat,
      originLng: route.originLng,
      destinationLabel: route.destinationLabel,
      destinationLat: route.destinationLat,
      destinationLng: route.destinationLng,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      geometry: route.geometry,
      departureTime: route.departureTime,
      weekdays: route.weekdays,
      seats: route.seats,
      version: route.version,
      status: route.status,
      visibilityMode: route.visibilityMode,
      publicSeats: route.publicSeats ?? route.seats,
      privateSeats: route.privateSeats ?? 0,
      occupiedSeats: route.bookings.length,
      driver: {
        id: route.driver.id,
        name: route.driver.name,
        photoUrl: route.driver.photoUrl,
      },
    }));
  });

  app.get("/routes/:id", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        driver: {
          include: {
            reviewsReceived: true,
          },
        },
        bookings: {
          where: { status: "ACTIVE" },
          include: { user: true },
        },
        rideInstances: {
          orderBy: { scheduledAt: "asc" },
          take: 10,
        },
      },
    });
    if (!route) {
      return reply.notFound("Rota nao encontrada.");
    }

    const avgRating =
      route.driver.reviewsReceived.length > 0
        ? route.driver.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) /
          route.driver.reviewsReceived.length
        : null;

    return {
      id: route.id,
      name: route.name,
      city: route.city,
      origin: {
        label: route.originLabel,
        lat: route.originLat,
        lng: route.originLng,
      },
      destination: {
        label: route.destinationLabel,
        lat: route.destinationLat,
        lng: route.destinationLng,
      },
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      geometry: route.geometry,
      weekdays: route.weekdays,
      departureTime: route.departureTime,
      seats: route.seats,
      version: route.version,
      status: route.status,
      visibilityMode: route.visibilityMode,
      publicSeats: route.publicSeats ?? route.seats,
      privateSeats: route.privateSeats ?? 0,
      occupiedSeats: route.bookings.length,
      driver: {
        id: route.driver.id,
        name: route.driver.name,
        course: route.driver.course,
        photoUrl: route.driver.photoUrl,
        rating: avgRating,
        role: route.driver.role,
      },
      passengers: route.bookings.map((booking) => ({
        id: booking.user.id,
        name: booking.user.name,
        course: booking.user.course,
      })),
      nextRides: route.rideInstances,
    };
  });

  app.post("/routes", { preHandler: app.authenticate }, async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(2),
        city: z.string().min(2).default("Joinville"),
        originLabel: z.string().min(2),
        originLat: z.number(),
        originLng: z.number(),
        destinationLabel: z.string().min(2),
        destinationLat: z.number(),
        destinationLng: z.number(),
        weekdays: z.array(z.number().int().min(0).max(6)).min(1),
        departureTime: z.string().regex(/^\d{2}:\d{2}$/),
        seats: z.number().int().min(1).max(7),
        visibilityMode: routeVisibilitySchema.default(RouteVisibilityMode.PUBLICA),
        publicSeats: z.number().int().min(0).optional(),
        privateSeats: z.number().int().min(0).optional(),
      })
      .parse(request.body);

    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      include: { vehicle: true },
    });
    if (!user) {
      return reply.notFound("Usuario nao encontrado.");
    }
    if (user.role !== UserRole.MOTORISTA) {
      return reply.forbidden("Apenas motoristas podem criar rotas.");
    }
    if (!user.vehicle) {
      return reply.badRequest("Complete os dados do veiculo antes de operar uma rota.");
    }

    const seatSplit = normalizeSeatSplit(
      body.seats,
      body.visibilityMode,
      body.publicSeats,
      body.privateSeats,
    );

    const preview = await resolveRealRoute({
      origin: { lat: body.originLat, lng: body.originLng },
      destination: { lat: body.destinationLat, lng: body.destinationLng },
      googleMapsServerApiKey: env.GOOGLE_MAPS_SERVER_API_KEY,
      orsApiKey: env.ORS_API_KEY,
    });

    const route = await prisma.route.create({
      data: {
        driverId: request.auth!.userId,
        name: body.name,
        city: body.city,
        originLabel: body.originLabel,
        originLat: body.originLat,
        originLng: body.originLng,
        destinationLabel: body.destinationLabel,
        destinationLat: body.destinationLat,
        destinationLng: body.destinationLng,
        weekdays: body.weekdays,
        departureTime: body.departureTime,
        seats: body.seats,
        visibilityMode: body.visibilityMode,
        publicSeats: seatSplit.publicSeats,
        privateSeats: seatSplit.privateSeats,
        distanceMeters: preview.distanceMeters,
        durationSeconds: preview.durationSeconds,
        geometry: preview.geometry,
      },
    });

    await generateRideInstancesForRoute(route.id);

    return reply.code(201).send({
      id: route.id,
      name: route.name,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      geometry: route.geometry,
      provider: preview.provider,
    });
  });

  app.get("/routes/:id/change-preview", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const query = z
      .object({
        originLabel: z.string().min(2),
        originLat: z.coerce.number(),
        originLng: z.coerce.number(),
        destinationLabel: z.string().min(2),
        destinationLat: z.coerce.number(),
        destinationLng: z.coerce.number(),
        departureTime: z.string().regex(/^\d{2}:\d{2}$/),
      })
      .parse(request.query);

    const route = await prisma.route.findUnique({ where: { id: params.id } });
    if (!route) return reply.notFound("Rota nao encontrada.");
    if (route.driverId !== request.auth!.userId) {
      return reply.forbidden("Apenas o motorista da rota pode simular alterações.");
    }

    const preview = await resolveRealRoute({
      origin: { lat: query.originLat, lng: query.originLng },
      destination: { lat: query.destinationLat, lng: query.destinationLng },
      googleMapsServerApiKey: env.GOOGLE_MAPS_SERVER_API_KEY,
      orsApiKey: env.ORS_API_KEY,
    });

    return buildRouteChangeSnapshot({
      previousDepartureTime: route.departureTime,
      nextDepartureTime: query.departureTime,
      previousOriginLabel: route.originLabel,
      nextOriginLabel: query.originLabel,
      previousDestinationLabel: route.destinationLabel,
      nextDestinationLabel: query.destinationLabel,
      previousDistanceMeters: route.distanceMeters,
      nextDistanceMeters: preview.distanceMeters,
      previousDurationSeconds: route.durationSeconds,
      nextDurationSeconds: preview.durationSeconds,
    });
  });

  app.patch("/routes/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        name: z.string().min(2).optional(),
        city: z.string().min(2).optional(),
        originLabel: z.string().min(2),
        originLat: z.number(),
        originLng: z.number(),
        destinationLabel: z.string().min(2),
        destinationLat: z.number(),
        destinationLng: z.number(),
        weekdays: z.array(z.number().int().min(0).max(6)).min(1),
        departureTime: z.string().regex(/^\d{2}:\d{2}$/),
        seats: z.number().int().min(1).max(7),
        visibilityMode: routeVisibilitySchema,
        publicSeats: z.number().int().min(0).optional(),
        privateSeats: z.number().int().min(0).optional(),
      })
      .parse(request.body);

    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          where: { status: BookingStatus.ACTIVE },
        },
      },
    });
    if (!route) return reply.notFound("Rota nao encontrada.");
    if (route.driverId !== request.auth!.userId) {
      return reply.forbidden("Apenas o motorista da rota pode editar a rota.");
    }
    if (route.editCount >= 2) {
      return reply.badRequest("Esta rota já atingiu o limite de 2 edições relevantes.");
    }

    const seatSplit = normalizeSeatSplit(
      body.seats,
      body.visibilityMode,
      body.publicSeats,
      body.privateSeats,
    );

    const preview = await resolveRealRoute({
      origin: { lat: body.originLat, lng: body.originLng },
      destination: { lat: body.destinationLat, lng: body.destinationLng },
      googleMapsServerApiKey: env.GOOGLE_MAPS_SERVER_API_KEY,
      orsApiKey: env.ORS_API_KEY,
    });

    const snapshot = buildRouteChangeSnapshot({
      previousDepartureTime: route.departureTime,
      nextDepartureTime: body.departureTime,
      previousOriginLabel: route.originLabel,
      nextOriginLabel: body.originLabel,
      previousDestinationLabel: route.destinationLabel,
      nextDestinationLabel: body.destinationLabel,
      previousDistanceMeters: route.distanceMeters,
      nextDistanceMeters: preview.distanceMeters,
      previousDurationSeconds: route.durationSeconds,
      nextDurationSeconds: preview.durationSeconds,
    });

    const hasActivePassengers = route.bookings.length > 0;
    const nextVersion = route.version + 1;
    const deadlineAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRoute = await tx.route.update({
        where: { id: route.id },
        data: {
          name: body.name ?? route.name,
          city: body.city ?? route.city,
          originLabel: body.originLabel,
          originLat: body.originLat,
          originLng: body.originLng,
          destinationLabel: body.destinationLabel,
          destinationLat: body.destinationLat,
          destinationLng: body.destinationLng,
          weekdays: body.weekdays,
          departureTime: body.departureTime,
          seats: body.seats,
          visibilityMode: body.visibilityMode,
          publicSeats: seatSplit.publicSeats,
          privateSeats: seatSplit.privateSeats,
          distanceMeters: preview.distanceMeters,
          durationSeconds: preview.durationSeconds,
          geometry: preview.geometry,
          version: nextVersion,
          editCount: { increment: 1 },
          status: hasActivePassengers ? RouteStatus.PENDENTE_CONFIRMACAO : RouteStatus.ATIVA,
        },
      });

      const futureRides = await tx.rideInstance.findMany({
        where: {
          routeId: route.id,
          scheduledAt: { gte: new Date() },
        },
      });

      for (const ride of futureRides) {
        const nextScheduledAt = new Date(ride.scheduledAt);
        const [hours, minutes] = body.departureTime.split(":").map(Number);
        nextScheduledAt.setHours(hours, minutes, 0, 0);
        await tx.rideInstance.update({
          where: { id: ride.id },
          data: { scheduledAt: nextScheduledAt },
        });
      }

      if (hasActivePassengers) {
        await tx.routeChangeConfirmation.deleteMany({
          where: { routeId: route.id, status: "PENDING" },
        });

        for (const booking of route.bookings) {
          await tx.routeChangeConfirmation.create({
            data: {
              routeId: route.id,
              bookingId: booking.id,
              userId: booking.userId,
              fromVersion: route.version,
              toVersion: nextVersion,
              deadlineAt,
              ...snapshot,
            },
          });

          await tx.booking.update({
            where: { id: booking.id },
            data: { lastConfirmedRouteVersion: route.version },
          });
        }
      }

      return updatedRoute;
    });

    if (hasActivePassengers) {
      for (const booking of route.bookings) {
        void createNotification({
          userId: booking.userId,
          kind: NotificationKind.ROTA_ALTERADA_RECONFIRMACAO,
          title: "Sua carona foi alterada",
          message: `A rota ${updated.name} mudou. Confirme se deseja continuar nela.`,
          actionRequired: true,
          deepLink: buildBookingDeepLink(booking.id),
          expiresAt: deadlineAt,
          metadata: {
            routeId: updated.id,
            fromVersion: route.version,
            toVersion: nextVersion,
            impactMinutes: snapshot.impactMinutes,
          },
        });
      }

      await createRouteSystemMessage(
        route.id,
        "O motorista atualizou a rota. Os passageiros precisam confirmar permanência.",
      );
    }

    await generateRideInstancesForRoute(route.id);

    return {
      id: updated.id,
      version: updated.version,
      status: updated.status,
      hasPendingConfirmations: hasActivePassengers,
      deadlineAt: hasActivePassengers ? deadlineAt : null,
      change: snapshot,
    };
  });

  app.get("/my/pending-route-changes", { preHandler: app.authenticate }, async (request) => {
    const confirmations = await prisma.routeChangeConfirmation.findMany({
      where: {
        userId: request.auth!.userId,
        status: "PENDING",
        deadlineAt: { gt: new Date() },
      },
      include: {
        route: true,
        booking: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return confirmations.map((item) => ({
      id: item.id,
      routeId: item.routeId,
      bookingId: item.bookingId,
      fromVersion: item.fromVersion,
      toVersion: item.toVersion,
      status: item.status,
      deadlineAt: item.deadlineAt,
      route: {
        id: item.route.id,
        name: item.route.name,
        status: item.route.status,
      },
      diff: {
        previousDepartureTime: item.previousDepartureTime,
        nextDepartureTime: item.nextDepartureTime,
        previousOriginLabel: item.previousOriginLabel,
        nextOriginLabel: item.nextOriginLabel,
        previousDestinationLabel: item.previousDestinationLabel,
        nextDestinationLabel: item.nextDestinationLabel,
        previousDistanceMeters: item.previousDistanceMeters,
        nextDistanceMeters: item.nextDistanceMeters,
        previousDurationSeconds: item.previousDurationSeconds,
        nextDurationSeconds: item.nextDurationSeconds,
        impactMinutes: item.impactMinutes,
      },
    }));
  });

  app.post(
    "/route-change-confirmations/:id/confirm",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const confirmation = await prisma.routeChangeConfirmation.findUnique({
        where: { id: params.id },
        include: { booking: true, route: true },
      });
      if (!confirmation || confirmation.userId !== request.auth!.userId) {
        return reply.notFound("Alteração pendente não encontrada.");
      }
      if (confirmation.status !== "PENDING") {
        return reply.badRequest("Esta alteração já foi respondida.");
      }

      await prisma.$transaction(async (tx) => {
        await tx.routeChangeConfirmation.update({
          where: { id: confirmation.id },
          data: { status: "CONFIRMED" },
        });
        await tx.booking.update({
          where: { id: confirmation.bookingId },
          data: { lastConfirmedRouteVersion: confirmation.toVersion },
        });

        const remaining = await tx.routeChangeConfirmation.count({
          where: {
            routeId: confirmation.routeId,
            status: "PENDING",
            id: { not: confirmation.id },
          },
        });

        if (remaining === 0) {
          await tx.route.update({
            where: { id: confirmation.routeId },
            data: { status: RouteStatus.ATIVA },
          });
        }
      });

      return { ok: true };
    },
  );

  app.post(
    "/route-change-confirmations/:id/decline",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const confirmation = await prisma.routeChangeConfirmation.findUnique({
        where: { id: params.id },
        include: {
          booking: {
            include: {
              creditEntries: true,
            },
          },
          route: true,
        },
      });
      if (!confirmation || confirmation.userId !== request.auth!.userId) {
        return reply.notFound("Alteração pendente não encontrada.");
      }
      if (confirmation.status !== "PENDING") {
        return reply.badRequest("Esta alteração já foi respondida.");
      }

      await prisma.$transaction(async (tx) => {
        await tx.routeChangeConfirmation.update({
          where: { id: confirmation.id },
          data: { status: "DECLINED" },
        });
        await tx.booking.update({
          where: { id: confirmation.bookingId },
          data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
        });

        const credit = confirmation.booking.creditEntries[0];
        if (credit) {
          await tx.creditLedgerEntry.update({
            where: { id: credit.id },
            data: {
              status: CreditStatus.DISPONIVEL,
              bookingId: null,
              description: `Credito devolvido · alteração da rota ${confirmation.route.name}`,
            },
          });
          await tx.walletTransaction.create({
            data: {
              userId: confirmation.userId,
              bookingId: confirmation.bookingId,
              rideInstanceId: confirmation.booking.rideInstanceId,
              type: WalletTransactionType.CREDITO_DEVOLVIDO,
              description: `Credito devolvido · alteração da rota ${confirmation.route.name}`,
              amount: 0,
            },
          });
        }

        const remaining = await tx.routeChangeConfirmation.count({
          where: {
            routeId: confirmation.routeId,
            status: "PENDING",
            id: { not: confirmation.id },
          },
        });
        if (remaining === 0) {
          await tx.route.update({
            where: { id: confirmation.routeId },
            data: { status: RouteStatus.ATIVA },
          });
        }
      });

      void createNotification({
        userId: confirmation.route.driverId,
        kind: NotificationKind.ROTA_ALTERADA_REMOVIDO,
        title: "Passageiro saiu da rota alterada",
        message: "Um passageiro preferiu cancelar sem penalidade após a mudança da rota.",
        deepLink: buildBookingDeepLink(confirmation.bookingId),
      });

      return { ok: true };
    },
  );

  app.delete("/routes/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);

    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          select: {
            id: true,
          },
        },
        rideInstances: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!route) {
      return reply.notFound("Rota nao encontrada.");
    }

    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.MOTORISTA) {
      return reply.forbidden("Apenas motoristas podem excluir rotas.");
    }

    if (route.driverId !== request.auth!.userId) {
      return reply.forbidden("Apenas o motorista desta rota pode excluir a rota.");
    }

    const bookingIds = route.bookings.map((booking) => booking.id);
    const rideIds = route.rideInstances.map((ride) => ride.id);

    await prisma.$transaction(async (tx) => {
      if (bookingIds.length > 0) {
        await tx.walletTransaction.deleteMany({
          where: {
            OR: [{ bookingId: { in: bookingIds } }, { rideInstanceId: { in: rideIds } }],
          },
        });

        await tx.creditLedgerEntry.updateMany({
          where: {
            OR: [{ bookingId: { in: bookingIds } }, { rideInstanceId: { in: rideIds } }],
          },
          data: {
            bookingId: null,
            rideInstanceId: null,
            status: "EXPIRADO",
            description: `Rota excluida · ${route.name}`,
          },
        });

        await tx.booking.deleteMany({
          where: { id: { in: bookingIds } },
        });
      }

      if (rideIds.length > 0) {
        await tx.rideInstance.deleteMany({
          where: { id: { in: rideIds } },
        });
      }

      await tx.routeChatMessage.deleteMany({
        where: { routeId: route.id },
      });

      await tx.review.deleteMany({
        where: { routeId: route.id },
      });

      await tx.route.delete({
        where: { id: route.id },
      });
    });

    return { ok: true };
  });
}
