import { ReactNode, useEffect, useMemo, useState } from "react";
import { Copy, Link2, MessageCircle, QrCode, Users, X } from "lucide-react";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";

import { createBriefingShareLink, listBriefingShareLinks, revokeBriefingShareLink, toApiMessage } from "@/lib/api";
import { PublicLink } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type ShareDuration = "24h" | "3d" | "1w" | "30d" | "never";

type Props = {
  open: boolean;
  briefingId: string;
  hasPdf?: boolean;
  teams?: string[];
  selectedTeam?: string | null;
  desktopWidthRatio?: number;
  onClose: () => void;
  onExportPdf?: (team: string | null) => void;
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

  const days = Math.round(hours / 24);
  return `Expire dans ${days}j`;
}

function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#171717]">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function SharePanel({
  open,
  briefingId,
  hasPdf: _hasPdf = false,
  teams = [],
  selectedTeam = null,
  desktopWidthRatio = 0.32,
  onClose,
  onExportPdf
}: Props) {
  const [loading, setLoading] = useState(false);
  const [creatingCrew, setCreatingCrew] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [duration, setDuration] = useState<ShareDuration>("24h");
  const [teamValue, setTeamValue] = useState<string>("all");
  const [pdfTeam, setPdfTeam] = useState<string>("all");
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [latestCrewLink, setLatestCrewLink] = useState<PublicLink | null>(null);
  const [latestTeamLink, setLatestTeamLink] = useState<PublicLink | null>(null);
  const [showCrewQr, setShowCrewQr] = useState(false);
  const [showTeamQr, setShowTeamQr] = useState(false);

  const activeLinks = useMemo(() => links.filter((link) => link.status === "active"), [links]);
  const resolvedRatio = Math.min(0.5, Math.max(0.26, desktopWidthRatio));

  useEffect(() => {
    setTeamValue(selectedTeam ?? "all");
    setPdfTeam(selectedTeam ?? "all");
  }, [selectedTeam, open]);

  const refreshLinks = async () => {
    setLoading(true);
    try {
      const resolvedLinks = await listBriefingShareLinks(briefingId);
      setLinks(resolvedLinks);

      const latestCrew = resolvedLinks.find((link) => link.link_type === "staff" && link.status === "active") ?? null;
      const latestTeam =
        resolvedLinks.find(
          (link) => link.link_type === "audience" && link.status === "active" && (selectedTeam ? link.team === selectedTeam : true)
        ) ?? null;

      setLatestCrewLink(latestCrew);
      setLatestTeamLink(latestTeam);
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

  const handleCreateCrew = async () => {
    setCreatingCrew(true);
    try {
      const created = await createBriefingShareLink(briefingId, duration, null);
      setLatestCrewLink(created);
      setLinks((prev) => [created, ...prev]);
      toast.success("Lien crew créé");
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setCreatingCrew(false);
    }
  };

  const handleCreateTeam = async () => {
    if (teamValue === "all") {
      toast.error("Choisis une team");
      return;
    }

    setCreatingTeam(true);
    try {
      const created = await createBriefingShareLink(briefingId, duration, teamValue);
      setLatestTeamLink(created);
      setLinks((prev) => [created, ...prev]);
      toast.success("Lien team créé");
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setCreatingTeam(false);
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
      toast.success("Lien désactivé");
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}>
      <aside
        className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-auto rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-[#121212] md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:rounded-none md:rounded-l-2xl"
        style={{ width: `min(${Math.round(resolvedRatio * 100)}vw, 640px)` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Partager le briefing</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Lien équipe, puis lien par groupe et export PDF.</p>
          </div>
          <button type="button" aria-label="Fermer" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-[#1f1f1f]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <SectionCard title="Lien équipe" description="Le lien principal optimisé mobile pour tout le staff.">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Durée du lien</p>
                <select
                  aria-label="crew-duration"
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
              </div>
              <Button className="w-full justify-start" onClick={() => void handleCreateCrew()} disabled={creatingCrew}>
                <Users size={16} />
                {creatingCrew ? "Génération..." : "Créer le lien équipe"}
              </Button>

              {latestCrewLink ? (
                <div className="rounded-xl border border-[#dce3f1] bg-white p-3 dark:border-white/10 dark:bg-[#121212]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lien généré</p>
                  <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-200">{latestCrewLink.url}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" className="h-9 px-3" onClick={() => void handleCopy(latestCrewLink.url)}>
                      <Copy size={14} />
                      Copier
                    </Button>
                    <Button variant="secondary" className="h-9 px-3" onClick={() => handleWhatsapp(latestCrewLink.url, "Lien équipe BriefOps")}>
                      <MessageCircle size={14} />
                      WhatsApp
                    </Button>
                    <Button variant="secondary" className="h-9 px-3" onClick={() => setShowCrewQr((value) => !value)}>
                      <QrCode size={14} />
                      {showCrewQr ? "Masquer QR" : "Afficher QR"}
                    </Button>
                  </div>
                  {showCrewQr ? (
                    <div className="mt-4 flex justify-center rounded-xl bg-white p-4" data-testid="crew-qr-code">
                      <QRCode value={latestCrewLink.url} size={168} />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </SectionCard>

          {teams.length > 0 ? (
            <SectionCard title="Lien par groupe" description="Génère un lien filtré pour un groupe spécifique.">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Groupe</p>
                  <select
                    aria-label="team-select"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#121212]"
                    value={teamValue}
                    onChange={(event) => setTeamValue(event.target.value)}
                  >
                    <option value="all">Choisir un groupe</option>
                    {teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                <Button variant="secondary" className="w-full justify-start" onClick={() => void handleCreateTeam()} disabled={creatingTeam}>
                  <QrCode size={16} />
                  {creatingTeam ? "Génération..." : "Créer le lien groupe"}
                </Button>

                {latestTeamLink ? (
                  <div className="rounded-xl border border-[#dce3f1] bg-white p-3 dark:border-white/10 dark:bg-[#121212]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lien groupe généré</p>
                    <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-200">{latestTeamLink.url}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="secondary" className="h-9 px-3" onClick={() => void handleCopy(latestTeamLink.url)}>
                        <Copy size={14} />
                        Copier
                      </Button>
                      <Button variant="secondary" className="h-9 px-3" onClick={() => handleWhatsapp(latestTeamLink.url, `Groupe ${latestTeamLink.team ?? "terrain"} — BriefOps`)}>
                        <MessageCircle size={14} />
                        WhatsApp
                      </Button>
                      <Button variant="secondary" className="h-9 px-3" onClick={() => setShowTeamQr((value) => !value)}>
                        <QrCode size={14} />
                        {showTeamQr ? "Masquer QR" : "Afficher QR"}
                      </Button>
                    </div>
                    {showTeamQr ? (
                      <div className="mt-4 flex justify-center rounded-xl bg-white p-4" data-testid="team-qr-code">
                        <QRCode value={latestTeamLink.url} size={168} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Export PDF" description="Exporte le briefing complet ou filtré par groupe.">
            <div className="space-y-3">
              {teams.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Groupe</p>
                  <select
                    aria-label="pdf-team-select"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#121212]"
                    value={pdfTeam}
                    onChange={(event) => setPdfTeam(event.target.value)}
                  >
                    <option value="all">Tous les groupes</option>
                    {teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <Button variant="secondary" className="w-full justify-start" onClick={() => onExportPdf?.(pdfTeam === "all" ? null : pdfTeam)} disabled={!onExportPdf}>
                <Link2 size={16} />
                Exporter le PDF
              </Button>
            </div>
          </SectionCard>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Liens actifs</p>
          {loading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
          {!loading && activeLinks.length === 0 ? <p className="text-sm text-slate-500">Aucun lien actif.</p> : null}

          {activeLinks.map((link) => (
            <div key={link.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#171717]">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {link.link_type === "staff" ? "Lien équipe" : `Groupe ${link.team ?? link.audience_tag ?? "terrain"}`}
              </p>
              <p className="mt-2 break-all text-sm text-slate-600 dark:text-slate-300">{link.url}</p>
              <p className="mt-2 text-xs text-slate-500">{formatExpiryLabel(link)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" className="h-9 px-3" onClick={() => void handleCopy(link.url)}>
                  Copier
                </Button>
                <Button variant="secondary" className="h-9 px-3" onClick={() => handleWhatsapp(link.url, link.link_type === "staff" ? "Lien équipe BriefOps" : `Groupe ${link.team ?? "terrain"} — BriefOps`)}>
                  WhatsApp
                </Button>
                <Button variant="secondary" className="h-9 px-3 text-red-600" onClick={() => void handleRevoke(link.id)}>
                  Désactiver
                </Button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
