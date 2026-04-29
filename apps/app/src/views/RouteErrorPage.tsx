import { isRouteErrorResponse, useLocation, useNavigate, useRouteError } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();

  const message = (() => {
    if (isRouteErrorResponse(error)) {
      return t("errors.UNKNOWN_ERROR");
    }
    return t("routeError.fallback");
  })();

  return (
    <div className="layout-main mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center">
      <Card className="card-pad w-full space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-500">{t("routeError.eyebrow")}</p>
          <h1 className="text-2xl font-bold">{t("routeError.title")}</h1>
          <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">{message}</p>
          <p className="text-xs text-[#8d93a8] dark:text-[#8f97b0]">{t("routeError.route", { path: location.pathname })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(-1)} variant="secondary">{t("routeError.back")}</Button>
          <Button onClick={() => navigate("/briefings")}>{t("routeError.dashboard")}</Button>
          <Button onClick={() => window.location.reload()} variant="ghost">{t("routeError.reload")}</Button>
        </div>
      </Card>
    </div>
  );
}
