alter table public.modules
  add column if not exists settings_schema jsonb not null default '[]'::jsonb,
  add column if not exists field_schema jsonb not null default '[]'::jsonb,
  add column if not exists default_settings jsonb not null default '{}'::jsonb;

alter table public.briefing_modules
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists values jsonb not null default '{}'::jsonb;

update public.modules
set
  settings_schema = coalesce(settings_schema, '[]'::jsonb),
  field_schema = coalesce(field_schema, '[]'::jsonb),
  default_settings = coalesce(default_settings, '{}'::jsonb)
where true;

update public.briefing_modules
set
  settings = case
    when jsonb_typeof(data_json) = 'object' and data_json ? 'settings' then coalesce(data_json->'settings', '{}'::jsonb)
    else settings
  end,
  values = case
    when jsonb_typeof(data_json) = 'object' and data_json ? 'data' then coalesce(data_json->'data', '{}'::jsonb)
    when jsonb_typeof(data_json) = 'object' then data_json
    else values
  end
where true;

update public.modules
set
  settings_schema = '[
    {
      "key": "enable_depot_tag",
      "type": "boolean",
      "label": "Activer le tag depot",
      "description": "Permet de tagger une livraison comme depot"
    },
    {
      "key": "enable_retour_tag",
      "type": "boolean",
      "label": "Activer le tag retour",
      "description": "Permet de tagger une livraison comme retour"
    },
    {
      "key": "allow_custom_tag",
      "type": "boolean",
      "label": "Autoriser un tag personnalisé",
      "description": "Permet de saisir un tag libre"
    }
  ]'::jsonb,
  field_schema = '[
    {
      "key": "time",
      "type": "time",
      "label": "Time",
      "placeholder": "Time"
    },
    {
      "key": "place",
      "type": "text",
      "label": "Place",
      "placeholder": "Place"
    },
    {
      "key": "contact",
      "type": "text",
      "label": "Contact",
      "placeholder": "Contact"
    },
    {
      "key": "tag_mode",
      "type": "select",
      "label": "Tag",
      "placeholder": "Select a tag",
      "options": [
        {
          "value": "depot",
          "label": "Depot",
          "visibleWhen": [{ "source": "settings", "path": "enable_depot_tag", "truthy": true }]
        },
        {
          "value": "retour",
          "label": "Retour",
          "visibleWhen": [{ "source": "settings", "path": "enable_retour_tag", "truthy": true }]
        },
        {
          "value": "custom",
          "label": "Custom",
          "visibleWhen": [{ "source": "settings", "path": "allow_custom_tag", "truthy": true }]
        }
      ],
      "visibleWhen": [
        {
          "source": "settings",
          "path": "enable_depot_tag",
          "truthy": true
        }
      ],
      "visibilityMode": "any"
    },
    {
      "key": "custom_tag",
      "type": "text",
      "label": "Custom tag",
      "placeholder": "Type a custom tag",
      "visibleWhen": [{ "source": "values", "path": "tag_mode", "equals": "custom" }]
    },
    {
      "key": "notes",
      "type": "textarea",
      "label": "Notes",
      "placeholder": "Notes"
    }
  ]'::jsonb,
  default_settings = '{
    "enable_depot_tag": true,
    "enable_retour_tag": true,
    "allow_custom_tag": true
  }'::jsonb
where type = 'delivery';
