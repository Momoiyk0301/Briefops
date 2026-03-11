import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, FileArchive, FolderKanban, Link2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { getBriefings, getStorageSignedUrl, listPublicLinks, toApiMessage } from "@/lib/api";

export default function DocumentsPage() {
  const [tab, setTab] = useState<"pdfs" | "links">("pdfs");
  const [search, setSearch] = useState("");
  const briefingsQuery = useQuery({ queryKey: ["documents", "briefings"], queryFn: getBriefings });
  const linksQuery = useQuery({ queryKey: ["documents", "links"], queryFn: listPublicLinks });
  const normalizedSearch = search.trim().toLowerCase();

  const pdfBriefings = useMemo(
    () =>
      (briefingsQuery.data ?? [])
        .filter((briefing) => Boolean(briefing.pdf_path))
        .filter((briefing) =>
          [briefing.title, briefing.event_date ?? "", briefing.location_text ?? ""].join(" ").toLowerCase().includes(normalizedSearch)
        ),
    [briefingsQuery.data, normalizedSearch]
  );

  const filteredLinks = useMemo(
    () =>
      (linksQuery.data ?? []).filter((link) =>
        [link.briefing_title, link.status, link.url].join(" ").toLowerCase().includes(normalizedSearch)
      ),
    [linksQuery.data, normalizedSearch]
  );

  const stats = useMemo(
    () => ({
      pdfGenerated: pdfBriefings.length,
      downloads: 0,
      activeLinks: (linksQuery.data ?? []).filter((link) => link.status === "active").length
    }),
    [linksQuery.data, pdfBriefings.length]
  );

  const openPdf = async (path: string) => {
    try {
      const url = await getStorageSignedUrl("exports", path, 3600);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible");
    }
  };

  return (
    <div className="stack-page">
      <Card className="page-hero card-pad">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Exports & partage</p>
            <h1 className="section-title mt-2">Documents</h1>
            <p className="section-copy mt-2">Retrouve les PDF générés et les liens publics actifs sans passer par plusieurs écrans.</p>
          </div>
          <div className="inline-flex rounded-full border border-[#e4e9f4] bg-white/80 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1f1f1f]">
            <Button variant={tab === "pdfs" ? "primary" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setTab("pdfs")}>PDF</Button>
            <Button variant={tab === "links" ? "primary" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setTab("links")}>Liens</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "PDF générés", value: stats.pdfGenerated, icon: <FileArchive size={16} /> },
          { label: "Téléchargements", value: stats.downloads, icon: <FolderKanban size={16} /> },
          { label: "Liens actifs", value: stats.activeLinks, icon: <Link2 size={16} /> }
        ].map((item) => (
          <Card key={item.label} className="surface-pad">
            <div className="flex items-center justify-between text-[#6f748a] dark:text-[#a8afc6]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">{item.label}</p>
              {item.icon}
            </div>
            <p className="mt-3 text-3xl font-bold text-[#111827] dark:text-white">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={tab === "pdfs" ? "Rechercher un PDF" : "Rechercher un lien"}
          className="w-full sm:w-[360px]"
        />
        <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
          {tab === "pdfs" ? `${pdfBriefings.length} PDF` : `${filteredLinks.length} lien(s)`}
        </p>
      </div>

      {tab === "pdfs" ? (
        <Card className="list-surface p-4">
          {briefingsQuery.isLoading ? <p className="text-sm text-slate-500">Chargement des PDF...</p> : null}
          {briefingsQuery.error ? <p className="text-sm text-red-600">{toApiMessage(briefingsQuery.error)}</p> : null}
          {!briefingsQuery.isLoading && pdfBriefings.length === 0 ? (
            <EmptyState
              icon={<FileArchive size={22} />}
              title="Aucun PDF généré"
              description="Génère un PDF depuis un briefing pour le retrouver ici et le partager au terrain."
              ctaLabel="Créer un briefing"
              onCta={() => (window.location.href = "/briefings")}
            />
          ) : (
            <div className="space-y-3">
              {pdfBriefings.map((briefing) => (
                <div key={briefing.id} className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 md:flex-row md:items-center md:justify-between dark:border-white/10">
                  <div>
                    <p className="font-medium">{briefing.title}</p>
                    <p className="text-xs text-slate-500">{briefing.event_date ?? "Date non définie"} · {briefing.location_text ?? "Lieu non défini"}</p>
                  </div>
                  <Button variant="secondary" onClick={() => void openPdf(String(briefing.pdf_path))}>
                    <ExternalLink size={14} />
                    Ouvrir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="list-surface p-4">
          {linksQuery.isLoading ? <p className="text-sm text-slate-500">Chargement des liens...</p> : null}
          {linksQuery.error ? <p className="text-sm text-red-600">{toApiMessage(linksQuery.error)}</p> : null}
          {!linksQuery.isLoading && filteredLinks.length === 0 ? (
            <EmptyState
              icon={<Link2 size={22} />}
              title="Aucun lien actif"
              description="Partage un briefing staff ou audience pour retrouver ici les liens publics envoyés aux équipes."
              ctaLabel="Ouvrir les briefings"
              onCta={() => (window.location.href = "/briefings")}
            />
          ) : (
            <div className="space-y-3">
              {filteredLinks.map((link) => (
                <div key={link.id} className="space-y-2 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{link.briefing_title}</p>
                    <p className="text-xs capitalize text-slate-500">{link.status}</p>
                  </div>
                  <p className="text-xs text-slate-500">{link.expires_at ? new Date(link.expires_at).toLocaleString() : "Sans expiration"}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => void copy(link.url)}>
                      <Copy size={14} />
                      Copier
                    </Button>
                    {link.status === "active" ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dce3f1] bg-white px-4 py-2 text-sm font-semibold text-[#172033] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-[#171717] dark:text-white dark:hover:bg-[#1f1f1f]"
                      >
                        <ExternalLink size={14} />
                        Ouvrir
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
