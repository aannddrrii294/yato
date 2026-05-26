"use client";

import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Clock,
  Briefcase,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Shield,
  Laptop,
  MapPin,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const getFormattedDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latenessReason, setLatenessReason] = useState("");
  const [workNotes, setWorkNotes] = useState("");
  const [clientIp, setClientIp] = useState("192.168.201.18");
  const [showLatePrompt, setShowLatePrompt] = useState(false);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setClientIp(data.ip))
      .catch(() => {
        setClientIp("192.168.201.100");
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startRosterDate = getFormattedDate(new Date(new Date().setDate(new Date().getDate() - 15)));
  const endRosterDate = getFormattedDate(new Date(new Date().setDate(new Date().getDate() + 15)));

  const { data: roster = [], isLoading: rosterLoading } = useQuery({
    queryKey: ["hrm", "roster", startRosterDate, endRosterDate],
    queryFn: async () => {
      const res = await api.get(`/hrm/shifts/my-roster?start=${startRosterDate}&end=${endRosterDate}`);
      return res.data;
    },
  });

  const todayStr = getFormattedDate(new Date());
  const todayShift = roster.find((s: any) => getFormattedDate(new Date(s.date)) === todayStr);

  const { data: timesheets = [], isLoading: isTimesheetsLoading, refetch: refetchTimesheets } = useQuery({
    queryKey: ["hrm", "timesheets-today"],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const res = await api.get(`/hrm/timesheets/my?year=${year}&month=${month}`);
      return res.data;
    },
  });

  const todayTimesheet = timesheets.find(
    (t: any) => getFormattedDate(new Date(t.date)) === todayStr
  );

  useEffect(() => {
    if (todayShift?.shiftCategory) {
      const startTimeStr = todayShift.shiftCategory.startTime;
      const [h, m] = startTimeStr.split(":").map(Number);
      const shiftStart = new Date();
      shiftStart.setHours(h, m, 0, 0);
      if (currentTime.getTime() > shiftStart.getTime()) {
        setShowLatePrompt(true);
      } else {
        setShowLatePrompt(false);
      }
    }
  }, [todayShift, currentTime]);

  const clockInMutation = useMutation({
    mutationFn: async (payload: { latenessReason?: string }) => {
      const res = await api.post("/hrm/timesheets/clock-in", payload);
      return res.data;
    },
    onSuccess: () => {
      refetchTimesheets();
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (payload: { notes?: string }) => {
      const res = await api.post("/hrm/timesheets/clock-out", payload);
      return res.data;
    },
    onSuccess: () => {
      refetchTimesheets();
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
    },
  });

  const handleClockIn = () => {
    clockInMutation.mutate({
      latenessReason: showLatePrompt ? latenessReason : undefined,
    });
  };

  const handleClockOut = () => {
    clockOutMutation.mutate({
      notes: workNotes,
    });
    setWorkNotes("");
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px] text-slate-900">
      <MobileNav />
      <Sidebar />

      <main className="page-container flex-1">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <PageHeader 
              title="Attendance Control" 
              subtitle="Real-time terminal, geo-whitelisted log entries, and automated lateness reporting" 
            />
          </div>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 flex items-center gap-4 border border-slate-100/80 shadow-sm">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Whitelist</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{clientIp} (Logged)</div>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-4 border border-slate-100/80 shadow-sm">
            <div className="bg-amber-50 p-3 rounded-2xl">
              <Briefcase className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Assigned</div>
              <div className="text-sm font-bold text-slate-850 mt-0.5">
                {todayShift?.shiftCategory?.name || "No Scheduled Shift"}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-4 border border-slate-100/80 shadow-sm">
            <div className="bg-emerald-50 p-3 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Working Hours</div>
              <div className="text-sm font-bold text-slate-850 mt-0.5">
                {todayTimesheet ? `${todayTimesheet.totalHours} Hours Logged` : "0.0 Hours"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Terminal Clock Card */}
          <div className="bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between min-h-[380px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full filter blur-3xl" />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between z-10 relative">
                <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Live Terminal
                </span>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5 text-slate-450" />
                  <span>Office VPN / LAN</span>
                </div>
              </div>

              <div className="py-4 text-center z-10 relative">
                <div className="text-5xl font-extrabold tracking-widest text-slate-850 font-mono bg-slate-50 border border-slate-100 inline-block px-6 py-3.5 rounded-2xl">
                  {currentTime.toLocaleTimeString("en-GB", { hour12: false })}
                </div>
                <div className="text-xs font-bold text-slate-400 mt-3">
                  {currentTime.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100 relative z-10">
              {todayShift?.shiftCategory ? (
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Shift Hours</div>
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{todayShift.shiftCategory.name}</span>
                    <span className="text-blue-600 font-mono">
                      {todayShift.shiftCategory.startTime} - {todayShift.shiftCategory.endTime}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>No shift assigned for today. Clock-in unavailable.</span>
                </div>
              )}

              {todayShift?.shiftCategory && showLatePrompt && !todayTimesheet && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Lateness Reason (Required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Traffic jam or network issue..."
                    value={latenessReason}
                    onChange={(e) => setLatenessReason(e.target.value)}
                    className="input-field w-full text-xs py-2 bg-slate-50 border-slate-200"
                  />
                </div>
              )}

              {todayShift?.shiftCategory && (
                <div>
                  {!todayTimesheet ? (
                    <button
                      onClick={handleClockIn}
                      disabled={clockInMutation.isPending || (showLatePrompt && !latenessReason.trim())}
                      className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl active:scale-[0.98] shadow-md shadow-blue-500/10"
                    >
                      {clockInMutation.isPending ? "Clocking In..." : "🚀 CLOCK IN (PRESENT)"}
                    </button>
                  ) : !todayTimesheet.logs.find((l: any) => l.type === "CHECK_OUT") ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Add daily report summary (optional)..."
                        value={workNotes}
                        onChange={(e) => setWorkNotes(e.target.value)}
                        className="input-field w-full text-xs py-2.5 bg-slate-50 border-slate-200"
                      />
                      <button
                        onClick={handleClockOut}
                        disabled={clockOutMutation.isPending}
                        className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl active:scale-[0.98] shadow-md shadow-amber-500/10"
                      >
                        {clockOutMutation.isPending ? "Clocking Out..." : "🏁 CLOCK OUT"}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold p-4 rounded-2xl flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>Shift Completed for Today! ({todayTimesheet.totalHours} hrs worked)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Today's Log History */}
          <div className="bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm lg:col-span-2 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Laptop className="w-4.5 h-4.5 text-blue-600" />
                  <span>Today's Attendance Logs</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {todayTimesheet ? todayTimesheet.logs.length : 0} logs registered
                </span>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {todayTimesheet?.logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="bg-slate-50/50 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        log.type === "CHECK_IN" ? "bg-blue-500" : "bg-amber-500"
                      )} />
                      <div>
                        <div className="font-bold text-slate-800">{log.type}</div>
                        <div className="text-[10px] text-slate-400 font-medium">IP Address: {log.ipAddress}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-slate-700 font-bold">
                        {new Date(log.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold uppercase">{log.device?.includes("Mobi") ? "Mobile" : "Desktop"}</div>
                    </div>
                  </div>
                ))}

                {(!todayTimesheet || todayTimesheet.logs.length === 0) && (
                  <div className="py-16 text-center text-slate-400 font-medium text-xs">
                    No attendance check logs recorded for today yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl flex items-center gap-3 text-xs text-blue-800 mt-6">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <strong className="text-blue-900">Anti-Fraud Safeguard:</strong> All check-ins and check-outs are audited with precise location geolocation tags, user-agents, and registered office white-listed IP addresses.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
