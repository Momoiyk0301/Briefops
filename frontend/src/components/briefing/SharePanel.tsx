import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { createBriefingShareLink, listBriefingShareLinks, revokeBriefingShareLink, toApiMessage } from "@/lib/api";
import { PublicLink } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type ShareDuration = "24h" | "3d" | "1w" | "30d" | "never";

type Props = {
  open: boolean;
  briefingId: string;
  hasPdf: boolean;
  teams?: string[];
  selectedTeam?: string | null;
  desktopWidthRatio?: number;
  onClose: () => void;
};

export function SharePanel({ open, briefingId, hasPdf, teams = [], selectedTeam = null, desktopWidthRatio = 0.32, onClose }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duration, setDuration] = useState<ShareDuration>("24h");
  const [team, setTeam] = useState<string>("all");
  const [links, setLinks] = useState<PublicLink[]>([]);

  const activeLinks = useMemo(() => links.filter((link) => link.status === "active"), [links]);
  const resolvedRatio = Math.min(0.5, Math.max(0.26, desktopWidthRatio));
  const durationOptions: Array<{ value: ShareDuration; label: string }> = [
    { value: "24h", label: t("share.duration24h") },
    { value: "3d", label: t("share.duration3d") },
    { value: "1w", label: t("share.duration1w") },
    { value: "30d", label: t("share.duration30d") },
    { value: "never", label: t("share.durationNever") }
  ];

  useEffect(() => {
    setTeam(selectedTeam ?? "all");
  }, [selectedTeam, open]);

  const formatLinkStatus = (link: PublicLink) => {
    if (link.status === "revoked") return t("share.statusRevoked");
    if (link.status === "expired") return t("share.statusExpired");
    return t("share.statusActive");
  };

  const refreshLinks = async () => {
    setLoading(true);
    try {
      setLinks(await listBriefingShareLinks(briefingId));
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void refreshLinks();
  }, [open, briefingId]);

  const handleCreate = async () => {
    if (!hasPdf) {
      toast.error(t("share.generateFirst"));
      return;
    }

    setCreating(true);
    try {
      const created = await createBriefingShareLink(briefingId, duration, team === "all" ? null : team);
      setLinks((prev) => [created, ...prev]);
      toast.success(t("share.created"));
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("share.copySuccess"));
    } catch {
      toast.error(t("share.copyError"));
    }
  };

  const handleRevoke = async (linkId: string) => {
    try {
      await revokeBriefingShareLink(briefingId, linkId);
      setLinks((prev) =>
        prev.map((item) => (item.id === linkId ? { ...item, revoked_at: new Date().toISOString(), status: "revoked" } : item))
      );
      toast.success(t("share.revoked"));
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}>
      <aside
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-[#121212] md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:rounded-none md:rounded-l-2xl"
        style={{ width: `min(${Math.round(resolvedRatio * 100)}vw, 560px)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{t("share.title")}</h3>
          <button type="button" aria-label={t("share.close")} onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-[#1f1f1f]">
            <X size={16} />
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#171717]">
          <p className="text-xs font-medium text-slate-600">{t("share.duration")}</p>
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#121212]"
            value={duration}
            onChange={(event) => setDuration(event.target.value as ShareDuration)}
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {teams.length > 0 ? (
            <>
              <p className="mt-3 text-xs font-medium text-slate-600">{t("share.teamFilter")}</p>
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#121212]"
                value={team}
                onChange={(event) => setTeam(event.target.value)}
              >
                <option value="all">{t("share.allModules")}</option>
                {teams.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <Button className="mt-3 w-full" onClick={() => void handleCreate()} disabled={creating || !hasPdf}>
            {creating ? t("share.creating") : t("share.create")}
          </Button>
          {!hasPdf ? <p className="mt-2 text-xs text-slate-500">{t("share.variantHint")}</p> : null}
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("share.existingLinks", { count: activeLinks.length })}</p>
          {loading ? <p className="text-sm text-slate-500">{t("share.loading")}</p> : null}
          {!loading && links.length === 0 ? <p className="text-sm text-slate-500">{t("share.empty")}</p> : null}
          {links.map((link) => (
            <div key={link.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#171717]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{formatLinkStatus(link)}</span>
                <span className="text-xs text-slate-500">
                  {link.expires_at ? new Date(link.expires_at).toLocaleString() : t("share.noExpiry")}
                </span>
              </div>
              {link.team ? <p className="mt-1 text-xs text-slate-500">{t("share.team", { team: link.team })}</p> : null}
              <div className="mt-2 flex items-center gap-2">
                <Button variant="secondary" className="h-9 px-3" onClick={() => void handleCopy(link.url)}>
                  <Copy size={14} />
                </Button>
                <a
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 px-3 text-sm hover:bg-slate-100 dark:border-white/10 dark:hover:bg-[#1f1f1f]"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Link2 size={14} />
                </a>
                {link.status === "active" ? (
                  <Button variant="secondary" className="h-9 px-3 text-red-600" onClick={() => void handleRevoke(link.id)}>
                    {t("share.revoke")}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
