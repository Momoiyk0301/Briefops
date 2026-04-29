"use client";

import dynamic from "next/dynamic";

const FrontendApp = dynamic(() => import("@/App"), { ssr: false });

export default function ClientSpaPage() {
  return <FrontendApp />;
}
