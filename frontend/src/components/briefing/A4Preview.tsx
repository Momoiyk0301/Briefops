import { moduleEntries } from "@/lib/moduleRegistry";
import { EditorState } from "@/lib/types";
import { MetadataPreview } from "@/components/briefing/preview/MetadataPreview";

export function A4Preview({ state }: { state: EditorState }) {
  return (
    <div className="a4-frame overflow-auto rounded-xl border border-slate-300 bg-white p-8 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <MetadataPreview
        title={state.core.title}
        eventDate={state.core.event_date}
        location={state.core.location_text}
        metadata={state.modules.metadata.data}
      />
      {moduleEntries
        .filter((entry) => entry.key !== "metadata" && state.modules[entry.key].enabled)
        .map((entry) => {
          const Component = entry.PreviewComponent;
          return <div key={entry.key}><Component value={state.modules[entry.key].data} /></div>;
        })}
    </div>
  );
}
