import { ReactNode } from "react";
import { ZodType } from "zod";

export type UserPlan = "free" | "pro";
export type Locale = "fr" | "en";

export type AppUser = {
  id: string;
  email: string;
};

export type MeResponse = {
  user: AppUser | null;
  plan: UserPlan | null;
  org: { id: string; name: string } | null;
  degraded: boolean;
};

export type Briefing = {
  id: string;
  org_id: string;
  title: string;
  event_date: string | null;
  location_text: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type BriefingModuleRow = {
  id: string;
  briefing_id: string;
  module_key: ModuleKey;
  enabled: boolean;
  data_json: unknown;
  created_at: string;
  updated_at: string;
};

export type ModuleFormProps<T> = {
  value: T;
  onChange: (value: T) => void;
};

export type ModulePreviewProps<T> = {
  value: T;
};

export type ModuleKey =
  | "metadata"
  | "access"
  | "delivery"
  | "vehicle"
  | "equipment"
  | "staff"
  | "notes"
  | "contact";

export type MetadataExtra = {
  main_contact_name: string;
  main_contact_phone: string;
  global_notes: string;
};

export type AccessData = {
  address: string;
  parking: string;
  entrance: string;
  on_site_contact: string;
};

export type DeliveryItem = {
  time: string;
  place: string;
  contact: string;
  notes: string;
};

export type DeliveryData = {
  deliveries: DeliveryItem[];
};

export type VehicleItem = {
  type: string;
  plate: string;
  pickup_address: string;
  pickup_time: string;
  return_address: string;
  notes: string;
};

export type VehicleData = {
  vehicles: VehicleItem[];
};

export type EquipmentData = {
  items_text: string;
};

export type StaffItem = {
  role: string;
  count: number;
  notes: string;
};

export type StaffData = {
  roles: StaffItem[];
};

export type NotesData = {
  text: string;
};

export type ContactItem = {
  name: string;
  role: string;
  phone: string;
  email: string;
};

export type ContactData = {
  people: ContactItem[];
};

export type ModuleDataMap = {
  metadata: MetadataExtra;
  access: AccessData;
  delivery: DeliveryData;
  vehicle: VehicleData;
  equipment: EquipmentData;
  staff: StaffData;
  notes: NotesData;
  contact: ContactData;
};

export type ModuleState<K extends ModuleKey> = {
  key: K;
  enabled: boolean;
  data: ModuleDataMap[K];
};

export type EditorCore = {
  title: string;
  event_date: string | null;
  location_text: string;
};

export type EditorState = {
  core: EditorCore;
  modules: {
    [K in ModuleKey]: ModuleState<K>;
  };
  selectedModuleKey: Exclude<ModuleKey, "metadata">;
};

export type ModuleRegistryEntry<K extends ModuleKey> = {
  key: K;
  order: number;
  labels: { fr: string; en: string };
  description: { fr: string; en: string };
  defaultEnabled: boolean;
  isMandatory?: boolean;
  schema: ZodType<ModuleDataMap[K]>;
  defaultData: ModuleDataMap[K];
  FormComponent: (props: ModuleFormProps<ModuleDataMap[K]>) => ReactNode;
  PreviewComponent: (props: ModulePreviewProps<ModuleDataMap[K]>) => ReactNode;
};
