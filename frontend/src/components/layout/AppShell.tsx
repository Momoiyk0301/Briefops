import { Bell, Boxes, CircleUser, Files, FileText, LogOut, Settings, Users } from "lucide-react";
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
        `relative flex h-11 w-full items-center rounded-2xl px-3 text-sm outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/40 ${
          isActive
            ? "bg-white text-brand-500 shadow-[0_14px_40px_rgba(15,23,42,0.18)]"
            : "text-white/80 hover:bg-white/12 hover:text-white"
        }`
      }
    >
      <span className="absolute left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center transition-all duration-300 group-hover/sidebar:left-4 group-hover/sidebar:translate-x-0">
        {icon}
      </span>
      <span className="pointer-events-none ml-8 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
        {title}
      </span>
    </NavLink>
  );
}

export function AppShell({ plan, demoData = false, children }: Props) {
  const iconButton =
    "relative flex h-11 w-full items-center rounded-2xl px-3 text-white/80 transition-all duration-300 hover:bg-white/12 hover:text-white";

  return (
    <div className="min-h-screen bg-transparent text-[#111] dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[64px_1fr]">
        <aside className="group/sidebar sticky top-0 z-30 hidden h-screen w-16 flex-col overflow-hidden rounded-r-[30px] bg-[linear-gradient(180deg,#112f61_0%,#1954c9_42%,#2f7cff_100%)] px-2 py-4 transition-all duration-300 hover:w-56 dark:bg-[#1A1A1A] lg:flex">
          <Link
            to="/briefings"
            title="Aller au dashboard"
            className="mb-4 flex h-11 w-full items-center justify-center rounded-2xl border border-white/35 bg-white/16 px-2 text-white shadow-[0_18px_40px_rgba(10,20,60,0.25)] backdrop-blur-xl transition-all duration-300 hover:bg-white/22 group-hover/sidebar:justify-start"
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
              <SidebarItem to="/documents" title="Documents" icon={<Files size={18} />} />
              <SidebarItem to="/modules" title="Modules" icon={<Boxes size={18} />} />
              <SidebarItem to="/staff" title="Staff" icon={<Users size={18} />} />
              <SidebarItem to="/account" title="Compte" icon={<CircleUser size={18} />} />
            </nav>
            <div className="space-y-2 pt-3">
              <NavLink
                to="/notifications"
                title="Notifications"
                className={({ isActive }) =>
                  `${iconButton} ${isActive ? "bg-white text-brand-500 shadow-panel" : ""}`
                }
              >
                <span className="absolute left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center transition-all duration-300 group-hover/sidebar:left-4 group-hover/sidebar:translate-x-0">
                  <Bell size={18} />
                </span>
                <span className="pointer-events-none ml-8 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
                  Notifications
                </span>
              </NavLink>
              <div className="border-t border-white/20 pt-2">
                <SidebarItem to="/settings" title="Settings" icon={<Settings size={18} />} end />
              </div>
              <button type="button" title="Logout" onClick={() => void signOut()} className={iconButton}>
                <span className="absolute left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center transition-all duration-300 group-hover/sidebar:left-4 group-hover/sidebar:translate-x-0">
                  <LogOut size={18} />
                </span>
                <span className="pointer-events-none ml-8 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:max-w-[140px] group-hover/sidebar:opacity-100">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </aside>
        <div className="min-w-0">
          <Navbar plan={plan} demoData={demoData} />
          <main className="layout-main mx-auto max-w-[1500px] pb-24 lg:pb-8">{children}</main>
        </div>
      </div>
      <nav className="fixed bottom-3 left-3 right-3 z-30 rounded-[28px] border border-[#e1e8f3] bg-white/94 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur dark:border-white/10 dark:bg-[#121212]/95 lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          <NavLink
            to="/briefings"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <FileText size={16} />
            Briefings
          </NavLink>
          <NavLink
            to="/modules"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <Boxes size={16} />
            Modules
          </NavLink>
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <Files size={16} />
            Documents
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
            to="/notifications"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <Bell size={16} />
            Notifications
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-300" : "text-[#6f748a] dark:text-[#a8afc6]"}`
            }
          >
            <Settings size={16} />
            Settings
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
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium text-[#6f748a] dark:text-[#a8afc6]"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </nav>
    </div>
  );
}
