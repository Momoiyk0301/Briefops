import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

import { Navbar } from "@/components/layout/Navbar";
import { UserPlan } from "@/lib/types";

type Props = PropsWithChildren<{
  plan: UserPlan | null;
  demoData?: boolean;
}>;

export function AppShell({ plan, demoData = false, children }: Props) {
  return (
    <div className="min-h-full bg-[#f7f7f4] text-slate-900 dark:bg-slate-950">
      <div className="grid min-h-full grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900">
          <Link to="/briefings" className="mb-6 block text-xl font-semibold tracking-tight">
            BriefOPS
          </Link>
          <nav className="space-y-2 text-sm">
            <Link to="/briefings" className="block rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Briefings
            </Link>
            <Link to="/settings/billing" className="block rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
              Billing
            </Link>
          </nav>
        </aside>
        <div className="min-w-0">
          <Navbar plan={plan} demoData={demoData} />
          <main className="mx-auto max-w-[1400px] p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
