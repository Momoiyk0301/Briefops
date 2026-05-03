import type { PdfLang, ModulePdfLabels } from "@/modules/shared";

export type VehiclePdfField =
  | "type"
  | "plate"
  | "pickup_address"
  | "pickup_time"
  | "return_address"
  | "notes";

export const VEHICLE_PDF_LABELS: ModulePdfLabels<VehiclePdfField> = {
  type:           { fr: "Type",                    en: "Type",           nl: "Type" },
  plate:          { fr: "Immatriculation",          en: "Plate",          nl: "Nummerplaat" },
  pickup_address: { fr: "Lieu de départ",           en: "Pickup address", nl: "Vertrekplaats" },
  pickup_time:    { fr: "Heure de départ",          en: "Pickup time",    nl: "Vertrektijd" },
  return_address: { fr: "Lieu de retour",           en: "Return address", nl: "Retouradres" },
  notes:          { fr: "Notes",                   en: "Notes",          nl: "Notities" },
};

export function vehicleLabel(field: VehiclePdfField, lang: PdfLang = "fr"): string {
  return VEHICLE_PDF_LABELS[field][lang];
}
