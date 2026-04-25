import type { FastifyInstance } from "fastify";
import { getDashboardSummary } from "../lib/domain.js";

export async function registerDashboardModule(app: FastifyInstance) {
  app.get("/dashboard/summary", { preHandler: app.authenticate }, async (request) => {
    return getDashboardSummary(request.auth!.userId);
  });
}
