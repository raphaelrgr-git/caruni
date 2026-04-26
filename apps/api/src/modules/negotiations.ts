import { RideNegotiationStatus, UserRole } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config.js";
import { resolveRealRoute } from "../lib/domain.js";
import {
  buildBookingDeepLink,
  buildRideDeepLink,
  createNotification,
} from "../lib/notifications.js";
import { prisma } from "../prisma.js";
import { createRouteSystemMessage } from "./chat.js";

const MAX_DETOUR_MINUTES = 7;
const MAX_ROUNDS = 2;
const EXPIRATION_MINUTES = 15;
const MIN_EXTRA_AMOUNT_CENTS = 400;
const MAX_EXTRA_AMOUNT_CENTS = 3000;
const EXTRA_AMOUNT_STEP_CENTS = 50;

function isValidExtraAmountCents(value: number) {
  return (
    value >= MIN_EXTRA_AMOUNT_CENTS &&
    value <= MAX_EXTRA_AMOUNT_CENTS &&
    value % EXTRA_AMOUNT_STEP_CENTS === 0
  );
}

function getCurrentOfferPoint(negotiation: {
  status: RideNegotiationStatus;
  proposedLatReal: number;
  proposedLngReal: number;
  counterLatReal: number | null;
  counterLngReal: number | null;
}) {
  if (
    negotiation.status === RideNegotiationStatus.COUNTERED &&
    negotiation.counterLatReal != null &&
    negotiation.counterLngReal != null
  ) {
    return {
      lat: negotiation.counterLatReal,
      lng: negotiation.counterLngReal,
    };
  }

  return {
    lat: negotiation.proposedLatReal,
    lng: negotiation.proposedLngReal,
  };
}

async function computeDetourPreview(params: {
  routeId: string;
  lat: number;
  lng: number;
}) {
  const route = await prisma.route.findUnique({
    where: { id: params.routeId },
  });
  if (!route) {
    throw new Error("Rota não encontrada.");
  }

  const recalculated = await resolveRealRoute({
    origin: { lat: route.originLat, lng: route.originLng },
    destination: { lat: route.destinationLat, lng: route.destinationLng },
    waypoints: [{ lat: params.lat, lng: params.lng }],
    googleMapsServerApiKey: env.GOOGLE_MAPS_SERVER_API_KEY,
    orsApiKey: env.ORS_API_KEY,
  });

  const detourMinutes = Math.max(
    0,
    Math.round((recalculated.durationSeconds - route.durationSeconds) / 60),
  );
  const detourMeters = Math.max(0, recalculated.distanceMeters - route.distanceMeters);

  return {
    route,
    recalculated,
    detourMinutes,
    detourMeters,
  };
}

async function expireIfNeeded(negotiationId: string) {
  const negotiation = await prisma.rideNegotiation.findUnique({
    where: { id: negotiationId },
  });
  if (!negotiation) return null;
  if (
    negotiation.status === RideNegotiationStatus.ACCEPTED ||
    negotiation.status === RideNegotiationStatus.REJECTED ||
    negotiation.status === RideNegotiationStatus.CANCELLED ||
    negotiation.status === RideNegotiationStatus.EXPIRED
  ) {
    return negotiation;
  }
  if (negotiation.expiresAt >= new Date()) return negotiation;

  return prisma.rideNegotiation.update({
    where: { id: negotiation.id },
    data: { status: RideNegotiationStatus.EXPIRED },
  });
}

