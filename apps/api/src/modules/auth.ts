import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { setAuthCookie } from "../lib/domain.js";
import { prisma } from "../prisma.js";

export async function registerAuthModule(app: FastifyInstance) {
  app.post("/auth/signup", async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
        course: z.string().optional(),
        universityName: z.string().min(2),
      })
      .parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      return reply.conflict("Email ja cadastrado.");
    }

    const university = await prisma.university.findFirst({
      where: { name: { equals: body.universityName, mode: "insensitive" } },
    });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        name: body.name,
        course: body.course,
        universityId: university?.id,
      },
    });

    const token = randomUUID();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    return reply.code(201).send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
      verificationToken: token,
      verificationHint: "Use POST /auth/verify-email com o token retornado no ambiente local.",
    });
  });

  app.post("/auth/verify-email", async (request, reply) => {
    const body = z.object({ token: z.string().min(8) }).parse(request.body);
    const tokenRow = await prisma.emailVerificationToken.findUnique({
      where: { token: body.token },
      include: { user: true },
    });

    if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt < new Date()) {
      return reply.badRequest("Token invalido ou expirado.");
    }

    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: tokenRow.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: tokenRow.userId },
        data: { isEmailVerified: true },
      }),
    ]);

    return {
      ok: true,
      userId: tokenRow.userId,
    };
  });

  app.post("/auth/login", async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { university: true },
    });

    if (!user) {
      return reply.unauthorized("Credenciais invalidas.");
    }

    const passwordOk = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordOk) {
      return reply.unauthorized("Credenciais invalidas.");
    }

    if (!user.isEmailVerified) {
      return reply.forbidden("Email ainda nao verificado.");
    }

    const token = await setAuthCookie(app, reply, {
      userId: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        course: user.course,
        university: user.university?.name ?? null,
      },
    };
  });

  app.get("/me", { preHandler: app.authenticate }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      include: {
        university: true,
        vehicle: true,
        drivenRoutes: true,
      },
    });

    if (!user) {
      throw app.httpErrors.notFound("Usuario nao encontrado.");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      course: user.course,
      photoUrl: user.photoUrl,
      isEmailVerified: user.isEmailVerified,
      university: user.university
        ? {
            id: user.university.id,
            name: user.university.name,
            city: user.university.city,
          }
        : null,
      vehicle: user.vehicle,
      drivenRoutesCount: user.drivenRoutes.length,
    };
  });
}
