import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { createBriefingExportJob, downloadBriefingExport, getBriefingExportJob, startBriefingExportJob, toApiMessage } from "@/lib/api";

export default function BriefingExportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) {
        navigate("/briefings", { replace: true });
        return;
      }

      try {
        const created = await createBriefingExportJob(id);
        await startBriefingExportJob(id, created.export_id);

        let status = await getBriefingExportJob(id, created.export_id);
        while (!cancelled && status.status !== "ready") {
          if (status.status === "failed") {
            throw new Error(status.error_message ?? "La génération du PDF a échoué.");
          }
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
          status = await getBriefingExportJob(id, created.export_id);
        }

        if (cancelled) return;

        const { blob, filename } = await downloadBriefingExport(created.export_id);
        if (cancelled) return;
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename ?? "briefing.pdf";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        toast.success("PDF exporté");
      } catch (error) {
        if (!cancelled) toast.error(toApiMessage(error));
      } finally {
        if (!cancelled) navigate(`/briefings/${id}`, { replace: true });
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return (
    <div className="layout-main mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
      <Card className="card-pad max-w-lg text-center">
        <h1 className="text-xl font-semibold">Export PDF</h1>
        <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Création du snapshot, génération du PDF, puis téléchargement automatique dès qu'il est prêt.
        </p>
      </Card>
    </div>
  );
}
