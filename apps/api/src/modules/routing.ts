import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config.js";
import { resolveRealRoute } from "../lib/domain.js";

export async function registerRoutingModule(app: FastifyInstance) {
  app.post("/routing/preview", async (request) => {
    const body = z
      .object({
        origin: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        destination: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        profile: z.literal("driving-car").default("driving-car"),
      })
      .parse(request.body);

    const route = await resolveRealRoute({
      origin: body.origin,
      destination: body.destination,
      orsApiKey: env.ORS_API_KEY,
    });

    return route;
  });
}
