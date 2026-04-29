import { TextInput } from "@/components/input/text";
import { AccessData } from "@/lib/types";
import { useTranslation } from "react-i18next";

export function AccessForm({ value, onChange }: { value: AccessData; onChange: (value: AccessData) => void }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <TextInput placeholder={t("editor.modules.access.fields.address")} value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} />
      <TextInput placeholder={t("editor.modules.access.fields.parking")} value={value.parking} onChange={(e) => onChange({ ...value, parking: e.target.value })} />
      <TextInput placeholder={t("editor.modules.access.fields.entrance")} value={value.entrance} onChange={(e) => onChange({ ...value, entrance: e.target.value })} />
      <TextInput placeholder={t("editor.modules.access.fields.onSiteContact")} value={value.on_site_contact} onChange={(e) => onChange({ ...value, on_site_contact: e.target.value })} />
    </div>
  );
}
