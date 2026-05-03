-- Make briefing_id optional on staff (allow workspace-level staff without briefing link)
ALTER TABLE public.staff
  ALTER COLUMN briefing_id DROP NOT NULL;

-- Briefing-staff junction table for multi-assignment
CREATE TABLE IF NOT EXISTS public.briefing_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id uuid NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (briefing_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_briefing_staff_briefing_id ON public.briefing_staff(briefing_id);
CREATE INDEX IF NOT EXISTS idx_briefing_staff_staff_id ON public.briefing_staff(staff_id);
CREATE INDEX IF NOT EXISTS idx_briefing_staff_workspace_id ON public.briefing_staff(workspace_id);

ALTER TABLE public.briefing_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_staff FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS briefing_staff_select ON public.briefing_staff;
DROP POLICY IF EXISTS briefing_staff_insert ON public.briefing_staff;
DROP POLICY IF EXISTS briefing_staff_delete ON public.briefing_staff;

CREATE POLICY briefing_staff_select ON public.briefing_staff
  FOR SELECT TO authenticated
  USING (public.is_org_member(workspace_id));

CREATE POLICY briefing_staff_insert ON public.briefing_staff
  FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(workspace_id, ARRAY['owner', 'admin', 'member']));

CREATE POLICY briefing_staff_delete ON public.briefing_staff
  FOR DELETE TO authenticated
  USING (public.has_org_role(workspace_id, ARRAY['owner', 'admin', 'member']));

GRANT SELECT, INSERT, DELETE ON public.briefing_staff TO authenticated;
