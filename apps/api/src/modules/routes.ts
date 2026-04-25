import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config.js";
import { generateRideInstancesForRoute, resolveRealRoute } from "../lib/domain.js";
import { prisma } from "../prisma.js";

export async function registerRoutesModule(app: FastifyInstance) {
  app.get("/routes", async (request) => {
    const query = z
      .object({
        origin: z.string().optional(),
        destination: z.string().optional(),
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
      occupiedSeats: route.bookings.length,
      driver: {
        id: route.driver.id,
        name: route.driver.name,
        course: route.driver.course,
        photoUrl: route.driver.photoUrl,
        rating: avgRating,
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
      })
      .parse(request.body);

    const preview = await resolveRealRoute({
      origin: { lat: body.originLat, lng: body.originLng },
      destination: { lat: body.destinationLat, lng: body.destinationLng },
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
}
