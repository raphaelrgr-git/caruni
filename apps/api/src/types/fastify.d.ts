import type { SubscriptionPlanKey } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      userId: string;
      email: string;
    };
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
    };
    user: {
      userId: string;
      email: string;
    };
  }
}

export interface SignupBody {
  email: string;
  password: string;
  name: string;
  course?: string;
  universityName: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface SelectPlanBody {
  planKey: SubscriptionPlanKey;
}
