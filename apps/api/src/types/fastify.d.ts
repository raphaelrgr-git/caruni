import type { SubscriptionPlanKey, UserRole } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      userId: string;
      email: string;
      role?: UserRole;
    };
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      role?: UserRole;
    };
    user: {
      userId: string;
      email: string;
      role?: UserRole;
    };
  }
}

export interface SignupBody {
  email: string;
  password: string;
  name: string;
  course?: string;
  universityName: string;
  role?: UserRole;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface SelectPlanBody {
  planKey: SubscriptionPlanKey;
}
