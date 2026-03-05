import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth";
import { getMe } from "@/lib/api";
import AccountPage from "@/views/AccountPage";
import BillingPage from "@/views/BillingPage";
import BriefingDetailPage from "@/views/BriefingDetailPage";
import BriefingsPage from "@/views/BriefingsPage";
import LoginPage from "@/views/LoginPage";
import NotificationsPage from "@/views/NotificationsPage";
import OnboardingPage from "@/views/OnboardingPage";
import RouteErrorPage from "@/views/RouteErrorPage";
import SettingsPage from "@/views/SettingsPage";
import StaffPage from "@/views/StaffPage";
import StatusPage from "@/views/StatusPage";
import SubscriptionPage from "@/views/SubscriptionPage";

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
    element: <LoginGate />,
    errorElement: <RouteErrorPage />
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <ProtectedLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { path: "/onboarding", element: <OnboardingPage /> },
          { path: "/briefings", element: <BriefingsPage /> },
          { path: "/briefings/:id", element: <BriefingDetailPage /> },
          { path: "/account", element: <AccountPage /> },
          { path: "/abonnement", element: <SubscriptionPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/staff", element: <StaffPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/settings/billing", element: <BillingPage /> },
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
