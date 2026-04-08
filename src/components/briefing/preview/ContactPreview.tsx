import { ContactData } from "@/lib/types";
import { useTranslation } from "react-i18next";

export function ContactPreview({ value }: { value: ContactData }) {
  const { t } = useTranslation();

  return (
    <section className="mb-4">
      <h3 className="font-semibold">{t("editor.modules.contact.title")}</h3>
      <ul className="mt-1 space-y-1 text-sm">
        {value.people.length === 0 ? <li>—</li> : value.people.map((person, idx) => (
          <li key={idx}>{person.name || "—"} · {person.role || "—"} · {person.phone || "—"} · {person.email || "—"}</li>
        ))}
      </ul>
    </section>
  );
}
