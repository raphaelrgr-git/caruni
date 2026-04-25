import type { FastifyInstance } from "fastify";
import { z } from "zod";
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

    const review = await prisma.review.create({
      data: {
        routeId: body.routeId,
        fromId: request.auth!.userId,
        toId: body.toId,
        rating: body.rating,
        body: body.body,
      },
    });

    return reply.code(201).send(review);
  });
}
