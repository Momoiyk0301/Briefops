import { EquipmentData } from "@/lib/types";

export function EquipmentPreview({ value }: { value: EquipmentData }) {
  const items = value.items_text.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Equipment</h3>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {items.length === 0 ? <li>—</li> : items.map((item, idx) => <li key={idx}>{item}</li>)}
      </ul>
    </section>
  );
}
