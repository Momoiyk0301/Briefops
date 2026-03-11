import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, QrCode, Users, X } from "lucide-react";
import toast from "react-hot-toast";

import { createBriefingShareLink, listBriefingShareLinks, revokeBriefingShareLink, toApiMessage } from "@/lib/api";
import { PublicLink } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type ShareDuration = "24h" | "3d" | "1w" | "30d" | "never";

type Props = {
  open: boolean;
  briefingId: string;
  teams?: string[];
  selectedTeam?: string | null;
  desktopWidthRatio?: number;
  onClose: () => void;
  onExportPdf?: () => void;
};

export function SharePanel({
  open,
  briefingId,
  teams = [],
  selectedTeam = null,
  desktopWidthRatio = 0.32,
  onClose,
  onExportPdf
}: Props) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duration, setDuration] = useState<ShareDuration>("24h");
  const [audienceTag, setAudienceTag] = useState<string>("all");
  const [links, setLinks] = useState<PublicLink[]>([]);

  const activeLinks = useMemo(() => links.filter((link) => link.status === "active"), [links]);
  const resolvedRatio = Math.min(0.5, Math.max(0.26, desktopWidthRatio));

  useEffect(() => {
    setAudienceTag(selectedTeam ?? "all");
  }, [selectedTeam, open]);

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

  const handleCreate = async (type: "staff" | "audience") => {
    if (type === "audience" && audienceTag === "all") {
      toast.error("Choisis une audience");
      return;
    }

    setCreating(true);
    try {
      const created = await createBriefingShareLink(briefingId, {
        duration,
        type,
        tag: type === "audience" ? audienceTag : null
      });
      setLinks((prev) => [created, ...prev]);
      toast.success(type === "staff" ? "Lien staff créé" : "Lien audience créé");
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible");
    }
  };

  const handleRevoke = async (linkId: string) => {
    try {
      await revokeBriefingShareLink(briefingId, linkId);
      setLinks((prev) =>
        prev.map((item) => (item.id === linkId ? { ...item, revoked_at: new Date().toISOString(), status: "revoked" } : item))
      );
      toast.success("Lien révoqué");
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  };

  const formatLinkType = (link: PublicLink) => {
    if (link.link_type === "audience") return `Audience${link.audience_tag ? ` · ${link.audience_tag}` : ""}`;
    return "Staff";
  };

  const formatLinkStatus = (link: PublicLink) => {
    if (link.status === "revoked") return "Révoqué";
    if (link.status === "expired") return "Expiré";
    return "Actif";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}>
      <aside
        className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-auto rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-[#121212] md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:rounded-none md:rounded-l-2xl"
        style={{ width: `min(${Math.round(resolvedRatio * 100)}vw, 560px)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Partager le briefing</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Vue staff d’abord, export PDF en second.</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-[#1f1f1f]">
            <X size={16} />
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-[#171717]">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Durée du lien</p>
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#121212]"
            value={duration}
            onChange={(event) => setDuration(event.target.value as ShareDuration)}
          >
            <option value="24h">24 heures</option>
            <option value="3d">3 jours</option>
            <option value="1w">1 semaine</option>
            <option value="30d">30 jours</option>
            <option value="never">Sans expiration</option>
          </select>

          {teams.length > 0 ? (
            <>
              <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">Audience</p>
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#121212]"
                value={audienceTag}
                onChange={(event) => setAudienceTag(event.target.value)}
              >
                <option value="all">Choisir une audience</option>
                {teams.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          <div className="mt-4 grid gap-2">
            <Button className="w-full justify-start" onClick={() => void handleCreate("staff")} disabled={creating}>
              <Users size={16} />
              Générer un lien public
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => void handleCreate("audience")}
              disabled={creating || teams.length === 0}
            >
              <QrCode size={16} />
              Générer un lien audience
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={onExportPdf} disabled={!onExportPdf}>
              <Link2 size={16} />
              Exporter un PDF
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Liens actifs ({activeLinks.length})
          </p>
          {loading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
          {!loading && links.length === 0 ? <p className="text-sm text-slate-500">Aucun lien de partage actif.</p> : null}
          {links.map((link) => (
            <div key={link.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#171717]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{formatLinkType(link)}</span>
                <span className="text-xs text-slate-500">{formatLinkStatus(link)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {link.expires_at ? new Date(link.expires_at).toLocaleString() : "Sans expiration"}
              </p>
              <div className="mt-3 flex items-center gap-2">
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
                    Révoquer
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
