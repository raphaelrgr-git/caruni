import { RideStatus, UserRole } from "@prisma/client";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config.js";
import { resolveRealRoute } from "../lib/domain.js";
import { prisma } from "../prisma.js";

// ---------------------------------------------------------------------------
// Helper: build the /me response shape (reused by multiple handlers)
// ---------------------------------------------------------------------------

function formatMeResponse(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  course: string | null;
  photoUrl: string | null;
  bio: string | null;
  birthYear: number | null;
  petsPref: string | null;
  baggageSize: string | null;
  temperaturePref: string | null;
  restrictions: string | null;
  socialStyle: string | null;
  conversationStyle: string | null;
  musicPref: string | null;
  chatPref: string | null;
  punctualityPref: string | null;
  interests: string[];
  isEmailVerified: boolean;
  passengerOnboardingSeenAt: Date | null;
  driverOnboardingSeenAt: Date | null;
  university: { id: string; name: string; city: string } | null;
  vehicle: { id: string; model: string; color: string; plate: string } | null;
  drivenRoutes?: unknown[];
  streak?: {
    currentStreak: number;
    longestStreak: number;
    totalRides: number;
    freeRidesEarned: number;
    milestone5: boolean;
    milestone10: boolean;
    milestone20: boolean;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    course: user.course,
    photoUrl: user.photoUrl,
    bio: user.bio,
    birthYear: user.birthYear,
    petsPref: user.petsPref,
    baggageSize: user.baggageSize,
    temperaturePref: user.temperaturePref,
    restrictions: user.restrictions,
    socialStyle: user.socialStyle,
    conversationStyle: user.conversationStyle,
    musicPref: user.musicPref,
    chatPref: user.chatPref,
    punctualityPref: user.punctualityPref,
    interests: user.interests,
    isEmailVerified: user.isEmailVerified,
    university: user.university
      ? { id: user.university.id, name: user.university.name, city: user.university.city }
      : null,
    vehicle: user.vehicle,
    drivenRoutesCount: user.drivenRoutes?.length ?? 0,
    onboarding: {
      passengerSeen: Boolean(user.passengerOnboardingSeenAt),
      driverSeen: Boolean(user.driverOnboardingSeenAt),
      shouldShow:
        user.role === UserRole.MOTORISTA
          ? !user.driverOnboardingSeenAt
          : !user.passengerOnboardingSeenAt,
    },
    streak: user.streak
      ? {
          current: user.streak.currentStreak,
          longest: user.streak.longestStreak,
          total: user.streak.totalRides,
          freeRidesEarned: user.streak.freeRidesEarned,
          milestones: {
            m5: user.streak.milestone5,
            m10: user.streak.milestone10,
            m20: user.streak.milestone20,
          },
        }
      : null,
  };
}

const ME_INCLUDE = {
  university: true,
  vehicle: true,
  drivenRoutes: true,
  streak: true,
} as const;

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

