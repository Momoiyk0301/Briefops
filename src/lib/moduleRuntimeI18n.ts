import { TFunction } from "i18next";

import { ModuleFieldDefinition, ModuleFieldOption, ModuleSettingDefinition } from "@/lib/types";

function translateDeliveryFieldLabel(key: string, t: TFunction) {
  switch (key) {
    case "time":
      return t("editor.delivery.fields.time.label");
    case "place":
      return t("editor.delivery.fields.place.label");
    case "contact":
      return t("editor.delivery.fields.contact.label");
    case "tag_mode":
      return t("editor.delivery.fields.tag.label");
    case "custom_tag":
      return t("editor.delivery.fields.customTag.label");
    case "notes":
      return t("editor.delivery.fields.notes.label");
    default:
      return null;
  }
}

function translateDeliveryFieldPlaceholder(key: string, t: TFunction) {
  switch (key) {
    case "time":
      return t("editor.delivery.fields.time.placeholder");
    case "place":
      return t("editor.delivery.fields.place.placeholder");
    case "contact":
      return t("editor.delivery.fields.contact.placeholder");
    case "tag_mode":
      return t("editor.delivery.fields.tag.placeholder");
    case "custom_tag":
      return t("editor.delivery.fields.customTag.placeholder");
    case "notes":
      return t("editor.delivery.fields.notes.placeholder");
    default:
      return null;
  }
}

function translateDeliveryOption(option: ModuleFieldOption, t: TFunction) {
  switch (option.value) {
    case "depot":
      return { ...option, label: t("editor.delivery.tags.depot") };
    case "retour":
      return { ...option, label: t("editor.delivery.tags.return") };
    case "custom":
      return { ...option, label: t("editor.delivery.tags.custom") };
    default:
      return option;
  }
}

export function translateModuleField(field: ModuleFieldDefinition, t: TFunction): ModuleFieldDefinition {
  const translatedLabel = translateDeliveryFieldLabel(field.key, t);
  const translatedPlaceholder = translateDeliveryFieldPlaceholder(field.key, t);

  return {
    ...field,
    label: translatedLabel ?? field.label,
    placeholder: translatedPlaceholder ?? field.placeholder ?? translatedLabel ?? field.label,
    options: field.options?.map((option) => translateDeliveryOption(option, t))
  };
}

export function translateModuleSetting(setting: ModuleSettingDefinition, t: TFunction): ModuleSettingDefinition {
  switch (setting.key) {
    case "enable_depot_tag":
      return {
        ...setting,
        label: t("editor.delivery.settings.enableDepotTag.label"),
        description: t("editor.delivery.settings.enableDepotTag.description")
      };
    case "enable_retour_tag":
      return {
        ...setting,
        label: t("editor.delivery.settings.enableReturnTag.label"),
        description: t("editor.delivery.settings.enableReturnTag.description")
      };
    case "allow_custom_tag":
      return {
        ...setting,
        label: t("editor.delivery.settings.allowCustomTag.label"),
        description: t("editor.delivery.settings.allowCustomTag.description")
      };
    default:
      return setting;
  }
}
