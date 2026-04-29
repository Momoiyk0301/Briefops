import { z } from "zod";

import { DeliverySettings, ModuleFieldDefinition, ModuleSettingDefinition } from "@/lib/types";

export const deliverySchema = z.object({
  deliveries: z.array(
    z.object({
      time: z.string(),
      place: z.string(),
      contact: z.string(),
      tag_mode: z.enum(["", "depot", "retour", "custom"]).optional().default(""),
      custom_tag: z.string().optional().default(""),
      notes: z.string()
    })
  )
});

export const deliverySettingsSchema = z.object({
  enable_depot_tag: z.boolean().default(true),
  enable_retour_tag: z.boolean().default(true),
  allow_custom_tag: z.boolean().default(true)
});

export const deliverySettingsDefinitions: ModuleSettingDefinition[] = [
  {
    key: "enable_depot_tag",
    type: "boolean",
    label: "Activer le tag depot",
    description: "Permet de tagger une livraison comme depot"
  },
  {
    key: "enable_retour_tag",
    type: "boolean",
    label: "Activer le tag retour",
    description: "Permet de tagger une livraison comme retour"
  },
  {
    key: "allow_custom_tag",
    type: "boolean",
    label: "Autoriser un tag personnalisé",
    description: "Permet de saisir un tag libre"
  }
];

export const deliveryFieldDefinitions: ModuleFieldDefinition[] = [
  { key: "time", type: "time", label: "Time", placeholder: "Time" },
  { key: "place", type: "text", label: "Place", placeholder: "Place" },
  { key: "contact", type: "text", label: "Contact", placeholder: "Contact" },
  {
    key: "tag_mode",
    type: "select",
    label: "Tag",
    placeholder: "Select a tag",
    visibilityMode: "any",
    visibleWhen: [
      { source: "settings", path: "enable_depot_tag", truthy: true },
      { source: "settings", path: "enable_retour_tag", truthy: true },
      { source: "settings", path: "allow_custom_tag", truthy: true }
    ],
    options: [
      {
        value: "depot",
        label: "Depot",
        visibleWhen: [{ source: "settings", path: "enable_depot_tag", truthy: true }]
      },
      {
        value: "retour",
        label: "Retour",
        visibleWhen: [{ source: "settings", path: "enable_retour_tag", truthy: true }]
      },
      {
        value: "custom",
        label: "Custom",
        visibleWhen: [{ source: "settings", path: "allow_custom_tag", truthy: true }]
      }
    ]
  },
  {
    key: "custom_tag",
    type: "text",
    label: "Custom tag",
    placeholder: "Type a custom tag",
    visibleWhen: [{ source: "values", path: "tag_mode", equals: "custom" }]
  },
  { key: "notes", type: "textarea", label: "Notes", placeholder: "Notes" }
];

export const defaultDeliveryData = { deliveries: [] };

export const defaultDeliverySettings: DeliverySettings = {
  enable_depot_tag: true,
  enable_retour_tag: true,
  allow_custom_tag: true
};

