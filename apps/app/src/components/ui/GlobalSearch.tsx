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

  useEffect(() => { setActiveIdx(0); }, [results]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    function handleGlobal(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleGlobal);
    return () => document.removeEventListener("keydown", handleGlobal);
  }, []);

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
    <div ref={containerRef} className="relative hidden md:block">
      <div
        className="flex h-8 w-[220px] cursor-text items-center gap-[7px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 transition-[width,border-color] duration-200 focus-within:w-[280px] focus-within:border-[var(--border-2)]"
        onClick={() => inputRef.current?.focus()}
      >
        <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
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
          className="flex-1 border-none bg-transparent text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => { setQuery(""); setOpen(false); }}
            className="shrink-0 text-[var(--ink-4)] hover:text-[var(--ink)]"
          >
            <X size={11} />
          </button>
        ) : (
          <span className="shrink-0 rounded-[3px] bg-[var(--border)] px-[5px] py-[1px] font-mono text-[9px] text-[var(--ink-4)]">
            ⌘K
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-2)] shadow-[0_16px_48px_rgba(11,21,37,0.14)]"
        >
          {results.map((result, idx) => (
            <button
              key={`${result.type}-${result.id}`}
              role="option"
              aria-selected={idx === activeIdx}
              type="button"
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                idx === activeIdx ? "bg-[var(--bg)]" : "hover:bg-[var(--bg)]"
              }`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIdx(idx)}
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.1em] ${
                  result.type === "briefing"
                    ? "bg-[oklch(92%_0.08_258)] text-[oklch(44%_0.22_258)]"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {result.type === "briefing" ? "Briefing" : "Staff"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-[var(--ink)]">{result.label}</span>
                <span className="block truncate text-[11px] text-[var(--ink-3)]">{result.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] px-4 py-3 text-[13px] text-[var(--ink-3)] shadow-[0_16px_48px_rgba(11,21,37,0.14)]">
          Aucun résultat pour « {query} »
        </div>
      )}
    </div>
  );
}
