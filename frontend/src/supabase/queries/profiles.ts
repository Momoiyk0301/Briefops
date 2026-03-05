import { SupabaseClient } from "@supabase/supabase-js";

export async function getUserPlan(
  client: SupabaseClient,
  userId: string
): Promise<"free" | "starter" | "plus" | "pro"> {
  const { data, error } = await client
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error) throw error;
  const plan = String(data?.plan ?? "free").toLowerCase();
  if (plan === "start") return "starter";
  if (plan === "starter" || plan === "plus" || plan === "pro") return plan;
  return "free";
}
