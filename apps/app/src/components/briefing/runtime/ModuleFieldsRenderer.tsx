import { Button } from "@/components/ui/Button";
import { FieldRenderer } from "@/components/briefing/runtime/FieldRenderer";
import { createEmptyFieldValues, isFieldVisible } from "@/lib/moduleRuntime";
import { ModuleFieldDefinition } from "@/lib/types";

type Props = {
  title: string;
  fields: ModuleFieldDefinition[];
  items: Record<string, unknown>[];
  settings: Record<string, unknown>;
  onChange: (nextItems: Record<string, unknown>[]) => void;
};

export function ModuleFieldsRenderer({ title, fields, items, settings, onChange }: Props) {
  const addItem = () => {
    onChange([...items, createEmptyFieldValues(fields)]);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded border border-slate-200 p-2 dark:border-slate-700">
          {fields
            .filter((field) => isFieldVisible(field, settings, item))
            .map((field) => (
              <FieldRenderer
                key={`${index}-${field.key}`}
                field={field}
                value={item}
                settings={settings}
                onChange={(nextValue) => {
                  const nextItems = [...items];
                  nextItems[index] = nextValue;
                  onChange(nextItems);
                }}
              />
            ))}
        </div>
      ))}
      <Button variant="secondary" onClick={addItem}>
        {title}
      </Button>
    </div>
  );
}
