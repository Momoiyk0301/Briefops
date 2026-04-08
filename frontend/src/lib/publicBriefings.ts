import { parseModuleRow } from "@/lib/moduleCanonical";
import { moduleEntries } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow, ContactData, DeliveryData, EquipmentData, NotesData, StaffData, AccessData, MetadataExtra } from "@/lib/types";
import { hasModulePresentation, modulePresentations } from "@/modules";

type PublicSection = {
  id: "access" | "schedule" | "mission" | "contacts" | "material" | "notes";
  title: string;
  items: string[];
};

function normalizeTag(tag?: string | null) {
  if (!tag) return null;
  const normalized = tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || null;
}

function isModuleVisible(module: BriefingModuleRow, audienceTag?: string | null) {
  const entry = moduleEntries.find((item) => item.key === module.module_key);
  if (!entry) return false;
  const parsed = parseModuleRow({ key: entry.key, row: module, entry });
  if (!parsed.enabled || parsed.audience.visibility === "hidden") return false;

  if (parsed.audience.mode !== "teams") return true;
  if (!audienceTag) return false;
  return parsed.audience.teams.some((team) => normalizeTag(team) === normalizeTag(audienceTag));
}

function compact(values: Array<string | null | undefined>) {
  return values.map((value) => (value ?? "").trim()).filter(Boolean);
}

export function buildPublicBriefingSections(modules: BriefingModuleRow[], audienceTag?: string | null) {
  const visibleModules = modules.filter((module) => isModuleVisible(module, audienceTag));
  const byKey = new Map(visibleModules.map((module) => [module.module_key, module]));

  const metadataEntry = moduleEntries.find((item) => item.key === "metadata");
  const accessEntry = moduleEntries.find((item) => item.key === "access");
  const deliveryEntry = moduleEntries.find((item) => item.key === "delivery");
  const staffEntry = moduleEntries.find((item) => item.key === "staff");
  const contactEntry = moduleEntries.find((item) => item.key === "contact");
  const equipmentEntry = moduleEntries.find((item) => item.key === "equipment");
  const notesEntry = moduleEntries.find((item) => item.key === "notes");

  const metadata = metadataEntry && byKey.get("metadata")
    ? parseModuleRow({ key: "metadata", row: byKey.get("metadata"), entry: metadataEntry }).data as MetadataExtra
    : null;
  const access = accessEntry && byKey.get("access")
    ? parseModuleRow({ key: "access", row: byKey.get("access"), entry: accessEntry }).data as AccessData
    : null;
  const delivery = deliveryEntry && byKey.get("delivery")
    ? parseModuleRow({ key: "delivery", row: byKey.get("delivery"), entry: deliveryEntry }).data as DeliveryData
    : null;
  const staff = staffEntry && byKey.get("staff")
    ? parseModuleRow({ key: "staff", row: byKey.get("staff"), entry: staffEntry }).data as StaffData
    : null;
  const contact = contactEntry && byKey.get("contact")
    ? parseModuleRow({ key: "contact", row: byKey.get("contact"), entry: contactEntry }).data as ContactData
    : null;
  const equipment = equipmentEntry && byKey.get("equipment")
    ? parseModuleRow({ key: "equipment", row: byKey.get("equipment"), entry: equipmentEntry }).data as EquipmentData
    : null;
  const notes = notesEntry && byKey.get("notes")
    ? parseModuleRow({ key: "notes", row: byKey.get("notes"), entry: notesEntry }).data as NotesData
    : null;

  const presentationSections = visibleModules.flatMap((module) => {
    if (!hasModulePresentation(module.module_key)) return [];
    const entry = moduleEntries.find((item) => item.key === module.module_key);
    const builder = modulePresentations[module.module_key].buildPublicSection;
    if (!entry || !builder) return [];
    const parsed = parseModuleRow({ key: module.module_key, row: module, entry });
    const section = builder(parsed.data as never);
    return section ? [section] : [];
  });

  const presentationSectionById = new Map(presentationSections.map((section) => [section.id, section]));

  const sections: PublicSection[] = [
    presentationSectionById.get("access") ?? {
      id: "access",
      title: "Access",
      items: compact([
        access?.address ? `Adresse: ${access.address}` : null,
        access?.entrance ? `Entrée: ${access.entrance}` : null,
        access?.parking ? `Parking: ${access.parking}` : null,
        access?.on_site_contact ? `Contact sur site: ${access.on_site_contact}` : null
      ])
    },
    presentationSectionById.get("schedule") ?? {
      id: "schedule",
      title: "Schedule",
      items: delivery?.deliveries.flatMap((item) =>
        compact([
          item.time ? `${item.time} · ${item.place || "Lieu à confirmer"}` : item.place,
          item.contact ? `Contact: ${item.contact}` : null,
          item.notes
        ])
      ) ?? []
    },
    {
      id: "mission",
      title: "Mission",
      items: staff?.roles.flatMap((item) =>
        compact([item.role ? `${item.role} · ${item.count || 0}` : null, item.notes])
      ) ?? []
    },
    {
      id: "contacts",
      title: "Contacts",
      items: [
        ...compact([
          metadata?.main_contact_name ? `${metadata.main_contact_name}${metadata.main_contact_phone ? ` · ${metadata.main_contact_phone}` : ""}` : null
        ]),
        ...(
          contact?.people.flatMap((person) =>
            compact([`${person.name || "Contact"} · ${person.role || "Rôle"}`, person.phone, person.email])
          ) ?? []
        )
      ]
    },
    {
      id: "material",
      title: "Material",
      items: compact([equipment?.items_text])
    },
    (() => {
      const presentationNotes = presentationSectionById.get("notes");
      if (!presentationNotes) {
        return {
          id: "notes",
          title: "Notes",
          items: compact([notes?.text, metadata?.global_notes])
        };
      }

      return {
        ...presentationNotes,
        items: compact([...presentationNotes.items, metadata?.global_notes])
      };
    })()
  ];

  return sections.filter((section) => section.items.length > 0);
}

export function buildTerrainModeSections(sections: PublicSection[]) {
  return sections.filter((section) => ["access", "schedule", "mission", "contacts"].includes(section.id));
}

export function buildPublicBriefingHeader(
  briefing: Pick<Briefing, "title" | "event_date" | "location_text">
) {
  return {
    title: briefing.title,
    date: briefing.event_date
      ? new Date(`${briefing.event_date}T00:00:00`).toLocaleDateString("fr-BE", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "Date non définie",
    location: briefing.location_text ?? "Lieu non défini"
  };
}
