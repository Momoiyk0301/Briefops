import { Bell, CircleUser, CreditCard, FileText, Home, LogOut, Settings, Users } from "lucide-react";
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
      <div className="grid min-h-screen lg:grid-cols-[64px_1fr]">
        <aside className="group/sidebar sticky top-0 z-30 hidden h-screen w-16 flex-col overflow-hidden rounded-r-3xl bg-brand-500 px-2 py-4 transition-all duration-300 hover:w-56 dark:bg-[#1A1A1A] lg:flex">
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
          <main className="layout-main mx-auto max-w-[1500px] pb-24 lg:pb-8">{children}</main>
        </div>
      </div>
      <nav className="fixed bottom-3 left-3 right-3 z-30 rounded-2xl border border-[#e6e8f2] bg-white/95 p-2 shadow-panel backdrop-blur dark:border-white/10 dark:bg-[#121212]/95 lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          <NavLink
            to="/briefings"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <Home size={16} />
            Briefings
          </NavLink>
          <NavLink
            to="/staff"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <Users size={16} />
            Staff
          </NavLink>
          <NavLink
            to="/settings/billing"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <CreditCard size={16} />
            Offre
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <Bell size={16} />
            Alerts
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <CircleUser size={16} />
            Compte
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
