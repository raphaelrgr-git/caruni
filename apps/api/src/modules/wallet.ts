import { CreditStatus, WalletTransactionType } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { getActiveSubscription, getWalletSummary, toMoney } from "../lib/domain.js";
import { prisma } from "../prisma.js";

export async function registerWalletModule(app: FastifyInstance) {
  app.get("/wallet", { preHandler: app.authenticate }, async (request) => {
    return getWalletSummary(request.auth!.userId);
  });

  app.post("/wallet/extra-credit", { preHandler: app.authenticate }, async (request, reply) => {
    const subscription = await getActiveSubscription(request.auth!.userId);
    if (!subscription) {
      return reply.badRequest("Selecione um plano antes de comprar viagem extra.");
    }

    const credit = await prisma.creditLedgerEntry.create({
      data: {
        userId: request.auth!.userId,
        subscriptionId: subscription.id,
        planId: subscription.planId,
        status: CreditStatus.DISPONIVEL,
        monetaryValue: subscription.plan.extraTripPrice,
        description: `Viagem extra · ${subscription.plan.name}`,
        expiresAt: subscription.cycleEnd,
      },
    });

    await prisma.walletTransaction.create({
      data: {
        userId: request.auth!.userId,
        type: WalletTransactionType.EXTRA_CREDIT_PURCHASE,
        description: `Compra interna de viagem extra · ${subscription.plan.name}`,
        amount: -subscription.plan.extraTripPrice,
      },
    });

    return reply.code(201).send({
      id: credit.id,
      status: credit.status,
      monetaryValue: toMoney(credit.monetaryValue),
      expiresAt: credit.expiresAt,
    });
  });
}
