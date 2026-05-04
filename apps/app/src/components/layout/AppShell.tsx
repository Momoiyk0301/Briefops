import { Boxes, CircleUser, Files, FileText, HelpCircle, LogOut, Settings, Users } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";

import { Navbar } from "@/components/layout/Navbar";
import { signOut } from "@/lib/auth";
import { UserPlan } from "@/lib/types";

type Props = PropsWithChildren<{
  plan: UserPlan | null;
  demoData?: boolean;
}>;

type ItemProps = {
  to: string;
  title: string;
  icon: ReactNode;
  end?: boolean;
};

function SidebarItem({ to, title, icon, end = false }: ItemProps) {
  return (
    <NavLink
      to={to}
      title={title}
      end={end}
      className={({ isActive }) =>
        `group/item relative flex h-10 w-full items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-lg px-[13px] text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/40 ${
          isActive
            ? "bg-white/20 text-white"
            : "text-white/75 hover:bg-white/12 hover:text-white"
        }`
      }
    >
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="pointer-events-none max-w-0 overflow-hidden opacity-0 transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
        {title}
      </span>
    </NavLink>
  );
}

function SidebarButton({ title, icon, onClick }: { title: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="group/item relative flex h-10 w-full items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-lg px-[13px] text-sm text-white/75 outline-none transition-colors duration-150 hover:bg-white/12 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="pointer-events-none max-w-0 overflow-hidden opacity-0 transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
        {title}
      </span>
    </button>
  );
}

function SidebarLabel({ label }: { label: string }) {
  return (
    <div
      className="overflow-hidden whitespace-nowrap px-[18px] font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-white/40 opacity-0 transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/sidebar:opacity-100"
      style={{ height: 0, paddingTop: 0, paddingBottom: 0, transition: "opacity 220ms cubic-bezier(0.4,0,0.2,1), height 220ms cubic-bezier(0.4,0,0.2,1)" }}
    >
      {label}
    </div>
  );
}

export function AppShell({ plan, demoData = false, children }: Props) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="group/sidebar sticky top-0 z-50 hidden h-screen w-[56px] shrink-0 flex-col overflow-hidden bg-[oklch(49%_0.22_258)] transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:w-[220px] lg:flex"
        >
          {/* Logo */}
          <Link
            to="/briefings"
            title={t("shell.dashboardLink")}
            className="flex h-14 shrink-0 items-center gap-2.5 overflow-hidden whitespace-nowrap px-[13px] text-white"
            style={{ borderBottom: "1px solid oklch(55% 0.22 258 / 0.3)" }}
          >
            <span
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1.2" fill="white" />
                <rect x="9" y="2" width="5" height="5" rx="1.2" fill="white" opacity="0.7" />
                <rect x="2" y="9" width="5" height="5" rx="1.2" fill="white" opacity="0.7" />
                <rect x="9" y="9" width="5" height="5" rx="1.2" fill="white" opacity="0.4" />
              </svg>
            </span>
            <span
              className="pointer-events-none font-display text-sm font-bold tracking-[-0.025em] opacity-0 transition-opacity duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/sidebar:opacity-100"
            >
              BriefOps
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex flex-1 flex-col justify-between overflow-hidden py-2.5">
            <div className="space-y-0.5 px-1.5">
              <SidebarItem to="/briefings" title={t("nav.briefings")} icon={<FileText size={17} />} />
              <SidebarItem to="/documents" title={t("nav.documents")} icon={<Files size={17} />} />
              <SidebarItem to="/modules" title={t("nav.modules")} icon={<Boxes size={17} />} />
              <SidebarItem to="/staff" title={t("nav.staff")} icon={<Users size={17} />} />
              <SidebarItem to="/account" title={t("nav.account")} icon={<CircleUser size={17} />} />
            </div>

            <div className="space-y-0.5 px-1.5 pb-2">
              <SidebarItem to="/settings" title={t("nav.settings")} icon={<Settings size={17} />} end />
              <SidebarItem to="/help" title={t("nav.help")} icon={<HelpCircle size={17} />} end />
              <SidebarButton
                title={t("shell.logout")}
                icon={<LogOut size={17} />}
                onClick={() => void signOut()}
              />
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar plan={plan} demoData={demoData} />
          <main className="layout-main mx-auto w-full max-w-[1500px] pb-24 lg:pb-8">{children}</main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[20px] border border-[var(--border)] bg-[var(--bg-2)] p-2 shadow-[0_20px_60px_rgba(11,21,37,0.14)] lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {[
            { to: "/briefings", icon: <FileText size={16} />, label: t("nav.briefings") },
            { to: "/documents", icon: <Files size={16} />, label: t("nav.documents") },
            { to: "/staff", icon: <Users size={16} />, label: t("nav.staff") },
            { to: "/settings", icon: <Settings size={16} />, label: t("nav.settings") },
            { to: "/account", icon: <CircleUser size={16} />, label: t("nav.account") },
          ].map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-colors ${
                  isActive
                    ? "bg-[oklch(92%_0.08_258)] text-[oklch(49%_0.22_258)]"
                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
