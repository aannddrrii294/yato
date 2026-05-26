"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TimesheetsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/hrm/attendance");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest">Redirecting to Attendance Control...</p>
      </div>
    </div>
  );
}
