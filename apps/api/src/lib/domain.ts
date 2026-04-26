import {
  BookingStatus,
  BookingType,
  CreditStatus,
  Prisma,
  RideStatus,
  RouteVisibilityMode,
  SubscriptionPlanKey,
  SubscriptionStatus,
  UserRole,
  WalletTransactionType,
} from "@prisma/client";
import type { FastifyInstance, FastifyReply } from "fastify";
import { prisma } from "../prisma.js";

const BUS_FARE = 6.5;
const ROUTING_PROVIDER = "openrouteservice";
const DRIVER_COST_PER_KM = 0.62;

export const PLAN_CATALOG = [
  {
    key: SubscriptionPlanKey.CALOURO,
    name: "Calouro",
    weeklyPrice: 20,
    creditsIncluded: 5,
    costPerTrip: 4,
    extraTripPrice: 5,
    driverPayoutPerCredit: 3.2,
    priority: false,
  },
  {
    key: SubscriptionPlanKey.VETERANO,
    name: "Veterano",
    weeklyPrice: 35,
    creditsIncluded: 10,
    costPerTrip: 3.5,
    extraTripPrice: 4,
    driverPayoutPerCredit: 3.25,
    priority: true,
  },
] as const;

export function toMoney(value: Prisma.Decimal | number | string) {
  return Number(value);
}

export function startOfWeek(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function endOfWeek(date = new Date()) {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function nextDatesForWeekdays(weekdays: number[], horizonDays = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: Date[] = [];
  for (let offset = 0; offset <= horizonDays; offset += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() + offset);
    if (weekdays.includes(current.getDay())) {
      result.push(current);
    }
  }
  return result;
}

export function buildScheduledDate(baseDate: Date, departureTime: string) {
  const [hours, minutes] = departureTime.split(":").map(Number);
  const scheduled = new Date(baseDate);
  scheduled.setHours(hours, minutes, 0, 0);
  return scheduled;
}

export function estimatePrivateTripCost(km: number) {
  return Math.max(12, Number((6 + km * 2.8).toFixed(2)));
}

export async function ensureSeedData() {
  const universities = [
    { name: "UDESC Joinville", city: "Joinville" },
    { name: "UNIVILLE Joinville", city: "Joinville" },
    { name: "IFSC Joinville", city: "Joinville" },
  ];

  await Promise.all(
    universities.map((university) =>
      prisma.university.upsert({
        where: { name: university.name },
        update: { city: university.city },
        create: university,
      }),
    ),
  );

  await Promise.all(
    PLAN_CATALOG.map((plan) =>
      prisma.subscriptionPlan.upsert({
        where: { key: plan.key },
        update: plan,
        create: plan,
      }),
    ),
  );
}

export async function createWeeklyCredits(params: {
  userId: string;
  subscriptionId: string;
  planId: string;
  creditsIncluded: number;
  costPerTrip: Prisma.Decimal | number;
  description: string;
  expiresAt: Date;
}) {
  const { userId, subscriptionId, planId, creditsIncluded, costPerTrip, description, expiresAt } =
    params;

  if (creditsIncluded <= 0) return;

  await prisma.creditLedgerEntry.createMany({
    data: Array.from({ length: creditsIncluded }, () => ({
      userId,
      subscriptionId,
      planId,
      status: CreditStatus.DISPONIVEL,
      monetaryValue: costPerTrip,
      description,
      expiresAt,
    })),
  });
}

export async function expireOldCredits(userId: string) {
  await prisma.creditLedgerEntry.updateMany({
    where: {
      userId,
      status: { in: [CreditStatus.DISPONIVEL, CreditStatus.RESERVADO] },
      expiresAt: { lt: new Date() },
    },
    data: { status: CreditStatus.EXPIRADO },
  });

  await prisma.userSubscription.updateMany({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      cycleEnd: { lt: new Date() },
    },
    data: { status: SubscriptionStatus.EXPIRED },
  });
}

