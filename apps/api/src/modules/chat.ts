import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

const SYSTEM_PREFIX = "[[system]]";

export async function createRouteSystemMessage(routeId: string, body: string) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { driverId: true },
  });
  if (!route) return;

  await prisma.routeChatMessage.create({
    data: {
      routeId,
      authorId: route.driverId,
      body: `${SYSTEM_PREFIX}${body}`,
    },
  });
}

async function canAccessRouteChat(userId: string, routeId: string) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      bookings: {
        where: { userId, status: "ACTIVE" },
        take: 1,
      },
    },
  });

  if (!route) return { allowed: false, route: null };
  if (route.driverId === userId) return { allowed: true, route };
  if (route.bookings.length > 0) return { allowed: true, route };

  return { allowed: false, route };
}

export async function registerChatModule(app: FastifyInstance) {
  app.get("/routes/:id/messages", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const query = z
      .object({
        limit: z.coerce.number().min(1).max(100).default(50),
      })
      .parse(request.query);

    const access = await canAccessRouteChat(request.auth!.userId, params.id);
    if (!access.allowed) {
      return reply.forbidden("Usuario nao participa desta rota.");
    }

    const messages = await prisma.routeChatMessage.findMany({
      where: { routeId: params.id },
      include: {
        author: true,
      },
      orderBy: { createdAt: "asc" },
      take: query.limit,
    });

    return {
      routeId: params.id,
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body.startsWith(SYSTEM_PREFIX)
          ? message.body.slice(SYSTEM_PREFIX.length)
          : message.body,
        kind: message.body.startsWith(SYSTEM_PREFIX) ? "SYSTEM" : "USER",
        createdAt: message.createdAt,
        author: {
          id: message.author.id,
          name: message.author.name,
          photoUrl: message.author.photoUrl,
        },
      })),
    };
  });

  app.post("/routes/:id/messages", { preHandler: app.authenticate }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        body: z.string().min(1).max(1000),
      })
      .parse(request.body);

    const access = await canAccessRouteChat(request.auth!.userId, params.id);
    if (!access.allowed) {
      return reply.forbidden("Usuario nao participa desta rota.");
    }

    const message = await prisma.routeChatMessage.create({
      data: {
        routeId: params.id,
        authorId: request.auth!.userId,
        body: body.body.trim(),
      },
      include: {
        author: true,
      },
    });

    return reply.code(201).send({
      id: message.id,
      body: message.body,
      kind: "USER",
      createdAt: message.createdAt,
      author: {
        id: message.author.id,
        name: message.author.name,
        photoUrl: message.author.photoUrl,
      },
    });
  });
}
