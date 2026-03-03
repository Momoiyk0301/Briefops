import { Bell, CreditCard, FileText, LayoutDashboard, LogOut, Server } from "lucide-react";
import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

import { Navbar } from "@/components/layout/Navbar";
import { signOut } from "@/lib/auth";
import { UserPlan } from "@/lib/types";

type Props = PropsWithChildren<{
  plan: UserPlan | null;
  demoData?: boolean;
}>;

export function AppShell({ plan, demoData = false, children }: Props) {
  const baseItem =
    "flex h-11 w-11 items-center justify-center rounded-2xl text-white/80 transition hover:bg-white/15 hover:text-white";
  const activeItem = "bg-white text-brand-500 shadow-panel";

  return (
    <div className="min-h-full bg-transparent text-[#111] dark:text-white">
      <div className="grid min-h-full grid-cols-[64px_1fr]">
        <aside className="flex flex-col items-center bg-brand-500 py-4 dark:bg-[#1A1A1A]">
          <button
            type="button"
            aria-label="Notifications"
            className={`${baseItem} mb-4`}
          >
            <Bell size={18} />
          </button>
          <nav className="flex flex-1 flex-col items-center gap-3">
            <NavLink
              to="/briefings"
              title="Briefings"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : ""}`}
            >
              <LayoutDashboard size={18} />
            </NavLink>
            <NavLink
              to="/briefings"
              title="Editor"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : ""}`}
            >
              <FileText size={18} />
            </NavLink>
            <NavLink
              to="/settings/billing"
              title="Billing"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : ""}`}
            >
              <CreditCard size={18} />
            </NavLink>
            <NavLink
              to="/status"
              title="Status"
              className={({ isActive }) => `${baseItem} ${isActive ? activeItem : ""}`}
            >
              <Server size={18} />
            </NavLink>
          </nav>
          <button
            type="button"
            title="Logout"
            onClick={() => void signOut()}
            className={baseItem}
          >
            <LogOut size={18} />
          </button>
        </aside>
        <div className="min-w-0">
          <Navbar plan={plan} demoData={demoData} />
          <main className="mx-auto max-w-[1500px] p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
