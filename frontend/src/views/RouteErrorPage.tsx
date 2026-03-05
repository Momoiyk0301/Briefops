import { isRouteErrorResponse, useLocation, useNavigate, useRouteError } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();

  const message = (() => {
    if (isRouteErrorResponse(error)) {
      if (error.data && typeof error.data === "object" && "error" in error.data) {
        return String((error.data as { error?: string }).error ?? error.statusText);
      }
      return `${error.status} ${error.statusText}`;
    }
    if (error instanceof Error) return error.message;
    return "Une erreur inattendue est survenue.";
  })();

  return (
    <div className="layout-main mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center">
      <Card className="card-pad w-full space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-500">Erreur application</p>
          <h1 className="text-2xl font-bold">Impossible d'afficher cette page</h1>
          <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">{message}</p>
          <p className="text-xs text-[#8d93a8] dark:text-[#8f97b0]">Route: {location.pathname}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(-1)} variant="secondary">Retour</Button>
          <Button onClick={() => navigate("/briefings")}>Aller au dashboard</Button>
          <Button onClick={() => window.location.reload()} variant="ghost">Recharger</Button>
        </div>
      </Card>
    </div>
  );
}
