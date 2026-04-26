import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { registerSseClient } from "../lib/notifications.js";

export async function registerNotificationsModule(app: FastifyInstance) {
  // SSE stream — stays open until client disconnects
  app.get("/notifications/stream", { preHandler: app.authenticate }, (request, reply) => {
    const userId = request.auth!.userId;

    reply.hijack();

    const raw = reply.raw;
    raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    raw.write('data: {"type":"connected"}\n\n');

    const cleanup = registerSseClient(userId, (data) => {
      raw.write(`data: ${data}\n\n`);
    });

    const heartbeat = setInterval(() => {
      raw.write('data: {"type":"heartbeat"}\n\n');
    }, 25_000);

    raw.on("close", () => {
      clearInterval(heartbeat);
      cleanup();
    });
  });

  // List notifications (paginated, excludes expired)
  app.get("/notifications", { preHandler: app.authenticate }, async (request) => {
    const query = z.object({ page: z.coerce.number().int().min(1).default(1) }).parse(
      request.query,
    );
    const take = 30;
    const skip = (query.page - 1) * take;

    return prisma.notification.findMany({
      where: {
        userId: request.auth!.userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });
  });

  // Unread count
  app.get("/notifications/unread-count", { preHandler: app.authenticate }, async (request) => {
    const count = await prisma.notification.count({
      where: {
        userId: request.auth!.userId,
        status: "UNREAD",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return { count };
  });

  // Mark single notification as read
  app.post(
    "/notifications/:id/read",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification || notification.userId !== request.auth!.userId) {
        return reply.notFound("Notificação não encontrada.");
      }
      return prisma.notification.update({
        where: { id },
        data: { status: "READ" },
      });
    },
  );

  // Mark all notifications as read
  app.post("/notifications/read-all", { preHandler: app.authenticate }, async (request) => {
    await prisma.notification.updateMany({
      where: { userId: request.auth!.userId, status: "UNREAD" },
      data: { status: "READ" },
    });
    return { ok: true };
  });
}
