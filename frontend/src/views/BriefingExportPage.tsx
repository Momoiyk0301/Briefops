import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { downloadPdf, toApiMessage } from "@/lib/api";

export default function BriefingExportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const team = searchParams.get("team");

    async function run() {
      if (!id) {
        navigate("/briefings", { replace: true });
        return;
      }

      try {
        const { blob, filename } = await downloadPdf(id, team);
        if (cancelled) return;
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename ?? `briefing${team ? `-${team}` : ""}.pdf`;
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
  }, [id, navigate, searchParams]);

  return (
    <div className="layout-main mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
      <Card className="card-pad max-w-lg text-center">
        <h1 className="text-xl font-semibold">Export PDF</h1>
        <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Génération du PDF puis téléchargement automatique dès qu'il est prêt.
        </p>
      </Card>
    </div>
  );
}
