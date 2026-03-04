import { SupabaseClient } from "@supabase/supabase-js";

export async function getUserPlan(client: SupabaseClient, userId: string): Promise<"free" | "start" | "pro"> {
  const { data, error } = await client
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error) throw error;
  const plan = String(data?.plan ?? "free").toLowerCase();
  if (plan === "start" || plan === "pro") return plan;
  return "free";
}
