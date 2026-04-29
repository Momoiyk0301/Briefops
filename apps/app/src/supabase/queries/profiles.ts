import { SupabaseClient } from "@supabase/supabase-js";

export async function getUserPlan(
  client: SupabaseClient,
  userId: string
): Promise<"starter" | "pro" | "guest" | "funder" | "enterprise"> {
  const { data: membership, error: membershipError } = await client
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership?.workspace_id) return "starter";

  const { data, error } = await client
    .from("workspaces")
    .select("plan")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  if (error) throw error;
  const plan = String(data?.plan ?? "starter").toLowerCase();
  if (plan === "pro" || plan === "guest" || plan === "funder" || plan === "enterprise") return plan;
  return "starter";
}
