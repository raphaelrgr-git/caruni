import { buildApp } from "./app.js";
import { env } from "./config.js";
import { startScheduler } from "./lib/scheduler.js";

const app = await buildApp();

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  startScheduler();
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
