import { SupabaseClient } from "@supabase/supabase-js";

function currentMonthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function getCurrentMonthUsage(client: SupabaseClient, userId: string) {
  const monthStart = currentMonthStartIso();

  const { data, error } = await client
    .from("usage_counters")
    .select("id, user_id, month_start, pdf_exports")
    .eq("user_id", userId)
    .eq("month_start", monthStart)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function consumePdfExport(client: SupabaseClient, userId: string, limit = 3) {
  const { data, error } = await client.rpc("consume_pdf_export", {
    p_user_id: userId,
    p_free_limit: limit
  });

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(result?.allowed),
    used: Number(result?.used ?? 0)
  };
}
