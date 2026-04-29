import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, MessageCircle, QrCode, Users, X } from "lucide-react";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";

import { createBriefingShareLink, listBriefingShareLinks, revokeBriefingShareLink, toApiMessage } from "@/lib/api";
import { PublicLink } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type ShareDuration = "24h" | "3d" | "1w" | "30d" | "never";

type Props = {
  open: boolean;
  briefingId: string;
  teams?: string[];
  onClose: () => void;
  onExportPdf?: () => void;
};

function buildWhatsappUrl(url: string, label: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${label}\n${url}`)}`;
}

function formatExpiryLabel(link: PublicLink) {
  if (!link.expires_at) return "Sans expiration";
  const ms = new Date(link.expires_at).getTime() - Date.now();
  if (ms <= 0) return "Expiré";
  const hours = Math.round(ms / (1000 * 60 * 60));
  if (hours < 48) return `Expire dans ${hours}h`;
  return `Expire dans ${Math.round(hours / 24)}j`;
}

export function SharePanel({ open, briefingId, teams = [], onClose, onExportPdf }: Props) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duration, setDuration] = useState<ShareDuration>("24h");
  const [teamValue, setTeamValue] = useState<string>("all");
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [latestLink, setLatestLink] = useState<PublicLink | null>(null);
  const [showQr, setShowQr] = useState(false);

  const activeLinks = useMemo(() => links.filter((link) => link.status === "active"), [links]);

  const refreshLinks = async () => {
    setLoading(true);
    try {
      const resolved = await listBriefingShareLinks(briefingId);
      setLinks(resolved);
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

  useEffect(() => {
    if (!open) setLatestLink(null);
  }, [open]);

  const handleCreate = async () => {
    if (teamValue !== "all" && !teams.includes(teamValue)) {
      toast.error("Groupe invalide");
      return;
    }
    setCreating(true);
    try {
      const created = await createBriefingShareLink(briefingId, duration, teamValue === "all" ? null : teamValue);
      setLatestLink(created);
      setLinks((prev) => [created, ...prev]);
      setShowQr(false);
      toast.success(teamValue === "all" ? "Lien équipe créé" : `Lien groupe « ${teamValue} » créé`);
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

  const handleWhatsapp = (url: string, label: string) => {
    window.open(buildWhatsappUrl(url, label), "_blank", "noopener,noreferrer");
  };

  const handleRevoke = async (linkId: string) => {
    try {
      await revokeBriefingShareLink(briefingId, linkId);
      setLinks((prev) =>
        prev.map((item) => (item.id === linkId ? { ...item, revoked_at: new Date().toISOString(), status: "revoked" } : item))
      );
      if (latestLink?.id === linkId) setLatestLink(null);
      toast.success("Lien désactivé");
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}>
      <aside
        className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-auto rounded-t-2xl bg-white shadow-2xl dark:bg-[#121212] md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-[640px] md:rounded-none md:rounded-l-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8edf5] px-5 py-4 dark:border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Partager le briefing</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Créez des liens et exportez en PDF.</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-[#1f1f1f]">
            <X size={16} />
          </button>
        </div>

        {/* 2-column body */}
        <div className="flex min-h-0 flex-col md:flex-row">
          {/* Left: 70% — create link + PDF */}
          <div className="flex-1 space-y-4 p-5">
            {/* Duration */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Durée du lien</p>
              <select
                aria-label="share-duration"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1a1a1a]"
                value={duration}
                onChange={(event) => setDuration(event.target.value as ShareDuration)}
              >
                <option value="24h">24 heures</option>
                <option value="3d">3 jours</option>
                <option value="1w">1 semaine</option>
                <option value="30d">30 jours</option>
                <option value="never">Sans expiration</option>
              </select>
            </div>

            {/* Group selector */}
            {teams.length > 0 ? (
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Groupe (optionnel)</p>
                <select
                  aria-label="team-select"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1a1a1a]"
                  value={teamValue}
                  onChange={(event) => setTeamValue(event.target.value)}
                >
                  <option value="all">Tous les groupes</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <Button className="w-full justify-start" onClick={() => void handleCreate()} disabled={creating}>
              <Users size={16} />
              {creating ? "Génération..." : teamValue === "all" ? "Créer le lien équipe" : `Créer le lien « ${teamValue} »`}
            </Button>

            {/* Latest link created */}
            {latestLink ? (
              <div className="rounded-xl border border-[#dce3f1] bg-white p-3 dark:border-white/10 dark:bg-[#1a1a1a]">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lien généré</p>
                <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-200">{latestLink.url}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" className="h-9 px-3" onClick={() => void handleCopy(latestLink.url)}>
                    <Copy size={14} />
                    Copier
                  </Button>
                  <Button variant="secondary" className="h-9 px-3" onClick={() => handleWhatsapp(latestLink.url, latestLink.link_type === "staff" ? "Lien équipe BriefOps" : `Groupe ${latestLink.team ?? "terrain"} — BriefOps`)}>
                    <MessageCircle size={14} />
                    WhatsApp
                  </Button>
                  <Button variant="secondary" className="h-9 px-3" onClick={() => setShowQr((v) => !v)}>
                    <QrCode size={14} />
                    {showQr ? "Masquer QR" : "QR Code"}
                  </Button>
                </div>
                {showQr ? (
                  <div data-testid="share-qr-code" className="mt-4 flex justify-center rounded-xl bg-white p-4">
                    <QRCode value={latestLink.url} size={160} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* PDF export */}
            <div className="border-t border-[#e8edf5] pt-4 dark:border-white/10">
              <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Export PDF</p>
              <Button variant="secondary" className="w-full justify-start" onClick={() => onExportPdf?.()} disabled={!onExportPdf}>
                Exporter le PDF
              </Button>
            </div>
          </div>

          {/* Right: 30% — active links */}
          <div className="border-t border-[#e8edf5] bg-slate-50/60 p-5 dark:border-white/10 dark:bg-[#161616] md:w-56 md:border-l md:border-t-0">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Liens actifs</p>
            {loading ? <p className="text-xs text-slate-500">Chargement...</p> : null}
            {!loading && activeLinks.length === 0 ? <p className="text-xs text-slate-500">Aucun lien actif.</p> : null}
            <div className="space-y-2">
              {activeLinks.map((link) => (
                <div key={link.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#1a1a1a]">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {link.link_type === "staff" ? "Équipe" : `Groupe — ${link.team ?? link.audience_tag ?? "terrain"}`}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatExpiryLabel(link)}</p>
                  {typeof link.views_count === "number" ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <Eye size={10} />
                      {link.views_count} vue{link.views_count !== 1 ? "s" : ""}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] hover:bg-slate-50 dark:border-white/10 dark:hover:bg-[#222]"
                      onClick={() => void handleCopy(link.url)}
                    >
                      Copier
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 dark:border-white/10 dark:hover:bg-red-900/20"
                      onClick={() => void handleRevoke(link.id)}
                    >
                      Désactiver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