export async function registerMeModule(app: FastifyInstance) {
  // GET /me — current user
  app.get("/me", { preHandler: app.authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      include: ME_INCLUDE,
    });
    if (!user) return reply.notFound("Usuario nao encontrado.");
    return formatMeResponse(user);
  });

  // PATCH /me — update profile
  app.patch("/me", { preHandler: app.authenticate }, async (request) => {
    const body = z
      .object({
        name: z.string().min(2).optional(),
        course: z.string().min(2).nullable().optional(),
        bio: z.string().max(300).nullable().optional(),
        birthYear: z.number().int().min(1950).max(new Date().getFullYear()).nullable().optional(),
        petsPref: z.string().max(40).nullable().optional(),
        baggageSize: z.string().max(40).nullable().optional(),
        temperaturePref: z.string().max(40).nullable().optional(),
        restrictions: z.string().max(160).nullable().optional(),
        socialStyle: z.string().max(40).nullable().optional(),
        conversationStyle: z.string().max(40).nullable().optional(),
        musicPref: z.string().nullable().optional(),
        chatPref: z.string().nullable().optional(),
        punctualityPref: z.string().nullable().optional(),
        interests: z.array(z.string()).optional(),
      })
      .parse(request.body);

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.course !== undefined) data.course = body.course;
    if (body.bio !== undefined) data.bio = body.bio;
    if (body.birthYear !== undefined) data.birthYear = body.birthYear;
    if (body.petsPref !== undefined) data.petsPref = body.petsPref;
    if (body.baggageSize !== undefined) data.baggageSize = body.baggageSize;
    if (body.temperaturePref !== undefined) data.temperaturePref = body.temperaturePref;
    if (body.restrictions !== undefined) data.restrictions = body.restrictions;
    if (body.socialStyle !== undefined) data.socialStyle = body.socialStyle;
    if (body.conversationStyle !== undefined) data.conversationStyle = body.conversationStyle;
    if (body.musicPref !== undefined) data.musicPref = body.musicPref;
    if (body.chatPref !== undefined) data.chatPref = body.chatPref;
    if (body.punctualityPref !== undefined) data.punctualityPref = body.punctualityPref;
    if (body.interests !== undefined) data.interests = body.interests;

    const user = await prisma.user.update({
      where: { id: request.auth!.userId },
      data,
      include: ME_INCLUDE,
    });

    return formatMeResponse(user);
  });

  app.post("/me/photo", { preHandler: app.authenticate }, async (request, reply) => {
    const part = await request.file();
    if (!part) {
      return reply.badRequest("Envie uma imagem de perfil.");
    }

    const mimeToExt: Record<string, "jpg" | "png"> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
    };
    const ext = mimeToExt[part.mimetype];
    if (!ext) {
      return reply.badRequest("A imagem deve estar em JPG ou PNG.");
    }

    const buffer = await part.toBuffer();
    if (buffer.length > 5 * 1024 * 1024) {
      return reply.badRequest("A imagem deve ter no máximo 5 MB.");
    }

    const userId = request.auth!.userId;
    const dir = path.join(process.cwd(), "uploads", "profile-images", userId);
    await mkdir(dir, { recursive: true });
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const filename = `profile.${ext}`;
    const diskPath = path.join(dir, filename);
    await writeFile(diskPath, buffer);

    const photoUrl = `/uploads/profile-images/${userId}/${filename}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { photoUrl },
      include: ME_INCLUDE,
    });

    return reply.code(201).send(formatMeResponse(user));
  });

  // POST /me/onboarding/complete
  app.post("/me/onboarding/complete", { preHandler: app.authenticate }, async (request) => {
    const body = z
      .object({ role: z.nativeEnum(UserRole).optional() })
      .parse(request.body ?? {});

    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      include: ME_INCLUDE,
    });
    if (!user) throw app.httpErrors.notFound("Usuario nao encontrado.");

    const targetRole = body.role ?? user.role;
    const updated = await prisma.user.update({
      where: { id: request.auth!.userId },
      data:
        targetRole === UserRole.MOTORISTA
          ? { driverOnboardingSeenAt: new Date() }
          : { passengerOnboardingSeenAt: new Date() },
      include: ME_INCLUDE,
    });

    return formatMeResponse(updated);
  });

  // POST /me/upgrade-driver
  app.post("/me/upgrade-driver", { preHandler: app.authenticate }, async (request, reply) => {
    const body = z
      .object({
        model: z.string().min(2),
        color: z.string().min(2),
        plate: z.string().min(5),
      })
      .parse(request.body);

    const upgraded = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: request.auth!.userId },
        data: { role: UserRole.MOTORISTA },
      });
      const vehicle = await tx.vehicle.upsert({
        where: { userId: request.auth!.userId },
        update: { model: body.model, color: body.color, plate: body.plate.toUpperCase() },
        create: {
          userId: request.auth!.userId,
          model: body.model,
          color: body.color,
          plate: body.plate.toUpperCase(),
        },
      });
      return { user, vehicle };
    });

    return reply.code(201).send({
      id: upgraded.user.id,
      role: upgraded.user.role,
      vehicle: upgraded.vehicle,
    });
  });

  // ---------------------------------------------------------------------------
  // Public user profile endpoint
  // ---------------------------------------------------------------------------
  app.get("/users/:id/profile", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        university: true,
        vehicle: true,
        streak: true,
        reviewsReceived: {
          include: { from: { select: { id: true, name: true, photoUrl: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        bookings: {
          select: { status: true },
        },
      },
    });

    if (!user) return reply.notFound("Usuario nao encontrado.");

    // Compute reliability stats
    const avgRating =
      user.reviewsReceived.length > 0
        ? user.reviewsReceived.reduce((s, r) => s + r.rating, 0) / user.reviewsReceived.length
        : null;

    const totalRides = user.streak?.totalRides ?? 0;

    // Presence rate: confirmed rides / total rides (approximated from streak total)
    // For now use reviews as proxy — reviews only happen on completed rides
    const presenceRate = totalRides > 0 ? Math.min(100, Math.round((user.reviewsReceived.length / totalRides) * 100)) : 100;

    // Cancellation rate
    const totalBookings = user.bookings.length;
    const cancelledBookings = user.bookings.filter((b) => b.status === "CANCELLED").length;
    const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

    const currentYear = new Date().getFullYear();

    return {
      id: user.id,
      name: user.name,
      photoUrl: user.photoUrl,
      role: user.role,
      bio: user.bio,
      birthYear: user.birthYear,
      age: user.birthYear ? currentYear - user.birthYear : null,
      petsPref: user.petsPref,
      baggageSize: user.baggageSize,
      temperaturePref: user.temperaturePref,
      restrictions: user.restrictions,
      socialStyle: user.socialStyle,
      conversationStyle: user.conversationStyle,
      musicPref: user.musicPref,
      chatPref: user.chatPref,
      punctualityPref: user.punctualityPref,
      interests: user.interests,
      university: user.university
        ? { name: user.university.name, city: user.university.city }
        : null,
      stats: {
        avgRating,
        totalRides,
        presenceRate,
        cancellationRate,
      },
      streak: user.streak
        ? { current: user.streak.currentStreak, longest: user.streak.longestStreak }
        : null,
      badges: {
        emailVerified: user.isEmailVerified,
        isDriver: user.role === UserRole.MOTORISTA,
        milestone5: user.streak?.milestone5 ?? false,
        milestone10: user.streak?.milestone10 ?? false,
        milestone20: user.streak?.milestone20 ?? false,
      },
      reviews: user.reviewsReceived.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
        from: r.from,
      })),
    };
  });

  // ---------------------------------------------------------------------------
  // My routes / bookings / rides
  // ---------------------------------------------------------------------------

  app.get("/my/routes", { preHandler: app.authenticate }, async (request) => {
    const routes = await prisma.route.findMany({
      where: { driverId: request.auth!.userId },
      include: {
        bookings: {
          include: { user: true },
        },
        rideInstances: {
          where: { scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: "asc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const hydratedRoutes = await Promise.all(
      routes.map(async (route) => {
        if (route.geometry) return route;

        try {
          const preview = await resolveRealRoute({
            origin: { lat: route.originLat, lng: route.originLng },
            destination: { lat: route.destinationLat, lng: route.destinationLng },
            googleMapsServerApiKey: env.GOOGLE_MAPS_SERVER_API_KEY,
            orsApiKey: env.ORS_API_KEY,
          });

          const updatedRoute = await prisma.route.update({
            where: { id: route.id },
            data: {
              geometry: preview.geometry,
              distanceMeters: preview.distanceMeters,
              durationSeconds: preview.durationSeconds,
            },
          });

          return {
            ...route,
            geometry: updatedRoute.geometry,
            distanceMeters: updatedRoute.distanceMeters,
            durationSeconds: updatedRoute.durationSeconds,
          };
        } catch {
          return route;
        }
      }),
    );

    return hydratedRoutes.map((route) => ({
      id: route.id,
      name: route.name,
      originLabel: route.originLabel,
      destinationLabel: route.destinationLabel,
      departureTime: route.departureTime,
      weekdays: route.weekdays,
      seats: route.seats,
      version: route.version,
      status: route.status,
      visibilityMode: route.visibilityMode,
      publicSeats: route.publicSeats ?? route.seats,
      privateSeats: route.privateSeats ?? 0,
      occupiedSeats: route.bookings.filter((booking) => booking.status === "ACTIVE").length,
      passengers: route.bookings
        .filter((booking) => booking.status === "ACTIVE")
        .map((booking) => ({
          id: booking.user.id,
          name: booking.user.name,
          course: booking.user.course,
        })),
      pendingApprovals: route.bookings
        .filter((booking) => booking.status === "PENDING_APPROVAL")
        .map((booking) => ({
        id: booking.user.id,
        bookingId: booking.id,
        name: booking.user.name,
        course: booking.user.course,
      })),
      nextRides: route.rideInstances,
      map: {
        geometry: route.geometry,
        origin: { lat: route.originLat, lng: route.originLng },
        destination: { lat: route.destinationLat, lng: route.destinationLng },
      },
    }));
  });

  app.get("/my/bookings", { preHandler: app.authenticate }, async (request) => {
    const bookings = await prisma.booking.findMany({
      where: { userId: request.auth!.userId },
      include: {
        route: { include: { driver: true } },
        rideInstance: true,
        creditEntries: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      type: booking.type,
      status: booking.status,
      weekdays: booking.weekdays,
      cancelledAt: booking.cancelledAt,
      createdAt: booking.createdAt,
      route: {
        id: booking.route.id,
        name: booking.route.name,
        originLabel: booking.route.originLabel,
        originLat: booking.route.originLat,
        originLng: booking.route.originLng,
        destinationLabel: booking.route.destinationLabel,
        destinationLat: booking.route.destinationLat,
        destinationLng: booking.route.destinationLng,
        departureTime: booking.route.departureTime,
        visibilityMode: booking.route.visibilityMode,
        driver: {
          id: booking.route.driver.id,
          name: booking.route.driver.name,
          photoUrl: booking.route.driver.photoUrl,
        },
      },
      ride: booking.rideInstance,
      approvedAt: booking.approvedAt,
      credits: booking.creditEntries.map((credit) => ({
        id: credit.id,
        status: credit.status,
        monetaryValue: Number(credit.monetaryValue),
      })),
    }));
  });

  app.get("/my/rides", { preHandler: app.authenticate }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.auth!.userId } });
    if (!user) throw app.httpErrors.notFound("Usuario nao encontrado.");

    const now = new Date();
    const cutoff = new Date(now.getTime() - 1000 * 60 * 60 * 4);
    const visibleRideStatuses = [RideStatus.SCHEDULED, RideStatus.CONFIRMED, RideStatus.DISPUTE];

    if (user.role === UserRole.MOTORISTA) {
      const rides = await prisma.rideInstance.findMany({
        where: {
          route: { driverId: request.auth!.userId },
          scheduledAt: { gte: cutoff },
          status: { in: visibleRideStatuses },
        },
        include: {
          route: true,
          bookings: {
            where: { status: "ACTIVE" },
            include: { user: true },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });

      return rides.map((ride) => ({
        id: ride.id,
        role: "MOTORISTA" as const,
        status: ride.status,
        scheduledAt: ride.scheduledAt,
        driverConfirmedAt: ride.driverConfirmedAt,
        passengerConfirmedAt: ride.passengerConfirmedAt,
        passengerBoarded: ride.passengerBoarded,
        route: {
          id: ride.route.id,
          name: ride.route.name,
          originLabel: ride.route.originLabel,
          destinationLabel: ride.route.destinationLabel,
          geometry: ride.route.geometry,
          distanceMeters: ride.route.distanceMeters,
          durationSeconds: ride.route.durationSeconds,
        },
        participants: ride.bookings.map((b) => ({
          id: b.user.id,
          name: b.user.name,
          course: b.user.course,
        })),
      }));
    }

    const rides = await prisma.rideInstance.findMany({
      where: {
        bookings: { some: { userId: request.auth!.userId, status: "ACTIVE" } },
        scheduledAt: { gte: cutoff },
        status: { in: visibleRideStatuses },
      },
      include: {
        route: { include: { driver: true } },
        bookings: {
          where: { userId: request.auth!.userId, status: "ACTIVE" },
          include: { creditEntries: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return rides.map((ride) => ({
      id: ride.id,
      role: "PASSAGEIRO" as const,
      status: ride.status,
      scheduledAt: ride.scheduledAt,
      driverConfirmedAt: ride.driverConfirmedAt,
      passengerConfirmedAt: ride.passengerConfirmedAt,
      passengerBoarded: ride.passengerBoarded,
      route: {
        id: ride.route.id,
        name: ride.route.name,
        originLabel: ride.route.originLabel,
        destinationLabel: ride.route.destinationLabel,
        geometry: ride.route.geometry,
        distanceMeters: ride.route.distanceMeters,
        durationSeconds: ride.route.durationSeconds,
        driver: {
          id: ride.route.driver.id,
          name: ride.route.driver.name,
          photoUrl: ride.route.driver.photoUrl,
        },
      },
      booking: ride.bookings[0]
        ? {
            id: ride.bookings[0].id,
            type: ride.bookings[0].type,
            credits: ride.bookings[0].creditEntries.map((c) => ({
              id: c.id,
              status: c.status,
              monetaryValue: Number(c.monetaryValue),
            })),
          }
        : null,
    }));
  });
}