export async function getActiveSubscription(userId: string) {
  await expireOldCredits(userId);
  return prisma.userSubscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAvailableCredit(userId: string) {
  return prisma.creditLedgerEntry.findFirst({
    where: { userId, status: CreditStatus.DISPONIVEL },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWalletSummary(userId: string) {
  await expireOldCredits(userId);

  const [credits, transactions, activeSubscription] = await Promise.all([
    prisma.creditLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        plan: true,
        booking: { include: { route: true } },
        rideInstance: { include: { route: true } },
      },
    }),
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    getActiveSubscription(userId),
  ]);

  const counts = credits.reduce(
    (acc, credit) => {
      acc[credit.status] += 1;
      return acc;
    },
    {
      DISPONIVEL: 0,
      RESERVADO: 0,
      CONSUMIDO: 0,
      EXPIRADO: 0,
      PERDIDO: 0,
    } satisfies Record<CreditStatus, number>,
  );

  return {
    subscription: activeSubscription
      ? {
          id: activeSubscription.id,
          status: activeSubscription.status,
          autoRenew: activeSubscription.autoRenew,
          cycleStart: activeSubscription.cycleStart,
          cycleEnd: activeSubscription.cycleEnd,
          plan: {
            key: activeSubscription.plan.key,
            name: activeSubscription.plan.name,
            weeklyPrice: toMoney(activeSubscription.plan.weeklyPrice),
            creditsIncluded: activeSubscription.plan.creditsIncluded,
            costPerTrip: toMoney(activeSubscription.plan.costPerTrip),
            extraTripPrice: toMoney(activeSubscription.plan.extraTripPrice),
            driverPayoutPerCredit: toMoney(activeSubscription.plan.driverPayoutPerCredit),
            priority: activeSubscription.plan.priority,
          },
        }
      : null,
    credits: {
      total: credits.length,
      available: counts.DISPONIVEL,
      reserved: counts.RESERVADO,
      consumed: counts.CONSUMIDO,
      expired: counts.EXPIRADO,
      lost: counts.PERDIDO,
      entries: credits.map((credit) => ({
        id: credit.id,
        status: credit.status,
        monetaryValue: toMoney(credit.monetaryValue),
        description: credit.description,
        createdAt: credit.createdAt,
        expiresAt: credit.expiresAt,
        routeName: credit.booking?.route.name ?? credit.rideInstance?.route.name ?? null,
      })),
    },
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      description: transaction.description,
      amount: toMoney(transaction.amount),
      createdAt: transaction.createdAt,
    })),
  };
}

