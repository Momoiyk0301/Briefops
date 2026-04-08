import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, ExternalLink, FileArchive, FolderKanban, Link2 } from "lucide-react";
import toast from "react-hot-toast";

import { downloadBriefingExport, listBriefingExports, listPublicLinks, toApiMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { buildBriefingPdfFilename } from "@/lib/pdfFilename";

export default function DocumentsPage() {
  const [tab, setTab] = useState<"pdfs" | "links">("pdfs");
  const [search, setSearch] = useState("");
  const exportsQuery = useQuery({ queryKey: ["documents", "exports"], queryFn: listBriefingExports });
  const linksQuery = useQuery({ queryKey: ["documents", "links"], queryFn: listPublicLinks });
  const normalizedSearch = search.trim().toLowerCase();

  const pdfExports = useMemo(
    () =>
      (exportsQuery.data ?? []).filter((exportRow) =>
        !normalizedSearch
          ? true
          : [
              exportRow.briefing_title,
              `v${exportRow.version}`,
              exportRow.briefing_event_date ?? "",
              exportRow.briefing_location_text ?? ""
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch)
      ),
    [exportsQuery.data, normalizedSearch]
  );

  const filteredLinks = useMemo(
    () =>
      (linksQuery.data ?? []).filter((link) =>
        [link.briefing_title, link.status, link.url, link.link_type, link.team ?? "", link.audience_tag ?? ""].join(" ").toLowerCase().includes(normalizedSearch)
      ),
    [linksQuery.data, normalizedSearch]
  );

  const getLinkLabel = (link: { link_type: string; team?: string | null; audience_tag?: string | null }) => {
    if (link.link_type === "staff") return "Crew";
    return link.team ?? link.audience_tag ?? "Team";
  };

  const stats = useMemo(
    () => ({
      pdfGenerated: pdfExports.length,
      downloads: 0,
      activeLinks: (linksQuery.data ?? []).filter((link) => link.status === "active").length
    }),
    [linksQuery.data, pdfExports.length]
  );

  const handleDownload = async (
    exportId: string,
    fallback: { title: string; eventDate?: string | null; version: number }
  ) => {
    try {
      const { blob, filename } = await downloadBriefingExport(exportId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename ?? buildBriefingPdfFilename({
        title: fallback.title,
        eventDate: fallback.eventDate,
        version: fallback.version
      });
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lien copie");
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
            <p className="section-copy mt-2">
              Retrouve les PDF generes et les liens publics actifs sans passer par plusieurs ecrans.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-[#e4e9f4] bg-white/80 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1f1f1f]">
            <Button variant={tab === "pdfs" ? "primary" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setTab("pdfs")}>
              PDF
            </Button>
            <Button variant={tab === "links" ? "primary" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setTab("links")}>
              Liens
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "PDF generes", value: stats.pdfGenerated, icon: <FileArchive size={16} /> },
          { label: "Telechargements", value: stats.downloads, icon: <FolderKanban size={16} /> },
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
          {tab === "pdfs" ? `${pdfExports.length} PDF` : `${filteredLinks.length} lien(s)`}
        </p>
      </div>

      {tab === "pdfs" ? (
        <Card className="list-surface p-4">
          {exportsQuery.isLoading ? <p className="text-sm text-slate-500">Chargement des PDF...</p> : null}
          {exportsQuery.error ? <p className="text-sm text-red-600">{toApiMessage(exportsQuery.error)}</p> : null}
          {!exportsQuery.isLoading && pdfExports.length === 0 ? (
            <EmptyState
              icon={<FileArchive size={22} />}
              title="Aucun PDF genere"
              description="Genere un PDF depuis un briefing pour le retrouver ici et le telecharger plus tard."
              ctaLabel="Creer un briefing"
              onCta={() => (window.location.href = "/briefings")}
            />
          ) : (
            <div className="space-y-3">
              {pdfExports.map((exportRow) => (
                <div
                  key={exportRow.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 md:flex-row md:items-center md:justify-between dark:border-white/10"
                >
                  <div>
                    <p className="font-medium">{exportRow.briefing_title}</p>
                    <p className="text-xs text-slate-500">
                      {`v${exportRow.version}`} - {new Date(exportRow.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {exportRow.briefing_event_date ?? "-"} · {exportRow.briefing_location_text ?? "-"}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void handleDownload(exportRow.id, {
                        title: exportRow.briefing_title,
                        eventDate: exportRow.briefing_event_date,
                        version: exportRow.version
                      })
                    }
                  >
                    <Download size={14} />
                    Download PDF
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
              description="Partage un briefing staff ou team pour retrouver ici les liens publics envoyes aux equipes."
              ctaLabel="Ouvrir les briefings"
              onCta={() => (window.location.href = "/briefings")}
            />
          ) : (
            <div className="space-y-3">
              {filteredLinks.map((link) => (
                <div key={link.id} className="space-y-2 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{link.briefing_title}</p>
                      <p className="text-xs text-slate-500">{getLinkLabel(link)}</p>
                    </div>
                    <p className="text-xs capitalize text-slate-500">{link.status}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {link.expires_at ? new Date(link.expires_at).toLocaleString() : "Sans expiration"}
                  </p>
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
