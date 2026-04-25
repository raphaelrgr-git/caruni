import {
  SubscriptionStatus,
  WalletTransactionType,
  type SubscriptionPlanKey,
} from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createWeeklyCredits,
  endOfWeek,
  getActiveSubscription,
  PLAN_CATALOG,
  startOfWeek,
  toMoney,
} from "../lib/domain.js";
import { prisma } from "../prisma.js";

export async function registerPlansModule(app: FastifyInstance) {
  app.get("/plans", async () => {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { weeklyPrice: "asc" } });
    return plans.map((plan) => ({
      id: plan.id,
      key: plan.key,
      name: plan.name,
      weeklyPrice: toMoney(plan.weeklyPrice),
      creditsIncluded: plan.creditsIncluded,
      costPerTrip: toMoney(plan.costPerTrip),
      extraTripPrice: toMoney(plan.extraTripPrice),
      driverPayoutPerCredit: toMoney(plan.driverPayoutPerCredit),
      priority: plan.priority,
    }));
  });

  app.post("/subscriptions/select", { preHandler: app.authenticate }, async (request, reply) => {
    const body = z
      .object({
        planKey: z.enum(
          PLAN_CATALOG.map((plan) => plan.key) as [SubscriptionPlanKey, ...SubscriptionPlanKey[]],
        ),
        autoRenew: z.boolean().optional().default(false),
      })
      .parse(request.body);

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { key: body.planKey },
    });
    if (!plan) {
      return reply.notFound("Plano nao encontrado.");
    }

    const current = await getActiveSubscription(request.auth!.userId);

    const cycleStart = startOfWeek();
    const cycleEnd = endOfWeek();

    const subscription = await prisma.$transaction(async (tx) => {
      if (current) {
        await tx.userSubscription.update({
          where: { id: current.id },
          data: { status: SubscriptionStatus.CANCELLED },
        });
      }

      await tx.creditLedgerEntry.updateMany({
        where: {
          userId: request.auth!.userId,
          status: { in: ["DISPONIVEL", "RESERVADO"] },
        },
        data: { status: "EXPIRADO" },
      });

      const created = await tx.userSubscription.create({
        data: {
          userId: request.auth!.userId,
          planId: plan.id,
          autoRenew: body.autoRenew,
          cycleStart,
          cycleEnd,
        },
        include: { plan: true },
      });

      await tx.walletTransaction.create({
        data: {
          userId: request.auth!.userId,
          type: WalletTransactionType.ASSINATURA,
          description: `${plan.name} · ${plan.creditsIncluded} viagens garantidas`,
          amount: -plan.weeklyPrice,
        },
      });

      return created;
    });

    await createWeeklyCredits({
      userId: request.auth!.userId,
      subscriptionId: subscription.id,
      planId: plan.id,
      creditsIncluded: plan.creditsIncluded,
      costPerTrip: plan.costPerTrip,
      description: `${plan.name} · credito semanal`,
      expiresAt: cycleEnd,
    });

    return reply.code(201).send({
      id: subscription.id,
      status: subscription.status,
      cycleStart: subscription.cycleStart,
      cycleEnd: subscription.cycleEnd,
      plan: {
        key: subscription.plan.key,
        name: subscription.plan.name,
        weeklyPrice: toMoney(subscription.plan.weeklyPrice),
        creditsIncluded: subscription.plan.creditsIncluded,
        costPerTrip: toMoney(subscription.plan.costPerTrip),
        extraTripPrice: toMoney(subscription.plan.extraTripPrice),
        driverPayoutPerCredit: toMoney(subscription.plan.driverPayoutPerCredit),
        priority: subscription.plan.priority,
      },
    });
  });
}
