import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "./config.js";
import { ensureSeedData } from "./lib/domain.js";
import { registerAuthModule } from "./modules/auth.js";
import { registerBookingsModule } from "./modules/bookings.js";
import { registerChatModule } from "./modules/chat.js";
import { registerConnectionsModule } from "./modules/connections.js";
import { registerDashboardModule } from "./modules/dashboard.js";
import { registerMeModule } from "./modules/me.js";
import { registerNegotiationsModule } from "./modules/negotiations.js";
import { registerPlansModule } from "./modules/plans.js";
import { registerReviewsModule } from "./modules/reviews.js";
import { registerRidesModule } from "./modules/rides.js";
import { registerRoutesModule } from "./modules/routes.js";
import { registerRoutingModule } from "./modules/routing.js";
import { registerNotificationsModule } from "./modules/notifications.js";
import { registerWalletModule } from "./modules/wallet.js";
import { authPlugin } from "./plugins/auth.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  const allowedOrigins = new Set([
    env.FRONTEND_URL,
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });
  const uploadsRoot = path.join(process.cwd(), "uploads");
  await mkdir(uploadsRoot, { recursive: true });

  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: "/uploads/",
    decorateReply: false,
  });
  await app.register(authPlugin);

  app.get("/health", async () => ({ ok: true }));

  await registerAuthModule(app);
  await registerMeModule(app);
  await registerPlansModule(app);
  await registerWalletModule(app);
  await registerRoutingModule(app);
  await registerRoutesModule(app);
  await registerBookingsModule(app);
  await registerNegotiationsModule(app);
  await registerRidesModule(app);
  await registerReviewsModule(app);
  await registerChatModule(app);
  await registerConnectionsModule(app);
  await registerDashboardModule(app);
  await registerNotificationsModule(app);

  app.addHook("onReady", async () => {
    await ensureSeedData();
  });

  return app;
}
