import { z } from "zod";

import { AccessForm } from "@/components/briefing/forms/AccessForm";
import { ContactForm } from "@/components/briefing/forms/ContactForm";
import { DeliveryForm } from "@/components/briefing/forms/DeliveryForm";
import { EquipmentForm } from "@/components/briefing/forms/EquipmentForm";
import { NotesForm } from "@/components/briefing/forms/NotesForm";
import { StaffForm } from "@/components/briefing/forms/StaffForm";
import { VehicleForm } from "@/components/briefing/forms/VehicleForm";
import { AccessPreview } from "@/components/briefing/preview/AccessPreview";
import { ContactPreview } from "@/components/briefing/preview/ContactPreview";
import { DeliveryPreview } from "@/components/briefing/preview/DeliveryPreview";
import { EquipmentPreview } from "@/components/briefing/preview/EquipmentPreview";
import { NotesPreview } from "@/components/briefing/preview/NotesPreview";
import { StaffPreview } from "@/components/briefing/preview/StaffPreview";
import { VehiclePreview } from "@/components/briefing/preview/VehiclePreview";
import { ModuleDataMap, ModuleKey, ModuleRegistryEntry } from "@/lib/types";

const metadataSchema = z.object({
  main_contact_name: z.string(),
  main_contact_phone: z.string(),
  global_notes: z.string()
});

const accessSchema = z.object({
  address: z.string(),
  parking: z.string(),
  entrance: z.string(),
  on_site_contact: z.string()
});

const deliverySchema = z.object({
  deliveries: z.array(
    z.object({
      time: z.string(),
      place: z.string(),
      contact: z.string(),
      notes: z.string()
    })
  )
});

const vehicleSchema = z.object({
  vehicles: z.array(
    z.object({
      type: z.string(),
      plate: z.string(),
      pickup_address: z.string(),
      pickup_time: z.string(),
      return_address: z.string(),
      notes: z.string()
    })
  )
});

const equipmentSchema = z.object({
  items_text: z.string()
});

const staffSchema = z.object({
  roles: z.array(
    z.object({
      role: z.string(),
      count: z.number().int().min(0),
      notes: z.string()
    })
  )
});

const notesSchema = z.object({
  text: z.string()
});

const contactSchema = z.object({
  people: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      phone: z.string(),
      email: z.string()
    })
  )
});

export const moduleRegistry: { [K in ModuleKey]: ModuleRegistryEntry<K> } = {
  metadata: {
    key: "metadata",
    order: 0,
    labels: { fr: "Métadonnées", en: "Metadata" },
    description: { fr: "Toujours affiché", en: "Always visible" },
    defaultEnabled: true,
    isMandatory: true,
    schema: metadataSchema,
    defaultData: { main_contact_name: "", main_contact_phone: "", global_notes: "" },
    FormComponent: () => null,
    PreviewComponent: () => null
  },
  access: {
    key: "access",
    order: 1,
    labels: { fr: "Accès", en: "Access" },
    description: { fr: "Lieu et accès", en: "Venue access" },
    defaultEnabled: true,
    schema: accessSchema,
    defaultData: { address: "", parking: "", entrance: "", on_site_contact: "" },
    FormComponent: AccessForm,
    PreviewComponent: AccessPreview
  },
  delivery: {
    key: "delivery",
    order: 2,
    labels: { fr: "Livraisons", en: "Delivery" },
    description: { fr: "Planning des livraisons", en: "Delivery planning" },
    defaultEnabled: false,
    schema: deliverySchema,
    defaultData: { deliveries: [] },
    FormComponent: DeliveryForm,
    PreviewComponent: DeliveryPreview
  },
  vehicle: {
    key: "vehicle",
    order: 3,
    labels: { fr: "Véhicules", en: "Vehicle" },
    description: { fr: "Transport", en: "Transport" },
    defaultEnabled: false,
    schema: vehicleSchema,
    defaultData: { vehicles: [] },
    FormComponent: VehicleForm,
    PreviewComponent: VehiclePreview
  },
  equipment: {
    key: "equipment",
    order: 4,
    labels: { fr: "Équipement", en: "Equipment" },
    description: { fr: "Liste matériel", en: "Gear list" },
    defaultEnabled: false,
    schema: equipmentSchema,
    defaultData: { items_text: "" },
    FormComponent: EquipmentForm,
    PreviewComponent: EquipmentPreview
  },
  staff: {
    key: "staff",
    order: 5,
    labels: { fr: "Staff", en: "Staff" },
    description: { fr: "Rôles et effectifs", en: "Roles and headcount" },
    defaultEnabled: false,
    schema: staffSchema,
    defaultData: { roles: [] },
    FormComponent: StaffForm,
    PreviewComponent: StaffPreview
  },
  notes: {
    key: "notes",
    order: 6,
    labels: { fr: "Notes", en: "Notes" },
    description: { fr: "Informations libres", en: "Free text" },
    defaultEnabled: true,
    schema: notesSchema,
    defaultData: { text: "" },
    FormComponent: NotesForm,
    PreviewComponent: NotesPreview
  },
  contact: {
    key: "contact",
    order: 7,
    labels: { fr: "Contacts", en: "Contact" },
    description: { fr: "Équipe projet", en: "Project contacts" },
    defaultEnabled: false,
    schema: contactSchema,
    defaultData: { people: [] },
    FormComponent: ContactForm,
    PreviewComponent: ContactPreview
  }
};

export const moduleEntries = (Object.values(moduleRegistry) as ModuleRegistryEntry<ModuleKey>[]).sort(
  (a, b) => a.order - b.order
);

export function parseModuleData<K extends ModuleKey>(key: K, value: unknown): ModuleDataMap[K] {
  return moduleRegistry[key].schema.parse(value);
}
