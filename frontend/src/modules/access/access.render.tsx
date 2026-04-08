import { AccessData } from "@/lib/types";

export function AccessModulePreview({ value }: { value: AccessData }) {
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Access</h3>
      <div className="mt-2 grid gap-2 text-sm">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Address</p>
          <p className="mt-1 text-[#172033] dark:text-white">{value.address || "—"}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#101010]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Entrance</p>
            <p className="mt-1 text-[#172033] dark:text-white">{value.entrance || "—"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#101010]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Parking</p>
            <p className="mt-1 text-[#172033] dark:text-white">{value.parking || "—"}</p>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#101010]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">On-site contact</p>
          <p className="mt-1 text-[#172033] dark:text-white">{value.on_site_contact || "—"}</p>
        </div>
      </div>
    </section>
  );
}

