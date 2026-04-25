import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config.js";

export const authPlugin = fp(async (app) => {
  await app.register(sensible);
  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: "caruni_token",
      signed: false,
    },
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      request.auth = request.user;
    } catch {
      reply.unauthorized("Autenticacao obrigatoria.");
    }
  });
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
