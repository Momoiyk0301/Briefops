import { Bell, CreditCard, FileText, LayoutDashboard, LogOut, Server, Settings } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { Navbar } from "@/components/layout/Navbar";
import { signOut } from "@/lib/auth";
import { UserPlan } from "@/lib/types";

type Props = PropsWithChildren<{
  plan: UserPlan | null;
  demoData?: boolean;
  isAdmin: boolean;
}>;

type ItemProps = {
  to: string;
  title: string;
  icon: ReactNode;
};

function SidebarItem({ to, title, icon }: ItemProps) {
  return (
    <NavLink
      to={to}
      title={title}
      className={({ isActive }) =>
        `flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm transition-all duration-300 ${
          isActive
            ? "bg-white text-brand-500 shadow-panel"
            : "text-white/80 hover:bg-white/15 hover:text-white"
        }`
      }
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="pointer-events-none whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
        {title}
      </span>
    </NavLink>
  );
}

export function AppShell({ plan, demoData = false, isAdmin, children }: Props) {
  const iconButton =
    "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-white/80 transition-all duration-300 hover:bg-white/15 hover:text-white";

  return (
    <div className="min-h-screen bg-transparent text-[#111] dark:text-white">
      <div className="grid min-h-screen grid-cols-[64px_1fr]">
        <aside className="group/sidebar sticky top-0 z-30 flex h-screen w-16 flex-col overflow-hidden rounded-r-3xl bg-brand-500 px-2 py-4 transition-all duration-300 hover:w-56 dark:bg-[#1A1A1A]">
          <button type="button" aria-label="Notifications" className={`${iconButton} mb-4`}>
            <Bell size={18} />
            <span className="pointer-events-none whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              Notifications
            </span>
          </button>
          <nav className="flex flex-1 flex-col gap-3">
            <SidebarItem to="/briefings" title="Dashboard" icon={<LayoutDashboard size={18} />} />
            <SidebarItem to="/briefings" title="Briefings" icon={<FileText size={18} />} />
            <SidebarItem to="/settings/billing" title="Billing" icon={<CreditCard size={18} />} />
            <SidebarItem to="/settings" title="Settings" icon={<Settings size={18} />} />
            {isAdmin ? <SidebarItem to="/status" title="Status" icon={<Server size={18} />} /> : null}
          </nav>
          <button type="button" title="Logout" onClick={() => void signOut()} className={iconButton}>
            <LogOut size={18} />
            <span className="pointer-events-none whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100">
              Logout
            </span>
          </button>
        </aside>
        <div className="min-w-0">
          <Navbar plan={plan} demoData={demoData} isAdmin={isAdmin} />
          <main className="mx-auto max-w-[1500px] p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
