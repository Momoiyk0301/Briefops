import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const createStaffSchema = z.object({
  briefing_id: z.string().uuid(),
  full_name: z.string().trim().min(1),
  role: z.string().trim().min(1).default("staff"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().trim().optional()
});

const updateStaffSchema = z.object({
  full_name: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  notes: z.string().trim().optional()
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

const SELECT_STAFF_FIELDS = "id, workspace_id, briefing_id, full_name, role, phone, email, notes, created_at, updated_at";

export async function listStaffByWorkspace(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client
    .from("staff")
    .select(SELECT_STAFF_FIELDS)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStaffById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from("staff")
    .select(SELECT_STAFF_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createStaff(client: SupabaseClient, workspaceId: string, input: CreateStaffInput) {
  const payload = createStaffSchema.parse(input);
  const { data, error } = await client
    .from("staff")
    .insert({
      workspace_id: workspaceId,
      briefing_id: payload.briefing_id,
      full_name: payload.full_name,
      role: payload.role,
      phone: payload.phone ?? null,
      email: payload.email || null,
      notes: payload.notes ?? null
    })
    .select(SELECT_STAFF_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

export async function updateStaff(client: SupabaseClient, id: string, input: UpdateStaffInput) {
  const payload = updateStaffSchema.parse(input);
  const { data, error } = await client
    .from("staff")
    .update({
      ...payload,
      email: payload.email === "" ? null : payload.email ?? undefined
    })
    .eq("id", id)
    .select(SELECT_STAFF_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStaff(client: SupabaseClient, id: string) {
  const { error } = await client.from("staff").delete().eq("id", id);
  if (error) throw error;
}
