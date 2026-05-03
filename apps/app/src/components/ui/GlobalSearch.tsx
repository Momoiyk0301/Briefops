import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getBriefingsWithFallback, getStaff } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

type Result =
  | { type: "briefing"; id: string; label: string; sub: string }
  | { type: "staff"; id: string; label: string; sub: string };

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });
  const staffQuery = useQuery({ queryKey: queryKeys.staff, queryFn: getStaff });

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const briefings: Result[] = (briefingsQuery.data?.data ?? [])
      .filter((b) =>
        [b.title, b.location_text ?? "", b.event_date ?? ""].join(" ").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((b) => ({
        type: "briefing" as const,
        id: b.id,
        label: b.title,
        sub: [b.location_text, b.event_date].filter(Boolean).join(" · ") || "Briefing"
      }));

    const staff: Result[] = (staffQuery.data ?? [])
      .filter((s) =>
        [s.full_name, s.role, s.email ?? "", s.phone ?? ""].join(" ").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((s) => ({
        type: "staff" as const,
        id: s.id,
        label: s.full_name,
        sub: s.role
      }));

    return [...briefings, ...staff];
  }, [query, briefingsQuery.data, staffQuery.data]);

  useEffect(() => {
    setActiveIdx(0);
  }, [results]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function handleSelect(result: Result) {
    setQuery("");
    setOpen(false);
    if (result.type === "briefing") {
      navigate(`/briefings/${result.id}`);
    } else {
      navigate("/staff");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); if (results[activeIdx]) handleSelect(results[activeIdx]); }
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  return (
    <div ref={containerRef} className="relative hidden min-w-[280px] md:block">
      <label className="relative flex items-center">
        <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b93a7] dark:text-[#9ea6bc]" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-label={t("navbar.searchLabel")}
          placeholder={t("navbar.searchPlaceholder")}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-11 w-full rounded-full border border-[#e4e9f4] bg-white/88 pl-11 pr-10 text-sm text-[#172033] shadow-[0_10px_24px_rgba(15,23,42,0.06)] outline-none transition placeholder:text-[#8b93a7] focus:border-brand-500/40 dark:border-white/10 dark:bg-[#171717] dark:text-white dark:placeholder:text-[#8f98b0]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b93a7] hover:text-[#172033] dark:hover:text-white"
          >
            <X size={13} />
          </button>
        ) : null}
      </label>

      {open && results.length > 0 ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[22px] border border-[#e4e9f4] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#171717]"
        >
          {results.map((result, idx) => (
            <button
              key={`${result.type}-${result.id}`}
              role="option"
              aria-selected={idx === activeIdx}
              type="button"
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                idx === activeIdx
                  ? "bg-brand-50 dark:bg-brand-900/20"
                  : "hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIdx(idx)}
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  result.type === "briefing"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                }`}
              >
                {result.type === "briefing" ? "Briefing" : "Staff"}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-[#111827] dark:text-white">{result.label}</span>
                <span className="block truncate text-xs text-[#6f748a] dark:text-[#a8afc6]">{result.sub}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {open && query.trim() && results.length === 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-[22px] border border-[#e4e9f4] bg-white px-4 py-3 text-sm text-[#6f748a] shadow-[0_24px_60px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-[#171717] dark:text-[#a8afc6]">
          Aucun résultat pour « {query} »
        </div>
      ) : null}
    </div>
  );
}
