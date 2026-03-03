import { z } from "zod";

const trimmed = (schema: z.ZodTypeAny) =>
  z.preprocess((value) => (typeof value === "string" ? value.trim() : value), schema);

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: trimmed(z.string().url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: trimmed(z.string().min(1)),
  SUPABASE_SERVICE_ROLE_KEY: trimmed(z.string().min(1)), // server only
  APP_URL: trimmed(z.string().url()).default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Missing or invalid environment variables");
}

export const env = parsed.data;

export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY
};

const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: trimmed(z.string().min(1)),
  STRIPE_WEBHOOK_SECRET: trimmed(z.string().min(1)),
  STRIPE_PRICE_ID: trimmed(z.string().min(1))
});

export function getStripeEnv() {
  const stripeParsed = stripeEnvSchema.safeParse(process.env);
  if (!stripeParsed.success) {
    console.error("Invalid Stripe environment variables", stripeParsed.error.flatten().fieldErrors);
    throw new Error("Missing or invalid Stripe environment variables");
  }

  return stripeParsed.data;
}
