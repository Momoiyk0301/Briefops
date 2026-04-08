import { DeliveryData } from "@/lib/types";
import { useTranslation } from "react-i18next";

export function DeliveryPreview({ value }: { value: DeliveryData }) {
  const { t } = useTranslation();

  return (
    <section className="mb-4">
      <h3 className="font-semibold">{t("editor.delivery.previewTitle")}</h3>
      <div className="mt-2 space-y-3 text-sm">
        {value.deliveries.length === 0 ? <p>{t("editor.delivery.empty")}</p> : value.deliveries.map((item, idx) => (
          <article
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-[#101010]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t("editor.delivery.pointLabel", { count: idx + 1 })}
                </p>
                <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 px-3 py-2 dark:border-brand-500/30 dark:bg-brand-500/10">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-200">
                    {t("editor.delivery.destinationLabel")}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#172033] dark:text-white">{item.place || "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:max-w-[45%] sm:justify-end">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {item.time || "—"}
                </span>
                {item.tag_mode ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    {item.tag_mode === "custom"
                      ? item.custom_tag || t("editor.delivery.tags.custom")
                      : item.tag_mode === "depot"
                        ? t("editor.delivery.tags.depot")
                        : t("editor.delivery.tags.return")}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("editor.delivery.fields.contact.label")}
                </p>
                <p className="mt-1 text-sm text-[#172033] dark:text-white">{item.contact || "—"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("editor.delivery.fields.notes.label")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[#172033] dark:text-white">{item.notes || "—"}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
