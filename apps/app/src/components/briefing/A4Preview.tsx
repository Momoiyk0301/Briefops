import { moduleEntries } from "@/lib/moduleRegistry";
import { getEnabledPageCount } from "@/lib/briefingPages";
import { EditorState } from "@/lib/types";
import { MetadataPreview } from "@/components/briefing/preview/MetadataPreview";

export function A4Preview({ state }: { state: EditorState }) {
  const pageCount = getEnabledPageCount(state.modules);

  return (
    <div className="a4-frame space-y-4 overflow-auto rounded-xl border border-slate-300 bg-[#f8fafc] p-4 shadow-panel dark:border-slate-700 dark:bg-[#0f172a]">
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <section key={pageIndex} className="mx-auto w-full max-w-[820px] rounded-xl border border-slate-200 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
          <div className="relative mx-auto aspect-[210/297] w-full overflow-hidden rounded-lg border border-[#e8eaf3] bg-white dark:border-white/10 dark:bg-[#0f0f10]">
            {pageIndex === 0 ? (
              <section className="absolute inset-x-[4%] top-[3%] min-h-[18%] rounded-md border border-sky-200/90 bg-sky-50/80 p-3">
                <MetadataPreview
                  title={state.core.title}
                  eventDate={state.core.event_date}
                  location={state.core.location_text}
                  metadata={state.modules.metadata.data}
                />
              </section>
            ) : null}
            {moduleEntries
              .filter((entry) => entry.key !== "metadata" && state.modules[entry.key].enabled && state.modules[entry.key].layout.desktop.page === pageIndex)
              .map((entry) => {
                const Component = entry.PreviewComponent;
                const desktop = state.modules[entry.key].layout.desktop;
                return (
                  <section
                    key={entry.key}
                    className="absolute overflow-hidden rounded-md border border-[#dfe3ef] bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#151515]"
                    style={{
                      left: `${(desktop.x / 12) * 100}%`,
                      top: `${(desktop.y / 24) * 100}%`,
                      width: `${(desktop.w / 12) * 100}%`,
                      height: `${(desktop.h / 24) * 100}%`
                    }}
                  >
                    <Component value={state.modules[entry.key].data} />
                  </section>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
