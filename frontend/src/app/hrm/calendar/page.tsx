"use client";

import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const getFormattedDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export default function CalendarPage() {
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1); // 1-indexed

  // Fetch timesheets
  const { data: timesheets = [], isLoading: isTimesheetsLoading } = useQuery({
    queryKey: ["hrm", "timesheets", calendarYear, calendarMonth],
    queryFn: async () => {
      const res = await api.get(`/hrm/timesheets/my?year=${calendarYear}&month=${calendarMonth}`);
      return res.data;
    },
  });

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px] text-slate-900">
      <MobileNav />
      <Sidebar />

      <main className="page-container flex-1">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <PageHeader 
              title="Calendar Timesheets" 
              subtitle="Monthly timesheet grid overview, work hour metrics, and detailed attendance records" 
            />
          </div>
        </header>

        <div className="bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-6">
          {/* Calendar Header / Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (calendarMonth === 1) {
                    setCalendarMonth(12);
                    setCalendarYear(y => y - 1);
                  } else {
                    setCalendarMonth(m => m - 1);
                  }
                }}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 p-2 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-base font-extrabold text-slate-800 font-sans tracking-tight min-w-[140px] text-center">
                {new Date(calendarYear, calendarMonth - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </span>
              
              <button
                onClick={() => {
                  if (calendarMonth === 12) {
                    setCalendarMonth(1);
                    setCalendarYear(y => y + 1);
                  } else {
                    setCalendarMonth(m => m + 1);
                  }
                }}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 p-2 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-bold">
              <span className="flex items-center gap-2 text-blue-600">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> 
                Present
              </span>
              <span className="flex items-center gap-2 text-amber-600">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> 
                Late
              </span>
              <span className="flex items-center gap-2 text-purple-600">
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full" /> 
                On Leave
              </span>
            </div>
          </div>

          {isTimesheetsLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading Calendar...</p>
            </div>
          ) : (
            /* Calendar Grid */
            <div className="grid grid-cols-7 gap-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="text-center text-[10px] font-bold uppercase text-slate-400 tracking-wider py-1">
                  {d}
                </div>
              ))}

              {/* Empty offsets */}
              {Array.from({ length: new Date(calendarYear, calendarMonth - 1, 1).getDay() - 1 }).map((_, idx) => (
                <div key={`offset-${idx}`} className="bg-slate-50/20 border border-slate-100 rounded-2xl min-h-[95px] opacity-30" />
              ))}

              {/* Month days */}
              {Array.from({ length: new Date(calendarYear, calendarMonth, 0).getDate() }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateObj = new Date(calendarYear, calendarMonth - 1, dayNum);
                const dateStr = getFormattedDate(dateObj);
                const ts = timesheets.find((t: any) => getFormattedDate(new Date(t.date)) === dateStr);

                return (
                  <motion.div
                    key={`day-${dayNum}`}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "bg-white border border-slate-100 rounded-2xl p-4 min-h-[105px] flex flex-col justify-between transition-all hover:bg-slate-50/50 hover:border-slate-200 shadow-sm",
                      ts?.status === "PRESENT" && "border-l-4 border-l-blue-500 bg-blue-50/10",
                      ts?.status === "LATE" && "border-l-4 border-l-amber-500 bg-amber-50/10",
                      ts?.status === "ON_LEAVE" && "border-l-4 border-l-purple-500 bg-purple-50/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 font-mono">{dayNum}</span>
                      {ts?.status && (
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                          ts.status === "PRESENT" && "bg-blue-50 text-blue-600 border border-blue-100",
                          ts.status === "LATE" && "bg-amber-50 text-amber-600 border border-amber-100",
                          ts.status === "ON_LEAVE" && "bg-purple-50 text-purple-600 border border-purple-100"
                        )}>
                          {ts.status}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-3">
                      {ts?.totalHours > 0 && (
                        <div className="text-[11px] font-mono font-bold text-slate-700">
                          ⏱️ {ts.totalHours} hrs
                        </div>
                      )}
                      {ts?.notes && (
                        <div className="text-[9px] text-slate-400 font-medium truncate max-w-[110px]" title={ts.notes}>
                          {ts.notes}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