export async function getDashboardSummary(userId: string) {
  await expireOldCredits(userId);
  const [user, credits, passengerRides, driverRides, activeSubscription, routeSummaries] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
      prisma.creditLedgerEntry.findMany({
        where: { userId },
        include: {
          rideInstance: {
            include: { route: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.rideInstance.findMany({
        where: {
          bookings: {
            some: {
              userId,
              status: BookingStatus.ACTIVE,
            },
          },
        },
        include: { route: true },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      prisma.rideInstance.findMany({
        where: {
          route: { driverId: userId },
        },
        include: { route: true, bookings: { where: { status: BookingStatus.ACTIVE } } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      getActiveSubscription(userId),
      prisma.route.findMany({
        where: { driverId: userId },
        include: {
          bookings: { where: { status: BookingStatus.ACTIVE } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  if (!user) {
    throw new Error("Usuario nao encontrado.");
  }

  const consumed = credits.filter((credit) => credit.status === CreditStatus.CONSUMIDO);
  const caruniCost = consumed.reduce((sum, credit) => sum + toMoney(credit.monetaryValue), 0);
  const busCost = consumed.length * BUS_FARE;
  const privateCost = consumed.reduce(
    (sum, credit) =>
      sum + estimatePrivateTripCost((credit.rideInstance?.route.distanceMeters ?? 0) / 1000),
    0,
  );

  const weeklyProjectionBus = activeSubscription
    ? activeSubscription.plan.creditsIncluded *
      (BUS_FARE - toMoney(activeSubscription.plan.costPerTrip))
    : 0;
  const avgKm =
    consumed.length > 0
      ? consumed.reduce(
          (sum, credit) => sum + (credit.rideInstance?.route.distanceMeters ?? 0) / 1000,
          0,
        ) / consumed.length
      : 5.5;
  const weeklyProjectionPrivate = activeSubscription
    ? activeSubscription.plan.creditsIncluded *
      (estimatePrivateTripCost(avgKm) - toMoney(activeSubscription.plan.costPerTrip))
    : 0;

  const now = Date.now();
  const nextRides = (user.role === UserRole.MOTORISTA ? driverRides : passengerRides)
    .filter((ride) => {
      if (ride.status === RideStatus.CANCELLED) return false;
      const scheduledAt = new Date(ride.scheduledAt).getTime();
      const durationMs = ((ride.route.durationSeconds ?? 0) + 15 * 60) * 1000;
      return scheduledAt >= now || scheduledAt + durationMs > now;
    })
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .map((ride) => ({
      id: ride.id,
      routeId: ride.routeId,
      routeName: ride.route.name,
      scheduledAt: ride.scheduledAt,
      status: ride.status,
      originLabel: ride.route.originLabel,
      destinationLabel: ride.route.destinationLabel,
      distanceMeters: ride.route.distanceMeters,
    }));

  const timeline = consumed
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(-6)
    .reduce<
      Array<{ label: string; caruni: number; bus: number; private: number; savings: number }>
    >((acc, credit, index) => {
      const km = (credit.rideInstance?.route.distanceMeters ?? 0) / 1000;
      const caruni = Number((acc[index - 1]?.caruni ?? 0) + toMoney(credit.monetaryValue));
      const bus = Number((acc[index - 1]?.bus ?? 0) + BUS_FARE);
      const privateValue = Number(
        (acc[index - 1]?.private ?? 0) + estimatePrivateTripCost(km),
      );
      acc.push({
        label: `Viagem ${index + 1}`,
        caruni: Number(caruni.toFixed(2)),
        bus: Number(bus.toFixed(2)),
        private: Number(privateValue.toFixed(2)),
        savings: Number((privateValue - caruni).toFixed(2)),
      });
      return acc;
    }, []);

  const driverTransactions = await prisma.walletTransaction.findMany({
    where: {
      userId,
      type: WalletTransactionType.REPASSE,
    },
    include: {
      rideInstance: {
        include: {
          route: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 12,
  });

  const earningsTimeline = driverTransactions.reduce<
    Array<{ label: string; earnings: number; rides: number }>
  >((acc, transaction, index) => {
    const prevEarnings = acc[index - 1]?.earnings ?? 0;
    const prevRides = acc[index - 1]?.rides ?? 0;
    acc.push({
      label: new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        day: "2-digit",
      }).format(transaction.createdAt),
      earnings: Number((prevEarnings + toMoney(transaction.amount)).toFixed(2)),
      rides: prevRides + 1,
    });
    return acc;
  }, []);

  const occupancyTimeline = routeSummaries.map((route, index) => ({
    label: route.name.length > 18 ? `Rota ${index + 1}` : route.name,
    occupancy:
      route.seats > 0 ? Number(((route.bookings.length / route.seats) * 100).toFixed(0)) : 0,
  }));

  const fuelSavingsTimeline = driverTransactions.reduce<
    Array<{ label: string; netSavings: number; earnings: number; estimatedCost: number }>
  >((acc, transaction, index) => {
    const prevNet = acc[index - 1]?.netSavings ?? 0;
    const prevEarnings = acc[index - 1]?.earnings ?? 0;
    const prevCost = acc[index - 1]?.estimatedCost ?? 0;
    const routeKm = (transaction.rideInstance?.route.distanceMeters ?? 0) / 1000;
    const estimatedCost = routeKm * DRIVER_COST_PER_KM;
    const earnings = toMoney(transaction.amount);
    acc.push({
      label: new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        day: "2-digit",
      }).format(transaction.createdAt),
      netSavings: Number((prevNet + earnings - estimatedCost).toFixed(2)),
      earnings: Number((prevEarnings + earnings).toFixed(2)),
      estimatedCost: Number((prevCost + estimatedCost).toFixed(2)),
    });
    return acc;
  }, []);

  return {
    nextRides,
    credits: {
      total: credits.length,
      available: credits.filter((credit) => credit.status === CreditStatus.DISPONIVEL).length,
      reserved: credits.filter((credit) => credit.status === CreditStatus.RESERVADO).length,
      consumed: consumed.length,
    },
    savings: {
      confirmedTrips: consumed.length,
      caruniCost: Number(caruniCost.toFixed(2)),
      busCost: Number(busCost.toFixed(2)),
      busSavings: Number((busCost - caruniCost).toFixed(2)),
      privateCost: Number(privateCost.toFixed(2)),
      privateSavings: Number((privateCost - caruniCost).toFixed(2)),
      weeklyProjectionBus: Number(weeklyProjectionBus.toFixed(2)),
      weeklyProjectionPrivate: Number(weeklyProjectionPrivate.toFixed(2)),
    },
    timeline,
    earningsTimeline,
    occupancyTimeline,
    fuelSavingsTimeline,
    estimatedFuelSavings: Number((fuelSavingsTimeline.at(-1)?.netSavings ?? 0).toFixed(2)),
    estimatedCostPerKm: DRIVER_COST_PER_KM,
  };
}

export async function generateRideInstancesForRoute(routeId: string) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
  });
  if (!route) return [];

  const weekdays = Array.isArray(route.weekdays) ? (route.weekdays as number[]) : [];
  const dates = nextDatesForWeekdays(weekdays);
  const created = [];

  for (const date of dates) {
    const scheduledAt = buildScheduledDate(date, route.departureTime);
    const existing = await prisma.rideInstance.findFirst({
      where: { routeId, scheduledAt },
    });
    if (existing) {
      created.push(existing);
      continue;
    }
    const ride = await prisma.rideInstance.create({
      data: {
        routeId,
        scheduledAt,
        status: RideStatus.SCHEDULED,
      },
    });
    created.push(ride);
  }

  return created;
}

export async function getOrCreateNextRide(routeId: string) {
  const now = new Date();
  let ride = await prisma.rideInstance.findFirst({
    where: { routeId, scheduledAt: { gte: now } },
    orderBy: { scheduledAt: "asc" },
  });

  if (!ride) {
    await generateRideInstancesForRoute(routeId);
    ride = await prisma.rideInstance.findFirst({
      where: { routeId, scheduledAt: { gte: now } },
      orderBy: { scheduledAt: "asc" },
    });
  }

  return ride;
}

export async function reserveCreditForBooking(params: {
  userId: string;
  routeId: string;
  rideInstanceId: string;
  type: BookingType;
  weekdays: number[];
}) {
  const { userId, routeId, rideInstanceId, type, weekdays } = params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    throw new Error("Usuario nao encontrado.");
  }
  if (user.role !== UserRole.PASSAGEIRO) {
    throw new Error("Apenas passageiros podem reservar vagas.");
  }

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      bookings: { where: { status: BookingStatus.ACTIVE } },
      driver: true,
    },
  });
  if (!route) {
    throw new Error("Rota nao encontrada.");
  }
  if (route.driverId === userId) {
    throw new Error("Motorista nao pode reservar a propria rota.");
  }
  if (route.bookings.length >= route.seats) {
    throw new Error("Rota lotada.");
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId,
      routeId,
      status: BookingStatus.ACTIVE,
    },
  });
  if (existingBooking) {
    throw new Error("Usuario ja possui reserva ativa nesta rota.");
  }

  const activeBookings = route.bookings.filter((booking) => booking.status === BookingStatus.ACTIVE);
  const pendingApproval =
    route.visibilityMode === RouteVisibilityMode.PRIVADA ||
    (route.visibilityMode === RouteVisibilityMode.HIBRIDA &&
      activeBookings.length >= (route.publicSeats ?? route.seats));

  const credit = pendingApproval ? null : await getAvailableCredit(userId);
  if (!pendingApproval && !credit) {
    throw new Error("Sem credito disponivel.");
  }

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        userId,
        routeId,
        rideInstanceId,
        type,
        weekdays,
        status: pendingApproval ? BookingStatus.PENDING_APPROVAL : BookingStatus.ACTIVE,
      },
    });

    if (credit) {
      await tx.creditLedgerEntry.update({
        where: { id: credit.id },
        data: {
          status: CreditStatus.RESERVADO,
          bookingId: booking.id,
          rideInstanceId,
          description: `Credito reservado · ${route.name}`,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          bookingId: booking.id,
          rideInstanceId,
          type: WalletTransactionType.CREDITO_RESERVADO,
          description: `Credito reservado · ${route.name}`,
          amount: 0,
        },
      });
    }

    return booking;
  });
}

