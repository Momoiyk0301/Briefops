import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, FileArchive2, Link2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { getBriefings, getStorageSignedUrl, listPublicLinks, toApiMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";

export default function DocumentsPage() {
  const { t } = useTranslation();
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
          !normalizedSearch
            ? true
            : [briefing.title, briefing.event_date ?? "", briefing.location_text ?? ""].join(" ").toLowerCase().includes(normalizedSearch)
        ),
    [briefingsQuery.data, normalizedSearch]
  );

  const filteredLinks = useMemo(
    () =>
      (linksQuery.data ?? []).filter((link) =>
        !normalizedSearch
          ? true
          : [link.briefing_title, link.status, link.url].join(" ").toLowerCase().includes(normalizedSearch)
      ),
    [linksQuery.data, normalizedSearch]
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
      toast.success(t("documents.copySuccess"));
    } catch {
      toast.error(t("documents.copyError"));
    }
  };

  return (
    <div className="stack-page">
      <Card className="page-hero card-pad">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">{t("documents.kicker")}</p>
            <h1 className="section-title mt-3">{t("documents.title")}</h1>
            <p className="section-copy mt-3">{t("documents.subtitle")}</p>
          </div>
          <div className="inline-flex rounded-full border border-[#e4e9f4] bg-white/80 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1f1f1f]">
            <Button variant={tab === "pdfs" ? "primary" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setTab("pdfs")}>{t("documents.pdfTab")}</Button>
            <Button variant={tab === "links" ? "primary" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setTab("links")}>{t("documents.linksTab")}</Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={tab === "pdfs" ? t("documents.pdfSearchPlaceholder") : t("documents.linkSearchPlaceholder")}
          className="w-full sm:w-[360px]"
        />
        <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
          {tab === "pdfs" ? t("documents.pdfCount", { count: pdfBriefings.length }) : t("documents.linkCount", { count: filteredLinks.length })}
        </p>
      </div>

      {tab === "pdfs" ? (
        <Card className="list-surface space-y-3 p-4">
          {briefingsQuery.isLoading ? <p className="text-sm text-slate-500">{t("documents.loadingPdfs")}</p> : null}
          {briefingsQuery.error ? <p className="text-sm text-red-600">{toApiMessage(briefingsQuery.error)}</p> : null}
          {!briefingsQuery.isLoading && pdfBriefings.length === 0 ? (
            <div className="empty-state">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-500/12 text-brand-600 dark:text-brand-300">
                  <FileArchive2 size={22} />
                </div>
                <p className="text-lg font-semibold">{t("documents.emptyPdfTitle")}</p>
                <p className="mt-2 text-sm text-slate-500">{t("documents.emptyPdfHint")}</p>
              </div>
            </div>
          ) : null}
          {pdfBriefings.map((briefing) => (
            <div key={briefing.id} className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 md:flex-row md:items-center md:justify-between dark:border-white/10">
              <div>
                <p className="font-medium">{briefing.title}</p>
                <p className="text-xs text-slate-500">{briefing.event_date ?? "—"} · {briefing.location_text ?? "—"}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => void openPdf(String(briefing.pdf_path))}
              >
                <ExternalLink size={14} />
                {t("documents.open")}
              </Button>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="list-surface space-y-3 p-4">
          {linksQuery.isLoading ? <p className="text-sm text-slate-500">{t("documents.loadingLinks")}</p> : null}
          {linksQuery.error ? <p className="text-sm text-red-600">{toApiMessage(linksQuery.error)}</p> : null}
          {!linksQuery.isLoading && filteredLinks.length === 0 ? (
            <div className="empty-state">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-500/12 text-brand-600 dark:text-brand-300">
                  <Link2 size={22} />
                </div>
                <p className="text-lg font-semibold">{t("documents.emptyLinkTitle")}</p>
                <p className="mt-2 text-sm text-slate-500">{t("documents.emptyLinkHint")}</p>
              </div>
            </div>
          ) : null}
          {filteredLinks.map((link) => (
            <div key={link.id} className="space-y-2 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 dark:border-white/10">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{link.briefing_title}</p>
                <p className="text-xs text-slate-500 capitalize">{link.status}</p>
              </div>
              <p className="text-xs text-slate-500">{link.expires_at ? new Date(link.expires_at).toLocaleString() : t("documents.noExpiry")}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void copy(link.url)}>
                  <Copy size={14} />
                  {t("documents.copy")}
                </Button>
                {link.status === "active" ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dce3f1] bg-white px-4 py-2 text-sm font-semibold text-[#172033] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-[#171717] dark:text-white dark:hover:bg-[#1f1f1f]"
                  >
                    <ExternalLink size={14} />
                    {t("documents.open")}
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
