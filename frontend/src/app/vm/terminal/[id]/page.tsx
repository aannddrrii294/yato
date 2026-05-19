"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const TerminalComponent = dynamic(
  () => import("./TerminalComponent"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }
);

export default function TerminalPage() {
  return <TerminalComponent />;
}
