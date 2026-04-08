import { z } from "zod";

const trimmed = (schema: z.ZodTypeAny) =>
  z.preprocess((value) => (typeof value === "string" ? value.trim() : value), schema);

const baseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: trimmed(z.string().min(1)),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: trimmed(z.string().min(1)),
  SUPABASE_SERVICE_ROLE_KEY: trimmed(z.string().min(1)), // server only
  APP_URL: trimmed(z.string().url()).default("http://localhost:3000"),
  MARKETING_SITE_URL: trimmed(z.string().url()).default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isStripePriceId(value: string): boolean {
  return /^price_/i.test(value.trim());
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveSupabaseUrl(rawUrl: string, anonKey: string): string {
  if (isValidHttpUrl(rawUrl)) {
    return rawUrl;
  }

  const payload = decodeJwtPayload(anonKey);
  const ref = typeof payload?.ref === "string" ? payload.ref : null;
  if (ref) {
    const inferred = `https://${ref}.supabase.co`;
    console.warn("NEXT_PUBLIC_SUPABASE_URL invalid; using inferred URL from anon key", { inferred });
    return inferred;
  }

  throw new Error("Missing or invalid environment variables");
}

const parsed = baseSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Missing or invalid environment variables");
}

export const env = {
  ...parsed.data,
  NEXT_PUBLIC_SUPABASE_URL: resolveSupabaseUrl(
    parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
};

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
  STRIPE_STARTER_ID: trimmed(z.string().min(1)),
  STRIPE_PRO_ID: trimmed(z.string().min(1)),
  STRIPE_PLUS_ID: trimmed(z.string()).optional(),
  STRPE_PLUS_ID: trimmed(z.string()).optional()
});

export function getStripeEnv() {
  const stripeParsed = stripeEnvSchema.safeParse(process.env);
  if (!stripeParsed.success) {
    console.error("Invalid Stripe environment variables", stripeParsed.error.flatten().fieldErrors);
    throw new Error("Missing or invalid Stripe environment variables");
  }

  const plusId = stripeParsed.data.STRIPE_PLUS_ID || stripeParsed.data.STRPE_PLUS_ID;
  if (!plusId) {
    console.error("Invalid Stripe environment variables", { STRIPE_PLUS_ID: ["Required"] });
    throw new Error("Missing or invalid Stripe environment variables");
  }

  const invalidPriceIds = [
    ["STRIPE_STARTER_ID", stripeParsed.data.STRIPE_STARTER_ID],
    ["STRIPE_PRO_ID", stripeParsed.data.STRIPE_PRO_ID],
    ["STRIPE_PLUS_ID", plusId]
  ].filter(([, value]) => !isStripePriceId(value));

  if (invalidPriceIds.length) {
    console.error("Invalid Stripe environment variables", {
      stripe_prices: invalidPriceIds.map(([name, value]) => `${name} must be a Stripe price id (price_...), got ${value}`)
    });
    throw new Error("Missing or invalid Stripe environment variables");
  }

  return {
    ...stripeParsed.data,
    STRIPE_PLUS_ID: plusId
  };
}