export async function setAuthCookie(
  app: FastifyInstance,
  reply: FastifyReply,
  payload: { userId: string; email: string; role?: UserRole },
) {
  const token = app.jwt.sign(payload);
  reply.setCookie("caruni_token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  return token;
}

export async function getUserRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, vehicle: true },
  });
}

export async function resolveRealRoute(params: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: Array<{ lat: number; lng: number }>;
  googleMapsServerApiKey?: string;
  orsApiKey?: string;
}) {
  const { origin, destination, waypoints = [], googleMapsServerApiKey, orsApiKey } = params;
  const points = [origin, ...waypoints, destination];
  const coordinates = points.map((point) => [point.lng, point.lat] as [number, number]);

  if (googleMapsServerApiKey) {
    const qs = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: "driving",
      language: "pt-BR",
      region: "br",
      key: googleMapsServerApiKey,
    });

    if (waypoints.length) {
      qs.set(
        "waypoints",
        waypoints.map((point) => `${point.lat},${point.lng}`).join("|"),
      );
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${qs.toString()}`,
    );
    if (!response.ok) {
      throw new Error(`Google Directions falhou com status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      status: string;
      routes?: Array<{
        overview_polyline?: { points: string };
        legs?: Array<{
          distance?: { value: number };
          duration?: { value: number };
        }>;
      }>;
      error_message?: string;
    };

    if (payload.status !== "OK" || !payload.routes?.length) {
      throw new Error(payload.error_message || `Google Directions retornou ${payload.status}.`);
    }

    const route = payload.routes[0];
    const decodePolyline = (encoded: string): [number, number][] => {
      let index = 0;
      let lat = 0;
      let lng = 0;
      const path: [number, number][] = [];

      while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte = 0;
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;

        shift = 0;
        result = 0;
        do {
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;

        path.push([lng / 1e5, lat / 1e5]);
      }

      return path;
    };

    const legs = route.legs ?? [];
    return {
      provider: "google",
      distanceMeters: Math.round(
        legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0),
      ),
      durationSeconds: Math.round(
        legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0),
      ),
      geometry: {
        type: "LineString" as const,
        coordinates: decodePolyline(route.overview_polyline?.points ?? ""),
      },
    };
  }

  if (orsApiKey) {
    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          Authorization: orsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenRouteService falhou com status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      features: Array<{
        geometry: { type: "LineString"; coordinates: [number, number][] };
        properties: { summary: { distance: number; duration: number } };
      }>;
    };

    const feature = payload.features[0];
    return {
      provider: ROUTING_PROVIDER,
      distanceMeters: Math.round(feature.properties.summary.distance),
      durationSeconds: Math.round(feature.properties.summary.duration),
      geometry: {
        type: "LineString" as const,
        coordinates: feature.geometry.coordinates,
      },
    };
  }

  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordinates
      .map(([lng, lat]) => `${lng},${lat}`)
      .join(";")}?overview=full&geometries=geojson`,
  );
  if (!response.ok) {
    throw new Error(`OSRM falhou com status ${response.status}.`);
  }
  const payload = (await response.json()) as {
    routes: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][]; type: "LineString" };
    }>;
  };
  const route = payload.routes[0];
  return {
    provider: "osrm",
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
    geometry: route.geometry,
  };
}
