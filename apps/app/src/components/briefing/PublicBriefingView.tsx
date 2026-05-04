"use client";

import { useMemo, useState } from "react";

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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type ParsedContact = { name: string; role?: string; phone?: string; email?: string };

function parseContactItems(items: string[]): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  let current: ParsedContact | null = null;
  const phoneRx = /^\+[\d\s()-]+$/;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const item of items) {
    const t = item.trim();
    if (phoneRx.test(t)) {
      if (current) current.phone = t;
      else current = { name: t };
    } else if (emailRx.test(t)) {
      if (current) current.email = t;
    } else {
      if (current) contacts.push(current);
      const parts = t.split(" · ");
      if (parts.length >= 2 && phoneRx.test(parts[parts.length - 1])) {
        current = { name: parts[0], phone: parts[parts.length - 1] };
      } else if (parts.length >= 2) {
        current = { name: parts[0], role: parts.slice(1).join(" · ") };
      } else {
        current = { name: t };
      }
    }
  }

  if (current) contacts.push(current);
  return contacts;
}

type ParsedScheduleItem = { time?: string; desc: string };

function parseScheduleItems(items: string[]): ParsedScheduleItem[] {
  return items.map((item) => {
    const match = item.match(/^(\d{1,2}:\d{2})\s*·\s*(.+)$/);
    if (match) return { time: match[1], desc: match[2] };
    return { desc: item };
  });
}

const TERRAIN_IDS = new Set(["access", "schedule", "mission", "contacts"]);

function ChevronDown() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={14} height={14}>
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={14} height={14}>
      <path d="M3 2h3l1.5 3.5L6 7a9 9 0 004 4l1.5-1.5L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" />
    </svg>
  );
}

function ModuleCard({ section, collapsed, onToggle }: { section: PublicSection; collapsed: boolean; onToggle: () => void }) {
  let body: React.ReactNode;

  if (section.id === "contacts") {
    const contacts = parseContactItems(section.items);
    body = (
      <div className="module-card-body" style={{ padding: "0 16px" }}>
        {contacts.map((c, i) => (
          <div key={i} className="contact-card">
            <div className="contact-avatar">{getInitials(c.name)}</div>
            <div>
              <div className="contact-name">{c.name}</div>
              <div className="contact-role">
                {c.role ? (c.phone ? `${c.role} · ${c.phone}` : c.role) : (c.phone ?? "")}
              </div>
            </div>
            {c.phone && (
              <a className="contact-call" href={`tel:${c.phone.replace(/[\s()-]/g, "")}`} aria-label={`Appeler ${c.name}`}>
                <PhoneIcon />
              </a>
            )}
          </div>
        ))}
      </div>
    );
  } else if (section.id === "schedule") {
    const items = parseScheduleItems(section.items);
    body = (
      <div className="module-card-body" style={{ padding: "0 16px" }}>
        <div className="timeline-list">
          {items.map((item, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-time">{item.time ?? ""}</div>
              <div className="timeline-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    body = (
      <div className="module-card-body">
        {section.items.map((item, i) => (
          <div key={i} className="info-value">{item}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="module-card">
      <div className="module-card-header" onClick={onToggle}>
        <div className="module-card-title">
          <span className="module-card-title-dot" />
          {section.title}
        </div>
        <div className={`module-chevron${collapsed ? " closed" : ""}`}>
          <ChevronDown />
        </div>
      </div>
      {!collapsed && body}
    </div>
  );
}

export function PublicBriefingView({ title, date, location, sections, audienceLabel, updatedAt }: Props) {
  const [terrainMode, setTerrainMode] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const visibleSections = useMemo(
    () => (terrainMode ? sections.filter((s) => TERRAIN_IDS.has(s.id)) : sections),
    [sections, terrainMode]
  );

  const relativeTime = updatedAt ? formatRelativeTime(updatedAt) : null;

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // ignore — clipboard not available in all contexts
    }
  }

  return (
    <div className="brief-page">
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        <div className="brief-header">
          <div className="brief-header-top">
            {relativeTime && (
              <div className="brief-status">
                <span className="brief-status-dot" />
                {relativeTime}
              </div>
            )}
          </div>
          <div className="brief-title">{title}</div>
          <div className="brief-meta">
            <div className="brief-meta-row">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 1v4M11 1v4M2 7h12" />
              </svg>
              {date}
            </div>
            <div className="brief-meta-row">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" /><circle cx="8" cy="6" r="1.5" />
              </svg>
              {location}
            </div>
            {audienceLabel && (
              <div className="brief-meta-row">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="6" r="3" /><path d="M2 14c0-2.5 2.7-4 6-4s6 1.5 6 4" />
                </svg>
                Équipe : {audienceLabel}
              </div>
            )}
          </div>
        </div>

        <div className="segment-tabs">
          <button
            className={`seg-tab${!terrainMode ? " active" : " inactive"}`}
            onClick={() => setTerrainMode(false)}
          >
            Tous
          </button>
          <button
            className={`seg-tab${terrainMode ? " active" : " inactive"}`}
            onClick={() => setTerrainMode(true)}
          >
            Mode terrain
          </button>
        </div>

        <div className="brief-content">
          {visibleSections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-3)", fontSize: 14 }}>
              Aucune information disponible
            </div>
          ) : (
            visibleSections.map((section) => (
              <ModuleCard
                key={section.id}
                section={section}
                collapsed={collapsed.has(section.id)}
                onToggle={() => toggleCollapsed(section.id)}
              />
            ))
          )}
        </div>

        <div className="brief-actions">
          <button className="btn-download" onClick={() => window.print()}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width={16} height={16}>
              <path d="M8 2v8M4 7l4 4 4-4M2 13h12" />
            </svg>
            Télécharger le PDF
          </button>
          <button className="btn-share" onClick={handleShare}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={14} height={14}>
              <circle cx="4" cy="8" r="2" /><circle cx="12" cy="4" r="2" /><circle cx="12" cy="12" r="2" />
              <path d="M5.8 7.1L10 4.9M5.8 8.9L10 11.1" />
            </svg>
            Copier le lien
          </button>
        </div>

        {relativeTime && <p className="brief-footer-note">events-ops.com · {relativeTime}</p>}
      </div>
    </div>
  );
}