function serializeNegotiation(negotiation: {
  id: string;
  status: RideNegotiationStatus;
  routeId: string;
  rideInstanceId: string;
  passengerId: string;
  driverId: string;
  proposedLatReal: number;
  proposedLngReal: number;
  counterLatReal: number | null;
  counterLngReal: number | null;
  passengerMessage: string | null;
  driverMessage: string | null;
  extraAmountCents: number;
  counterExtraAmountCents: number | null;
  estimatedDetourMinutes: number;
  estimatedDetourMeters: number;
  acceptedGeometry: unknown;
  acceptedDistanceMeters: number | null;
  acceptedDurationSeconds: number | null;
  expiresAt: Date;
  roundsUsed: number;
  createdAt: Date;
  updatedAt: Date;
  route: { id: string; name: string; originLabel: string; destinationLabel: string };
  rideInstance: { id: string; scheduledAt: Date };
  passenger: { id: string; name: string; photoUrl: string | null };
  driver: { id: string; name: string; photoUrl: string | null };
}) {
  return {
    id: negotiation.id,
    status: negotiation.status,
    routeId: negotiation.routeId,
    rideInstanceId: negotiation.rideInstanceId,
    passengerId: negotiation.passengerId,
    driverId: negotiation.driverId,
    proposedLatReal: negotiation.proposedLatReal,
    proposedLngReal: negotiation.proposedLngReal,
    counterLatReal: negotiation.counterLatReal,
    counterLngReal: negotiation.counterLngReal,
    passengerMessage: negotiation.passengerMessage,
    driverMessage: negotiation.driverMessage,
    extraAmountCents: negotiation.extraAmountCents,
    counterExtraAmountCents: negotiation.counterExtraAmountCents,
    estimatedDetourMinutes: negotiation.estimatedDetourMinutes,
    estimatedDetourMeters: negotiation.estimatedDetourMeters,
    acceptedGeometry: negotiation.acceptedGeometry,
    acceptedDistanceMeters: negotiation.acceptedDistanceMeters,
    acceptedDurationSeconds: negotiation.acceptedDurationSeconds,
    expiresAt: negotiation.expiresAt,
    roundsUsed: negotiation.roundsUsed,
    createdAt: negotiation.createdAt,
    updatedAt: negotiation.updatedAt,
    route: negotiation.route,
    ride: negotiation.rideInstance,
    passenger: negotiation.passenger,
    driver: negotiation.driver,
  };
}

