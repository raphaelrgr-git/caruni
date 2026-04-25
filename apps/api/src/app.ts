import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config.js";
import { ensureSeedData } from "./lib/domain.js";
import { registerAuthModule } from "./modules/auth.js";
import { registerBookingsModule } from "./modules/bookings.js";
import { registerDashboardModule } from "./modules/dashboard.js";
import { registerPlansModule } from "./modules/plans.js";
import { registerReviewsModule } from "./modules/reviews.js";
import { registerRidesModule } from "./modules/rides.js";
import { registerRoutesModule } from "./modules/routes.js";
import { registerRoutingModule } from "./modules/routing.js";
import { registerWalletModule } from "./modules/wallet.js";
import { authPlugin } from "./plugins/auth.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });
  await app.register(authPlugin);

  app.get("/health", async () => ({ ok: true }));

  await registerAuthModule(app);
  await registerPlansModule(app);
  await registerWalletModule(app);
  await registerRoutingModule(app);
  await registerRoutesModule(app);
  await registerBookingsModule(app);
  await registerRidesModule(app);
  await registerReviewsModule(app);
  await registerDashboardModule(app);

  app.addHook("onReady", async () => {
    await ensureSeedData();
  });

  return app;
}
