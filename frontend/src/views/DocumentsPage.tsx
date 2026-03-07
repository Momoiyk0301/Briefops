import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

import { getBriefings, getStorageSignedUrl, listPublicLinks, toApiMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DocumentsPage() {
  const [tab, setTab] = useState<"pdfs" | "links">("pdfs");
  const briefingsQuery = useQuery({ queryKey: ["documents", "briefings"], queryFn: getBriefings });
  const linksQuery = useQuery({ queryKey: ["documents", "links"], queryFn: listPublicLinks });

  const pdfBriefings = useMemo(
    () => (briefingsQuery.data ?? []).filter((briefing) => Boolean(briefing.pdf_path)),
    [briefingsQuery.data]
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
      toast.success("Link copied");
    } catch {
      toast.error("Unable to copy");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="inline-flex rounded-full bg-[#eff0f8] p-1 dark:bg-[#1f1f1f]">
          <Button variant={tab === "pdfs" ? "primary" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setTab("pdfs")}>PDFs</Button>
          <Button variant={tab === "links" ? "primary" : "ghost"} className="px-3 py-1.5 text-xs" onClick={() => setTab("links")}>Links</Button>
        </div>
      </div>

      {tab === "pdfs" ? (
        <Card className="space-y-2 p-4">
          {briefingsQuery.isLoading ? <p className="text-sm text-slate-500">Loading PDFs...</p> : null}
          {briefingsQuery.error ? <p className="text-sm text-red-600">{toApiMessage(briefingsQuery.error)}</p> : null}
          {!briefingsQuery.isLoading && pdfBriefings.length === 0 ? <p className="text-sm text-slate-500">No generated PDF yet.</p> : null}
          {pdfBriefings.map((briefing) => (
            <div key={briefing.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <div>
                <p className="font-medium">{briefing.title}</p>
                <p className="text-xs text-slate-500">{briefing.event_date ?? "—"} · {briefing.location_text ?? "—"}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => void openPdf(String(briefing.pdf_path))}
              >
                <ExternalLink size={14} />
                Open
              </Button>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="space-y-2 p-4">
          {linksQuery.isLoading ? <p className="text-sm text-slate-500">Loading links...</p> : null}
          {linksQuery.error ? <p className="text-sm text-red-600">{toApiMessage(linksQuery.error)}</p> : null}
          {!linksQuery.isLoading && (linksQuery.data?.length ?? 0) === 0 ? <p className="text-sm text-slate-500">No share links yet.</p> : null}
          {(linksQuery.data ?? []).map((link) => (
            <div key={link.id} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <div className="flex items-center justify-between">
                <p className="font-medium">{link.briefing_title}</p>
                <p className="text-xs text-slate-500 capitalize">{link.status}</p>
              </div>
              <p className="text-xs text-slate-500">{link.expires_at ? new Date(link.expires_at).toLocaleString() : "No expiry"}</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => void copy(link.url)}>
                  <Copy size={14} />
                  Copy
                </Button>
                {link.status === "active" ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e7e8ef] px-4 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-[#1f1f1f]"
                  >
                    <ExternalLink size={14} />
                    Open
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

