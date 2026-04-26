import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createNotification } from "../lib/notifications.js";
import { prisma } from "../prisma.js";

export async function registerReviewsModule(app: FastifyInstance) {
  app.post("/reviews", { preHandler: app.authenticate }, async (request, reply) => {
    const body = z
      .object({
        routeId: z.string().min(1),
        toId: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        body: z.string().min(2).max(500),
      })
      .parse(request.body);

    const [review, reviewer] = await Promise.all([
      prisma.review.create({
        data: {
          routeId: body.routeId,
          fromId: request.auth!.userId,
          toId: body.toId,
          rating: body.rating,
          body: body.body,
        },
      }),
      prisma.user.findUnique({
        where: { id: request.auth!.userId },
        select: { name: true },
      }),
    ]);

    void createNotification({
      userId: body.toId,
      kind: "REVIEW_RECEIVED",
      title: "Nova avaliação recebida",
      message: reviewer
        ? `${reviewer.name} deixou uma avaliação de ${body.rating} estrelas para você.`
        : `Você recebeu uma avaliação de ${body.rating} estrelas.`,
      deepLink: "/app/perfil",
    });

    return reply.code(201).send(review);
  });
}