export async function registerNegotiationsModule(app: FastifyInstance) {
  app.post(
    "/rides/:id/negotiations/preview",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params);
      const body = z.object({ lat: z.number(), lng: z.number() }).parse(request.body);

      const ride = await prisma.rideInstance.findUnique({
        where: { id: params.id },
        include: { route: true },
      });
      if (!ride) return reply.notFound("Corrida não encontrada.");

      const preview = await computeDetourPreview({
        routeId: ride.routeId,
        lat: body.lat,
        lng: body.lng,
      });

      return {
        estimatedDetourMinutes: preview.detourMinutes,
        estimatedDetourMeters: preview.detourMeters,
      };
    },
  );

  app.post("/rides/:id/negotiations", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        lat: z.number(),
        lng: z.number(),
        passengerMessage: z.string().max(280).optional(),
        extraAmountCents: z.number().int(),
      })
      .parse(request.body);

    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      select: { role: true, name: true },
    });
    if (!user || user.role !== UserRole.PASSAGEIRO) {
      return reply.forbidden("Apenas passageiros podem negociar ponto de encontro.");
    }

    const ride = await prisma.rideInstance.findUnique({
      where: { id: params.id },
      include: {
        route: true,
        bookings: {
          where: { userId: request.auth!.userId, status: "ACTIVE" },
        },
      },
    });
    if (!ride) return reply.notFound("Corrida não encontrada.");
    if (!ride.bookings.length) {
      return reply.forbidden("Você precisa ter uma reserva ativa para negociar o ponto.");
    }

    const existing = await prisma.rideNegotiation.findFirst({
      where: {
        rideInstanceId: ride.id,
        passengerId: request.auth!.userId,
        status: {
          in: [RideNegotiationStatus.PENDING, RideNegotiationStatus.COUNTERED],
        },
      },
    });
    if (existing) {
      return reply.badRequest("Já existe uma negociação em aberto para essa corrida.");
    }

    const preview = await computeDetourPreview({
      routeId: ride.routeId,
      lat: body.lat,
      lng: body.lng,
    });
    if (!isValidExtraAmountCents(body.extraAmountCents)) {
      return reply.badRequest("Valor extra invalido para negociacao.");
    }
    if (preview.detourMinutes > MAX_DETOUR_MINUTES) {
      return reply.badRequest("Esse ponto adiciona desvio demais para a rota.");
    }

    const lastRounds = await prisma.rideNegotiation.aggregate({
      where: {
        routeId: ride.routeId,
        passengerId: request.auth!.userId,
      },
      _max: { roundsUsed: true },
    });
    const roundsUsed = Math.max(1, lastRounds._max.roundsUsed ?? 0);
    if ((lastRounds._max.roundsUsed ?? 0) >= MAX_ROUNDS) {
      return reply.badRequest("Você já atingiu o limite de negociações para essa rota.");
    }

    const negotiation = await prisma.rideNegotiation.create({
      data: {
        routeId: ride.routeId,
        rideInstanceId: ride.id,
        passengerId: request.auth!.userId,
        driverId: ride.route.driverId,
        proposedLatReal: body.lat,
        proposedLngReal: body.lng,
        passengerMessage: body.passengerMessage?.trim() || null,
        extraAmountCents: body.extraAmountCents,
        estimatedDetourMinutes: preview.detourMinutes,
        estimatedDetourMeters: preview.detourMeters,
        expiresAt: new Date(Date.now() + EXPIRATION_MINUTES * 60_000),
        roundsUsed,
      },
      include: {
        route: { select: { id: true, name: true, originLabel: true, destinationLabel: true } },
        rideInstance: { select: { id: true, scheduledAt: true } },
        passenger: { select: { id: true, name: true, photoUrl: true } },
        driver: { select: { id: true, name: true, photoUrl: true } },
      },
    });

    await createRouteSystemMessage(
      ride.routeId,
      `${user.name} propôs um novo ponto de encontro (+${preview.detourMinutes} min, extra de R$ ${(body.extraAmountCents / 100).toFixed(2).replace(".", ",")}).`,
    );

    // Notify driver about new negotiation proposal
    void createNotification({
      userId: ride.route.driverId,
      kind: "NEGOTIATION_PROPOSAL",
      title: "Nova proposta de ponto",
      message: `${user.name} propôs um ponto de encontro (+${preview.detourMinutes} min, +R$ ${(body.extraAmountCents / 100).toFixed(2).replace(".", ",")}).`,
      actionRequired: true,
      deepLink: buildRideDeepLink(ride.id),
    });

    return reply.code(201).send(serializeNegotiation(negotiation));
  });

  app.get("/my/negotiations", { preHandler: app.authenticate }, async (request) => {
    const rows = await prisma.rideNegotiation.findMany({
      where: {
        OR: [{ passengerId: request.auth!.userId }, { driverId: request.auth!.userId }],
      },
      include: {
        route: { select: { id: true, name: true, originLabel: true, destinationLabel: true } },
        rideInstance: { select: { id: true, scheduledAt: true } },
        passenger: { select: { id: true, name: true, photoUrl: true } },
        driver: { select: { id: true, name: true, photoUrl: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const negotiations = await Promise.all(rows.map((row) => expireIfNeeded(row.id)));
    const hydrated = await prisma.rideNegotiation.findMany({
      where: {
        id: { in: negotiations.filter(Boolean).map((row) => row!.id) },
      },
      include: {
        route: { select: { id: true, name: true, originLabel: true, destinationLabel: true } },
        rideInstance: { select: { id: true, scheduledAt: true } },
        passenger: { select: { id: true, name: true, photoUrl: true } },
        driver: { select: { id: true, name: true, photoUrl: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return hydrated.map(serializeNegotiation);
  });

  app.post("/negotiations/:id/accept", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const negotiation = await expireIfNeeded(params.id);
    if (!negotiation) return reply.notFound("Negociação não encontrada.");
    if (negotiation.driverId !== request.auth!.userId && negotiation.passengerId !== request.auth!.userId) {
      return reply.forbidden("Você não participa desta negociação.");
    }
    if (
      negotiation.status !== RideNegotiationStatus.PENDING &&
      negotiation.status !== RideNegotiationStatus.COUNTERED
    ) {
      return reply.badRequest("Essa negociação não pode mais ser aceita.");
    }
    if (
      (negotiation.status === RideNegotiationStatus.PENDING &&
        negotiation.driverId !== request.auth!.userId) ||
      (negotiation.status === RideNegotiationStatus.COUNTERED &&
        negotiation.passengerId !== request.auth!.userId)
    ) {
      return reply.forbidden("Você não pode aceitar esta etapa da negociação.");
    }

    const offer = getCurrentOfferPoint(negotiation);
    const preview = await computeDetourPreview({
      routeId: negotiation.routeId,
      lat: offer.lat,
      lng: offer.lng,
    });

    const acceptedExtraAmountCents =
      negotiation.status === RideNegotiationStatus.COUNTERED &&
      negotiation.counterExtraAmountCents != null
        ? negotiation.counterExtraAmountCents
        : negotiation.extraAmountCents;

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.rideNegotiation.update({
        where: { id: negotiation.id },
        data: {
          status: RideNegotiationStatus.ACCEPTED,
          acceptedGeometry: preview.recalculated.geometry,
          acceptedDistanceMeters: preview.recalculated.distanceMeters,
          acceptedDurationSeconds: preview.recalculated.durationSeconds,
        },
        include: {
          route: { select: { id: true, name: true, originLabel: true, destinationLabel: true } },
          rideInstance: { select: { id: true, scheduledAt: true } },
          passenger: { select: { id: true, name: true, photoUrl: true } },
          driver: { select: { id: true, name: true, photoUrl: true } },
        },
      });

      await tx.booking.updateMany({
        where: {
          routeId: negotiation.routeId,
          rideInstanceId: negotiation.rideInstanceId,
          userId: negotiation.passengerId,
          status: "ACTIVE",
        },
        data: {
          negotiatedPickupLat: offer.lat,
          negotiatedPickupLng: offer.lng,
          negotiatedPickupLabel:
            negotiation.status === RideNegotiationStatus.COUNTERED
              ? negotiation.driverMessage?.trim() || "Ponto negociado"
              : negotiation.passengerMessage?.trim() || "Ponto negociado",
          negotiatedExtraAmount: acceptedExtraAmountCents / 100,
        },
      });

      return saved;
    });

    await createRouteSystemMessage(
      negotiation.routeId,
      `Um ponto de encontro negociado foi aceito (+${preview.detourMinutes} min, extra de R$ ${(acceptedExtraAmountCents / 100).toFixed(2).replace(".", ",")}).`,
    );

    // Notify both parties about acceptance
    const acceptorId = request.auth!.userId;
    const otherPartyId =
      acceptorId === negotiation.driverId ? negotiation.passengerId : negotiation.driverId;
    void createNotification({
      userId: otherPartyId,
      kind: "NEGOTIATION_ACCEPTED",
      title: "Proposta aceita!",
      message: `O ponto de encontro negociado foi aceito (+R$ ${(acceptedExtraAmountCents / 100).toFixed(2).replace(".", ",")}).`,
      deepLink:
        acceptorId === negotiation.driverId
          ? "/app/minhas-caronas"
          : buildRideDeepLink(negotiation.rideInstanceId),
    });

    return serializeNegotiation(updated);
  });

  app.post("/negotiations/:id/reject", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z.object({ driverMessage: z.string().max(180).optional() }).parse(request.body ?? {});
    const negotiation = await expireIfNeeded(params.id);
    if (!negotiation) return reply.notFound("Negociação não encontrada.");
    if (negotiation.driverId !== request.auth!.userId) {
      return reply.forbidden("Apenas o motorista pode recusar essa negociação.");
    }

    const updated = await prisma.rideNegotiation.update({
      where: { id: negotiation.id },
      data: {
        status: RideNegotiationStatus.REJECTED,
        driverMessage: body.driverMessage?.trim() || null,
      },
      include: {
        route: { select: { id: true, name: true, originLabel: true, destinationLabel: true } },
        rideInstance: { select: { id: true, scheduledAt: true } },
        passenger: { select: { id: true, name: true, photoUrl: true } },
        driver: { select: { id: true, name: true, photoUrl: true } },
      },
    });

    await createRouteSystemMessage(
      negotiation.routeId,
      body.driverMessage?.trim()
        ? `Uma proposta de ponto foi recusada: ${body.driverMessage.trim()}`
        : "Uma proposta de ponto foi recusada pelo motorista.",
    );

    // Notify passenger about rejection
    void createNotification({
      userId: negotiation.passengerId,
      kind: "NEGOTIATION_REJECTED",
      title: "Proposta recusada",
      message: body.driverMessage?.trim()
        ? `O motorista recusou sua proposta: "${body.driverMessage.trim()}"`
        : "O motorista recusou sua proposta de ponto de encontro.",
      deepLink: "/app/minhas-caronas",
    });

    return serializeNegotiation(updated);
  });

  app.post("/negotiations/:id/counter", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        lat: z.number(),
        lng: z.number(),
        driverMessage: z.string().max(180).optional(),
        counterExtraAmountCents: z.number().int(),
      })
      .parse(request.body);

    const negotiation = await expireIfNeeded(params.id);
    if (!negotiation) return reply.notFound("Negociação não encontrada.");
    if (negotiation.driverId !== request.auth!.userId) {
      return reply.forbidden("Apenas o motorista pode fazer contraproposta.");
    }
    if (negotiation.roundsUsed >= MAX_ROUNDS) {
      return reply.badRequest("Essa negociação já atingiu o limite de rodadas.");
    }

    const preview = await computeDetourPreview({
      routeId: negotiation.routeId,
      lat: body.lat,
      lng: body.lng,
    });
    if (!isValidExtraAmountCents(body.counterExtraAmountCents)) {
      return reply.badRequest("Valor extra invalido para contraproposta.");
    }
    if (preview.detourMinutes > MAX_DETOUR_MINUTES) {
      return reply.badRequest("A contraproposta adiciona desvio demais para a rota.");
    }

    const updated = await prisma.rideNegotiation.update({
      where: { id: negotiation.id },
      data: {
        status: RideNegotiationStatus.COUNTERED,
        counterLatReal: body.lat,
        counterLngReal: body.lng,
        driverMessage: body.driverMessage?.trim() || null,
        counterExtraAmountCents: body.counterExtraAmountCents,
        estimatedDetourMinutes: preview.detourMinutes,
        estimatedDetourMeters: preview.detourMeters,
        roundsUsed: negotiation.roundsUsed + 1,
        expiresAt: new Date(Date.now() + EXPIRATION_MINUTES * 60_000),
      },
      include: {
        route: { select: { id: true, name: true, originLabel: true, destinationLabel: true } },
        rideInstance: { select: { id: true, scheduledAt: true } },
        passenger: { select: { id: true, name: true, photoUrl: true } },
        driver: { select: { id: true, name: true, photoUrl: true } },
      },
    });

    await createRouteSystemMessage(
      negotiation.routeId,
      `O motorista enviou uma contraproposta de ponto (+${preview.detourMinutes} min, extra de R$ ${(body.counterExtraAmountCents / 100).toFixed(2).replace(".", ",")}).`,
    );

    // Notify passenger about counter-proposal
    void createNotification({
      userId: negotiation.passengerId,
      kind: "NEGOTIATION_COUNTER",
      title: "Contraproposta recebida",
      message: `O motorista fez uma contraproposta (+${preview.detourMinutes} min, +R$ ${(body.counterExtraAmountCents / 100).toFixed(2).replace(".", ",")}).`,
      actionRequired: true,
      deepLink: "/app/minhas-caronas",
    });

    return serializeNegotiation(updated);
  });

  app.post("/negotiations/:id/cancel", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const negotiation = await expireIfNeeded(params.id);
    if (!negotiation) return reply.notFound("Negociação não encontrada.");
    if (negotiation.passengerId !== request.auth!.userId) {
      return reply.forbidden("Apenas o passageiro pode cancelar essa negociação.");
    }

    const updated = await prisma.rideNegotiation.update({
      where: { id: negotiation.id },
      data: { status: RideNegotiationStatus.CANCELLED },
      include: {
        route: { select: { id: true, name: true, originLabel: true, destinationLabel: true } },
        rideInstance: { select: { id: true, scheduledAt: true } },
        passenger: { select: { id: true, name: true, photoUrl: true } },
        driver: { select: { id: true, name: true, photoUrl: true } },
      },
    });

    await createRouteSystemMessage(
      negotiation.routeId,
      "A negociação de ponto foi cancelada pelo passageiro.",
    );

    // Notify driver about cancellation
    void createNotification({
      userId: negotiation.driverId,
      kind: "NEGOTIATION_CANCELLED",
      title: "Negociação cancelada",
      message: "O passageiro cancelou a negociação de ponto de encontro.",
      deepLink: buildRideDeepLink(negotiation.rideInstanceId),
    });

    return serializeNegotiation(updated);
  });
}
