import { Navigate, Outlet, createBrowserRouter, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth";
import { getMe } from "@/lib/api";
import { getPostAuthRedirect } from "@/lib/authRedirect";
import AccountPage from "@/views/AccountPage";
import AuthConfirmedPage from "@/views/AuthConfirmedPage";
import BriefingDetailPage from "@/views/BriefingDetailPage";
import BriefingsPage from "@/views/BriefingsPage";
import CheckEmailPage from "@/views/CheckEmailPage";
import DocumentsPage from "@/views/DocumentsPage";
import LoginPage from "@/views/LoginPage";
import ModulesPage from "@/views/ModulesPage";
import NotificationsPage from "@/views/NotificationsPage";
import OnboardingPage from "@/views/OnboardingPage";
import RouteErrorPage from "@/views/RouteErrorPage";
import ResetPasswordPage from "@/views/ResetPasswordPage";
import SettingsPage from "@/views/SettingsPage";
import StaffPage from "@/views/StaffPage";
import StatusPage from "@/views/StatusPage";

function RequireAuth() {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function ProtectedLayout() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const location = useLocation();
  const hasMembership = Boolean(meQuery.data?.has_membership ?? meQuery.data?.workspace?.id ?? meQuery.data?.org?.id ?? meQuery.data?.role);

  if (meQuery.isLoading) return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  if (!hasMembership && location.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  if (location.pathname === "/onboarding") return <Outlet />;

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
  if (session && meQuery.data) return <Navigate to={getPostAuthRedirect(meQuery.data)} replace />;
  return <LoginPage />;
}

export const router = createBrowserRouter([
  {
    path: "/auth/confirmed",
    element: <AuthConfirmedPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/auth/check-email",
    element: <CheckEmailPage />,
    errorElement: <RouteErrorPage />
  },
  {
    path: "/auth/reset-password",
    element: <ResetPasswordPage />,
    errorElement: <RouteErrorPage />
  },
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
          { path: "/documents", element: <DocumentsPage /> },
          { path: "/modules", element: <ModulesPage /> },
          { path: "/account", element: <AccountPage /> },
          { path: "/abonnement", element: <Navigate to="/account" replace /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/staff", element: <StaffPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/settings/billing", element: <Navigate to="/account" replace /> },
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
