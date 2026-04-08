import { ComponentType, ReactNode } from "react";
import { ZodType, ZodTypeDef } from "zod";

export type UserPlan = "free" | "starter" | "plus" | "pro" | "guest" | "funder" | "enterprise";
export type Locale = "fr" | "en";
export type MembershipRole = "owner" | "admin" | "member";

export type AppUser = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_path?: string | null;
  initials?: string | null;
};

export type MeResponse = {
  user: AppUser | null;
  plan: UserPlan | null;
  subscription_name?: string | null;
  subscription_status?: string | null;
  stripe_price_id?: string | null;
  current_period_end?: string | null;
  usage?: {
    pdf_exports_used: number;
    pdf_exports_limit: number | null;
    pdf_exports_remaining: number | null;
  };
  org: {
    id: string;
    name: string;
    initials?: string | null;
    logo_path?: string | null;
    briefings_count?: number | null;
    storage_used_bytes?: number | null;
    pdf_exports_month?: number | null;
    due_at?: string | null;
  } | null;
  workspace?: {
    id: string;
    name: string;
    initials?: string | null;
    logo_path?: string | null;
    briefings_count?: number | null;
    storage_used_bytes?: number | null;
    pdf_exports_month?: number | null;
    due_at?: string | null;
  } | null;
  has_membership?: boolean;
  onboarding_step?: "workspace" | "products" | "demo" | "done" | null;
  role: MembershipRole | null;
  is_admin: boolean;
  degraded: boolean;
  degraded_reason?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  stripe_price_id: string | null;
  price_amount: number;
  price_currency: string;
  billing_interval: string;
  features: string[];
  is_highlighted: boolean;
  sort_order: number;
};

export type StaffMember = {
  id: string;
  org_id?: string;
  workspace_id?: string;
  briefing_id: string;
  full_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Briefing = {
  id: string;
  org_id?: string;
  workspace_id?: string;
  title: string;
  status?: "draft" | "ready" | "archived" | string;
  shared?: boolean;
  event_date: string | null;
  location_text: string | null;
  pdf_path?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type PublicLinkStatus = "active" | "expired" | "revoked";
export type PublicLinkType = "staff" | "audience";

export type PublicLink = {
  id: string;
  briefing_id: string;
  resource_type: string;
  link_type: PublicLinkType;
  audience_tag?: string | null;
  team?: string | null;
  token: string;
  created_by: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  status: PublicLinkStatus;
  url: string;
};

export type PublicLinkWithBriefing = PublicLink & {
  briefing_title: string;
  pdf_path: string | null;
};

export type BriefingModuleRow = {
  id: string;
  briefing_id: string;
  module_id?: string | null;
  module_key: ModuleKey;
  enabled: boolean;
  settings?: unknown;
  values?: unknown;
  data_json: unknown;
  created_at: string;
  updated_at: string;
};

export type RegistryModule = {
  id: string;
  org_id?: string | null;
  workspace_id?: string | null;
  name: string;
  type: ModuleKey;
  version: number;
  icon: string;
  category: string;
  enabled: boolean;
  global_enabled?: boolean;
  workspace_enabled?: boolean;
  workspace_module_id?: string | null;
  settings_schema?: unknown;
  field_schema?: unknown;
  default_settings?: unknown;
  default_layout: unknown;
  default_data: unknown;
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
  team_mode: boolean;
  teams: string[];
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
  tag_mode?: "" | "depot" | "retour" | "custom";
  custom_tag?: string;
  notes: string;
};

export type DeliveryData = {
  deliveries: DeliveryItem[];
};

export type DeliverySettings = {
  enable_depot_tag: boolean;
  enable_retour_tag: boolean;
  allow_custom_tag: boolean;
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
  module_id?: string | null;
  key: K;
  enabled: boolean;
  metadata: ModuleMetadata;
  audience: ModuleAudience;
  layout: ModuleLayout;
  settings: Record<string, unknown>;
  data: ModuleDataMap[K];
};

export type ModuleMetadata = {
  type: string;
  label: string;
  version: number;
  enabled: boolean;
  order: number;
  description: string;
  icon: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type ModuleAudience = {
  mode: "all" | "teams";
  teams: string[];
  visibility: "visible" | "hidden";
};

export type ModuleLayout = {
  desktop: { x: number; y: number; w: number; h: number; page: number };
  mobile: { x: number; y: number; w: number; h: number };
  constraints: { minW: number; minH: number; maxW: number; maxH: number };
  behavior: { draggable: boolean; resizable: boolean };
  style: { variant: string; shape: string; density: string };
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
  schema: ZodType<ModuleDataMap[K], ZodTypeDef, unknown>;
  defaultData: ModuleDataMap[K];
  settingsSchema?: ZodType<Record<string, unknown>, ZodTypeDef, unknown>;
  defaultSettings?: Record<string, unknown>;
  FormComponent: ComponentType<any>;
  PreviewComponent: ComponentType<any>;
};

export type ModuleDefinitionEntry<K extends ModuleKey> = {
  key: K;
  order: number;
  labels: { fr: string; en: string };
  description: { fr: string; en: string };
  defaultEnabled: boolean;
  isMandatory?: boolean;
  schema: ZodType<ModuleDataMap[K], ZodTypeDef, unknown>;
  defaultData: ModuleDataMap[K];
  settingsSchema?: ZodType<Record<string, unknown>, ZodTypeDef, unknown>;
  defaultSettings?: Record<string, unknown>;
};

export type ModuleVisibilityRule = {
  source: "settings" | "values";
  path: string;
  equals?: string | boolean | number;
  notEquals?: string | boolean | number;
  truthy?: boolean;
};

export type ModuleFieldOption = {
  value: string;
  label: string;
  visibleWhen?: ModuleVisibilityRule[];
};

export type ModuleFieldDefinition = {
  key: string;
  type: "text" | "textarea" | "time" | "select";
  label: string;
  placeholder?: string;
  options?: ModuleFieldOption[];
  visibleWhen?: ModuleVisibilityRule[];
  visibilityMode?: "all" | "any";
};

export type ModuleSettingDefinition = {
  key: string;
  type: "boolean";
  label: string;
  description?: string;
};
