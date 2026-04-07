import { SupabaseClient } from "@supabase/supabase-js";

const SELECT_WORKSPACE_FIELDS =
  "id,name,country,team_size,vat_number,storage_used_bytes,briefings_count,pdf_exports_month,pdf_exports_reset_at,logo_path,initials,due_at,plan,stripe_customer_id,stripe_subscription_id,stripe_price_id,subscription_name,subscription_status,current_period_end";

export async function getWorkspaceById(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client
    .from("workspaces")
    .select(SELECT_WORKSPACE_FIELDS)
    .eq("id", workspaceId)
    .single();

  if (error) throw error;
  return data;
}

export async function getWorkspaceForUser(client: SupabaseClient, userId: string) {
  const { data: membership, error: membershipError } = await client
    .from("memberships")
    .select("workspace_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership?.workspace_id) return null;
  return getWorkspaceById(client, membership.workspace_id);
}
