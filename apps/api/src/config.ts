import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  COOKIE_SECRET: z.string().min(8),
  FRONTEND_URL: z.string().default("http://localhost:8080"),
  GOOGLE_MAPS_SERVER_API_KEY: z.string().optional(),
  ORS_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
