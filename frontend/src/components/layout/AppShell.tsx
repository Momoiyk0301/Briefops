import { PropsWithChildren } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { UserPlan } from "@/lib/types";

type Props = PropsWithChildren<{
  plan: UserPlan | null;
}>;

export function AppShell({ plan, children }: Props) {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <Navbar plan={plan} />
      <main className="mx-auto max-w-[1400px] p-6">{children}</main>
    </div>
  );
}
