-- Add tags array and order_index to briefing_modules
ALTER TABLE briefing_modules
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Backfill tags from existing data_json->audience->teams
UPDATE briefing_modules
SET tags = ARRAY(
  SELECT jsonb_array_elements_text(data_json->'audience'->'teams')
)
WHERE data_json->'audience'->'teams' IS NOT NULL
  AND jsonb_typeof(data_json->'audience'->'teams') = 'array'
  AND jsonb_array_length(data_json->'audience'->'teams') > 0;

-- Add views_count to public_links
ALTER TABLE public_links
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_briefing_modules_tags ON briefing_modules USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_public_links_token ON public_links(token);

-- Atomic views_count increment (callable from service role)
CREATE OR REPLACE FUNCTION increment_views_count_for_link(p_link_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public_links
  SET views_count = views_count + 1
  WHERE id = p_link_id;
$$;
