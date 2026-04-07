import { TextAreaInput, TextInput } from "@/components/input/text";
import { TimeInput } from "@/components/input/time";
import { ModuleFieldDefinition } from "@/lib/types";
import { getVisibleFieldOptions } from "@/lib/moduleRuntime";

type Props = {
  field: ModuleFieldDefinition;
  value: Record<string, unknown>;
  settings: Record<string, unknown>;
  onChange: (nextValue: Record<string, unknown>) => void;
};

export function FieldRenderer({ field, value, settings, onChange }: Props) {
  const currentValue = String(value[field.key] ?? "");
  const setFieldValue = (nextFieldValue: string) => {
    onChange({
      ...value,
      [field.key]: nextFieldValue
    });
  };

  if (field.type === "textarea") {
    return (
      <TextAreaInput
        rows={2}
        placeholder={field.placeholder ?? field.label}
        value={currentValue}
        onChange={(event) => setFieldValue(event.target.value)}
      />
    );
  }

  if (field.type === "time") {
    return (
      <TimeInput
        placeholder={field.placeholder ?? field.label}
        value={currentValue}
        onChange={(event) => setFieldValue(event.target.value)}
      />
    );
  }

  if (field.type === "select") {
    const options = getVisibleFieldOptions(field, settings, value);
    return (
      <select
        aria-label={field.label}
        className="h-11 w-full rounded-[22px] border border-[#dce3f1] bg-white/96 px-4 text-sm text-[#172033] shadow-[0_10px_28px_rgba(15,23,42,0.05)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 dark:border-white/10 dark:bg-[#151515] dark:text-white"
        value={currentValue}
        onChange={(event) => setFieldValue(event.target.value)}
      >
        <option value="">{field.placeholder ?? field.label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <TextInput
      placeholder={field.placeholder ?? field.label}
      value={currentValue}
      onChange={(event) => setFieldValue(event.target.value)}
    />
  );
}
