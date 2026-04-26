import assert from "node:assert/strict";
import { buildApp } from "../dist/app.js";

const app = await buildApp();
await app.ready();

try {
  const routes = app.printRoutes();
  assert.match(routes, /photo \(POST\)/, "POST /me/photo precisa estar registrado.");
  assert.match(routes, /:id \(GET, HEAD, PATCH, DELETE\)/, "PATCH /routes/:id precisa estar registrado.");

  const health = await app.inject({
    method: "GET",
    url: "/health",
  });
  assert.equal(health.statusCode, 200, "GET /health deve responder 200.");

  const photo = await app.inject({
    method: "POST",
    url: "/me/photo",
  });
  assert.notEqual(photo.statusCode, 404, "POST /me/photo não pode responder 404.");

  const routePatch = await app.inject({
    method: "PATCH",
    url: "/routes/test-route",
    payload: {},
  });
  assert.notEqual(routePatch.statusCode, 404, "PATCH /routes/:id não pode responder 404.");

  console.log("Smoke de rotas críticas OK.");
} finally {
  await app.close();
}
