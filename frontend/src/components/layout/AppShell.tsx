import { Bell, CircleUser, CreditCard, FileText, LogOut, Settings, Users } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";

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
        `flex h-11 w-full items-center justify-center gap-3 rounded-2xl px-3 text-sm outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/40 group-hover/sidebar:justify-start ${
          isActive
            ? "bg-white text-brand-500 shadow-panel"
            : "text-white/80 hover:bg-white/15 hover:text-white"
        }`
      }
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:ml-0.5 group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
        {title}
      </span>
    </NavLink>
  );
}

export function AppShell({ plan, demoData = false, children }: Props) {
  const iconButton =
    "flex h-11 w-full items-center justify-center gap-3 rounded-2xl px-3 text-white/80 transition-all duration-300 hover:bg-white/15 hover:text-white group-hover/sidebar:justify-start";

  return (
    <div className="min-h-screen bg-transparent text-[#111] dark:text-white">
      <div className="grid min-h-screen grid-cols-[64px_1fr]">
        <aside className="group/sidebar sticky top-0 z-30 flex h-screen w-16 flex-col overflow-hidden rounded-r-3xl bg-brand-500 px-2 py-4 transition-all duration-300 hover:w-56 dark:bg-[#1A1A1A]">
          <Link
            to="/briefings"
            title="Aller au dashboard"
            className="mb-4 flex h-11 w-full items-center justify-center rounded-2xl border border-white/40 bg-white/20 px-2 text-white shadow-[0_10px_30px_rgba(10,20,60,0.25)] backdrop-blur-xl transition-all duration-300 hover:bg-white/25 group-hover/sidebar:justify-start"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br from-[#2af598]/40 via-[#22d3ee]/30 to-[#7dd3fc]/35 text-sm font-bold">
              B
            </span>
            <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-200 group-hover/sidebar:ml-2 group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
              BriefOps
            </span>
          </Link>
          <div className="flex h-full flex-col justify-between">
            <nav className="space-y-3">
              <SidebarItem to="/briefings" title="Briefings" icon={<FileText size={18} />} />
              <SidebarItem to="/staff" title="Staff" icon={<Users size={18} />} />
              <SidebarItem to="/account" title="Compte" icon={<CircleUser size={18} />} />
              <SidebarItem to="/abonnement" title="Abonnement" icon={<CreditCard size={18} />} />
            </nav>
            <div className="space-y-2 pt-3">
              <div className="border-t border-white/20 pt-2">
                <SidebarItem to="/settings" title="Settings" icon={<Settings size={18} />} end />
              </div>
              <button type="button" title="Logout" onClick={() => void signOut()} className={iconButton}>
                <LogOut size={18} />
                <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:ml-0.5 group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
                  Logout
                </span>
              </button>
              <NavLink
                to="/notifications"
                title="Notifications"
                className={({ isActive }) =>
                  `${iconButton} ${isActive ? "bg-white text-brand-500 shadow-panel" : ""}`
                }
              >
                <Bell size={18} />
                <span className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:ml-0.5 group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
                  Notifications
                </span>
              </NavLink>
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <Navbar plan={plan} demoData={demoData} />
          <main className="mx-auto max-w-[1500px] p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
