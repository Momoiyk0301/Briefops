import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";

const API_URL = import.meta.env.VITE_API_URL;

type BackendStatus = {
  service: string;
  status: string;
  timestamp: string;
};

export default function StatusPage() {
  const [backend, setBackend] = useState<BackendStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as BackendStatus;
        if (mounted) {
          setBackend(data);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      }
    };

    void run();
    const interval = window.setInterval(() => void run(), 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">System status</h1>

      <Card>
        <p className="text-sm text-slate-500">Frontend</p>
        <p className="mt-1 text-lg font-medium text-green-600">OK</p>
        <p className="text-xs text-slate-500">Running in browser</p>
      </Card>

      <Card>
        <p className="text-sm text-slate-500">Backend</p>
        {error ? (
          <>
            <p className="mt-1 text-lg font-medium text-red-600">DOWN</p>
            <p className="text-xs text-slate-500">{error}</p>
          </>
        ) : (
          <>
            <p className="mt-1 text-lg font-medium text-green-600">{backend?.status?.toUpperCase() ?? "CHECKING"}</p>
            <p className="text-xs text-slate-500">{backend?.service ?? "-"}</p>
            <p className="text-xs text-slate-500">{backend?.timestamp ?? "-"}</p>
          </>
        )}
      </Card>
    </div>
  );
}
