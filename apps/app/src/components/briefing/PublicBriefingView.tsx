"use client";

import { useMemo, useState } from "react";
import { MapPinned, ShieldCheck } from "lucide-react";

type PublicSection = {
  id: "access" | "schedule" | "mission" | "contacts" | "material" | "notes";
  title: string;
  items: string[];
};

type Props = {
  title: string;
  date: string;
  location: string;
  sections: PublicSection[];
  audienceLabel?: string | null;
  updatedAt?: string | null;
};

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Mis à jour à l'instant";
  if (minutes < 60) return `Mis à jour il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Mis à jour il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Mis à jour il y a ${days}j`;
}

export function PublicBriefingView({ title, date, location, sections, audienceLabel, updatedAt }: Props) {
  const [terrainMode, setTerrainMode] = useState(false);

  const visibleSections = useMemo(
    () => (terrainMode ? sections.filter((section) => ["access", "schedule", "mission", "contacts"].includes(section.id)) : sections),
    [sections, terrainMode]
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-[28px] border border-[#dfe6f2] bg-white/95 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f748a] dark:text-[#a8afc6]">
              BriefOps Terrain
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#111827] dark:text-white">{title}</h1>
            <div className="mt-3 space-y-1 text-sm text-[#52607a] dark:text-[#c7d2ea]">
              <p>{date}</p>
              <p>{location}</p>
              {audienceLabel ? <p>Groupe : {audienceLabel}</p> : null}
              {updatedAt ? (
                <p className="text-xs text-[#8f9bb3] dark:text-[#8090b0]">{formatRelativeTime(updatedAt)}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTerrainMode((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              terrainMode
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-200"
                : "border-[#dce3f1] bg-white text-[#172033] dark:border-white/10 dark:bg-[#171717] dark:text-white"
            }`}
          >
            <ShieldCheck size={16} />
            Mode terrain
          </button>
        </div>
      </div>

      {visibleSections.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-[#dfe6f2] bg-white/95 p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#111827]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-500/12 text-brand-600 dark:text-brand-300">
            <MapPinned size={22} />
          </div>
          <p className="text-lg font-semibold text-[#111827] dark:text-white">Aucune information terrain disponible</p>
          <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
            Ce briefing ne contient pas encore de contenu visible pour cette vue.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {visibleSections.map((section) => (
            <section
              key={section.id}
              className={`rounded-[28px] border border-[#dfe6f2] bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#111827] ${
                section.id === "notes" ? "md:col-span-2" : ""
              }`}
            >
              <h2 className="text-lg font-semibold text-[#111827] dark:text-white">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.items.map((item, index) => (
                  <div key={`${section.id}-${index}`} className="rounded-2xl bg-[#f6f8fc] px-4 py-3 text-sm text-[#24324d] dark:bg-[#1b2233] dark:text-[#dbe4f7]">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
