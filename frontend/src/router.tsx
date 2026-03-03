import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth";
import { getMe } from "@/lib/api";
import BillingPage from "@/pages/BillingPage";
import BriefingDetailPage from "@/pages/BriefingDetailPage";
import BriefingsPage from "@/pages/BriefingsPage";
import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import SettingsPage from "@/pages/SettingsPage";
import StatusPage from "@/pages/StatusPage";

function RequireAuth() {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function ProtectedLayout() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (meQuery.isLoading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;

  return (
    <AppShell
      plan={meQuery.data?.plan ?? null}
      demoData={Boolean(meQuery.data?.degraded)}
      isAdmin={Boolean(meQuery.data?.is_admin)}
    >
      <Outlet />
    </AppShell>
  );
}

function RequireAdmin() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  if (meQuery.isLoading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  if (!meQuery.data?.is_admin) return <Navigate to="/briefings" replace />;
  return <Outlet />;
}

function LoginGate() {
  const { session, loading } = useAuth();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe, enabled: Boolean(session) });
  if (loading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  if (session && meQuery.isLoading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  if (session) return <Navigate to={meQuery.data?.org ? "/briefings" : "/onboarding"} replace />;
  return <LoginPage />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginGate />
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          { path: "/onboarding", element: <OnboardingPage /> },
          { path: "/briefings", element: <BriefingsPage /> },
          { path: "/briefings/:id", element: <BriefingDetailPage /> },
          { path: "/settings/billing", element: <BillingPage /> },
          { path: "/settings", element: <SettingsPage /> },
          {
            element: <RequireAdmin />,
            children: [{ path: "/status", element: <StatusPage /> }]
          },
          { path: "*", element: <Navigate to="/briefings" replace /> }
        ]
      }
    ]
  },
  { path: "*", element: <Navigate to="/login" replace /> }
]);
