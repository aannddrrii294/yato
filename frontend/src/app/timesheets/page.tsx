"use client";

import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Clock,
  Calendar as CalendarIcon,
  Briefcase,
  Coffee,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  ArrowLeftRight,
  User,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Laptop,
  Check,
  X,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Normalizing date formats
const getFormattedDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export default function TimesheetsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"attendance" | "calendar" | "leaves" | "swaps">("attendance");

  // Local helper states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latenessReason, setLatenessReason] = useState("");
  const [workNotes, setWorkNotes] = useState("");
  const [clientIp, setClientIp] = useState("192.168.201.18"); // fallback simulation
  const [showLatePrompt, setShowLatePrompt] = useState(false);

  // Leave Request form state
  const [leaveForm, setLeaveForm] = useState({
    type: "ANNUAL_LEAVE",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Shift Swap form state
  const [swapForm, setSwapForm] = useState({
    targetUserId: "",
    requesterShiftId: "",
    targetShiftId: "",
  });

  // Calendar Navigation
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1); // 1-indexed

  // Fetch client IP for anti-fraud logging
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setClientIp(data.ip))
      .catch(() => {
        // Fallback for local networks
        setClientIp("192.168.201.100");
      });
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // =========================================================================
  // REACT QUERY FETCHERS
  // =========================================================================

  // 1. Fetch current user shift roster
  const startRosterDate = getFormattedDate(new Date(new Date().setDate(new Date().getDate() - 15)));
  const endRosterDate = getFormattedDate(new Date(new Date().setDate(new Date().getDate() + 15)));

  const { data: roster = [], isLoading: rosterLoading } = useQuery({
    queryKey: ["hrm", "roster", startRosterDate, endRosterDate],
    queryFn: async () => {
      const res = await api.get(`/hrm/shifts/my-roster?start=${startRosterDate}&end=${endRosterDate}`);
      return res.data;
    },
  });

  // Today's scheduled shift category
  const todayStr = getFormattedDate(new Date());
  const todayShift = roster.find((s: any) => getFormattedDate(new Date(s.date)) === todayStr);

  // 2. Fetch current user timesheets
  const { data: timesheets = [], refetch: refetchTimesheets } = useQuery({
    queryKey: ["hrm", "timesheets", calendarYear, calendarMonth],
    queryFn: async () => {
      const res = await api.get(`/hrm/timesheets/my?year=${calendarYear}&month=${calendarMonth}`);
      return res.data;
    },
  });

  const todayTimesheet = timesheets.find(
    (t: any) => getFormattedDate(new Date(t.date)) === todayStr
  );

  // Check if current time is past shift's start time for late prompts
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

  // 3. Fetch leave balance
  const { data: leaveBalance } = useQuery({
    queryKey: ["hrm", "leave-balance", calendarYear],
    queryFn: async () => {
      const res = await api.get(`/hrm/leaves/balance?year=${calendarYear}`);
      return res.data;
    },
  });

  // 4. Fetch leaves list
  const { data: leaves = [], refetch: refetchLeaves } = useQuery({
    queryKey: ["hrm", "leaves"],
    queryFn: async () => {
      const res = await api.get("/hrm/leaves/my");
      return res.data;
    },
  });

  // 5. Fetch pending leaves to approve
  const { data: pendingApprovals = [], refetch: refetchPendingApprovals } = useQuery({
    queryKey: ["hrm", "pending-approvals"],
    queryFn: async () => {
      const res = await api.get("/hrm/leaves/pending");
      return res.data;
    },
  });

  // 6. Fetch users list for swap options
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/user"); // Fallback to user fetcher
      return res.data;
    },
  });

  // =========================================================================
  // MUTATIONS (Clock In/Out, Leaves, Swaps)
  // =========================================================================

  const clockInMutation = useMutation({
    mutationFn: async (payload: { latenessReason?: string }) => {
      const res = await api.post("/hrm/timesheets/clock-in", payload);
      return res.data;
    },
    onSuccess: () => {
      refetchTimesheets();
      queryClient.invalidateQueries({ queryKey: ["hrm", "timesheets"] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (payload: { notes?: string }) => {
      const res = await api.post("/hrm/timesheets/clock-out", payload);
      return res.data;
    },
    onSuccess: () => {
      refetchTimesheets();
      queryClient.invalidateQueries({ queryKey: ["hrm", "timesheets"] });
    },
  });

  const leaveRequestMutation = useMutation({
    mutationFn: async (payload: typeof leaveForm) => {
      const res = await api.post("/hrm/leaves", payload);
      return res.data;
    },
    onSuccess: () => {
      refetchLeaves();
      queryClient.invalidateQueries({ queryKey: ["hrm", "leave-balance"] });
      setLeaveForm({ type: "ANNUAL_LEAVE", startDate: "", endDate: "", reason: "" });
    },
  });

  const leaveApprovalMutation = useMutation({
    mutationFn: async (payload: { approvalId: string; action: "APPROVED" | "REJECTED"; notes?: string }) => {
      const res = await api.post(`/hrm/leaves/action/${payload.approvalId}`, {
        action: payload.action,
        notes: payload.notes,
      });
      return res.data;
    },
    onSuccess: () => {
      refetchPendingApprovals();
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
    },
  });

  const swapRequestMutation = useMutation({
    mutationFn: async (payload: typeof swapForm) => {
      const res = await api.post("/hrm/shifts/swap", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
      setSwapForm({ targetUserId: "", requesterShiftId: "", targetShiftId: "" });
      alert("Shift swap request sent successfully!");
    },
  });

  // Handlers
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

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) return;
    leaveRequestMutation.mutate(leaveForm);
  };

  const handleApproveLeave = (approvalId: string) => {
    leaveApprovalMutation.mutate({ approvalId, action: "APPROVED" });
  };

  const handleRejectLeave = (approvalId: string) => {
    const notes = prompt("Enter required reason for rejection:");
    if (notes === null) return; // cancelled
    if (!notes.trim()) {
      alert("Rejection notes are required!");
      return;
    }
    leaveApprovalMutation.mutate({ approvalId, action: "REJECTED", notes });
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <PageHeader
            title="HR & Shift Attendance"
            description="Enterprise timesheets, attendance logs, and multi-level leave authorization workspace."
          />
          <MobileNav />
        </header>

        <main className="p-6 space-y-6 flex-1">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-500/30 transition-all">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Timezone</div>
                <div className="text-sm font-bold text-white">Etc/UTC (Greenwich)</div>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-all">
              <div className="bg-emerald-500/10 p-3 rounded-xl">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IP Whitelisting</div>
                <div className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{clientIp} (Logged)</div>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-all">
              <div className="bg-amber-500/10 p-3 rounded-xl">
                <Briefcase className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shift Today</div>
                <div className="text-sm font-bold text-white">
                  {todayShift?.shiftCategory?.name || "No Scheduled Shift"}
                </div>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-500/30 transition-all">
              <div className="bg-purple-500/10 p-3 rounded-xl">
                <Coffee className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Leave Balance</div>
                <div className="text-sm font-bold text-white">
                  {leaveBalance ? `${leaveBalance.remaining} / ${leaveBalance.allocated} Days` : "12 / 12 Days"}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-1.5 p-1 bg-slate-950/30 rounded-xl max-w-md">
            {[
              { id: "attendance", label: "⏱️ Attendance", icon: Clock },
              { id: "calendar", label: "📅 Calendar", icon: CalendarIcon },
              { id: "leaves", label: "🌴 Leave Hub", icon: Coffee },
              { id: "swaps", label: "🔄 Shift Trades", icon: ArrowLeftRight }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "bg-slate-800 text-white shadow-lg border border-slate-700/50"
                    : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                )}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Workspace Views */}
          <AnimatePresence mode="wait">
            {activeTab === "attendance" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Clock Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[360px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl group-hover:bg-blue-500/10 transition-all duration-700" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        Live Attendance Terminal
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>IP White-listed</span>
                      </div>
                    </div>

                    <div className="py-4 text-center">
                      <div className="text-5xl font-black tracking-widest text-white font-mono bg-slate-900/60 inline-block px-6 py-3.5 rounded-2xl border border-slate-800/80">
                        {currentTime.toLocaleTimeString("en-GB", { hour12: false })}
                      </div>
                      <div className="text-xs font-bold text-slate-500 mt-2">
                        {currentTime.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-800/60">
                    {/* Shift info details */}
                    {todayShift?.shiftCategory ? (
                      <div className="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Shift Hours</div>
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{todayShift.shiftCategory.name}</span>
                          <span className="text-blue-400 font-mono">
                            {todayShift.shiftCategory.startTime} - {todayShift.shiftCategory.endTime}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-500 font-semibold bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>No shift assigned for today. Clock-in unavailable.</span>
                      </div>
                    )}

                    {/* Lateness Reason Prompt */}
                    {todayShift?.shiftCategory && showLatePrompt && !todayTimesheet && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Lateness Reason (Required)</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Traffic jam or network issue..."
                          value={latenessReason}
                          onChange={(e) => setLatenessReason(e.target.value)}
                          className="input-field w-full bg-slate-900/60 text-xs py-2"
                        />
                      </div>
                    )}

                    {/* Action button */}
                    {todayShift?.shiftCategory && (
                      <div>
                        {!todayTimesheet ? (
                          <button
                            onClick={handleClockIn}
                            disabled={clockInMutation.isPending || (showLatePrompt && !latenessReason.trim())}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-[0.98]"
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
                              className="input-field w-full bg-slate-900/60 text-xs py-2"
                            />
                            <button
                              onClick={handleClockOut}
                              disabled={clockOutMutation.isPending}
                              className="w-full bg-amber-600 hover:bg-amber-500 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-amber-600/20 active:scale-[0.98]"
                            >
                              {clockOutMutation.isPending ? "Clocking Out..." : "🏁 CLOCK OUT"}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold p-4 rounded-2xl flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Shift Completed for Today! ({todayTimesheet.totalHours} hrs worked)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Log list for today */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <Laptop className="w-4.5 h-4.5 text-blue-500" />
                        <span>Today's Attendance Logs</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {todayTimesheet ? todayTimesheet.logs.length : 0} logs registered
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                      {todayTimesheet?.logs.map((log: any, idx: number) => (
                        <div
                          key={log.id}
                          className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-700/60 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              log.type === "CHECK_IN" ? "bg-blue-500" : "bg-amber-500"
                            )} />
                            <div>
                              <div className="font-bold text-white">{log.type}</div>
                              <div className="text-[10px] text-slate-500 font-medium">IP: {log.ipAddress}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-slate-300 font-bold">
                              {new Date(log.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="text-[9px] text-slate-500 font-semibold uppercase">{log.device?.includes("Mobi") ? "Mobile" : "Desktop"}</div>
                          </div>
                        </div>
                      ))}

                      {(!todayTimesheet || todayTimesheet.logs.length === 0) && (
                        <div className="py-12 text-center text-slate-500 font-medium text-xs">
                          No attendance check logs recorded for today yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3 text-xs text-slate-400 mt-4">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                    <div>
                      <strong className="text-slate-300">Anti-Fraud Safeguard:</strong> All check-ins and check-outs are audited with precise location geolocation tags, user-agents, and registered office white-listed IP addresses.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "calendar" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
              >
                {/* Calendar Header */}
                <div className="flex items-center justify-between">
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
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-white font-mono">
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
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> Present</span>
                    <span className="flex items-center gap-1.5 text-amber-500"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Late</span>
                    <span className="flex items-center gap-1.5 text-purple-400"><span className="w-2.5 h-2.5 bg-purple-500 rounded-full" /> On Leave</span>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2.5">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                    <div key={d} className="text-center text-[10px] font-black uppercase text-slate-500 tracking-widest py-1">{d}</div>
                  ))}

                  {/* Empty offsets */}
                  {Array.from({ length: new Date(calendarYear, calendarMonth - 1, 1).getDay() - 1 }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="bg-slate-900/10 border border-slate-900/20 rounded-xl min-h-[90px] opacity-20" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: new Date(calendarYear, calendarMonth, 0).getDate() }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateObj = new Date(calendarYear, calendarMonth - 1, dayNum);
                    const dateStr = getFormattedDate(dateObj);
                    const ts = timesheets.find((t: any) => getFormattedDate(new Date(t.date)) === dateStr);

                    return (
                      <div
                        key={`day-${dayNum}`}
                        className={cn(
                          "bg-slate-900/30 border border-slate-800/80 hover:border-slate-700/60 rounded-xl p-3 min-h-[95px] flex flex-col justify-between transition-all hover:bg-slate-900/60",
                          ts?.status === "PRESENT" && "border-l-4 border-l-blue-500 bg-blue-500/5",
                          ts?.status === "LATE" && "border-l-4 border-l-amber-500 bg-amber-500/5",
                          ts?.status === "ON_LEAVE" && "border-l-4 border-l-purple-500 bg-purple-500/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-400 font-mono">{dayNum}</span>
                          {ts?.status && (
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                              ts.status === "PRESENT" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                              ts.status === "LATE" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                              ts.status === "ON_LEAVE" && "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            )}>
                              {ts.status}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {ts?.totalHours > 0 && (
                            <div className="text-[10px] font-mono font-bold text-slate-300">
                              ⏱️ {ts.totalHours} hrs
                            </div>
                          )}
                          {ts?.notes && (
                            <div className="text-[9px] text-slate-500 font-medium truncate max-w-[90px]" title={ts.notes}>
                              {ts.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "leaves" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Leave Request Form */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-850 pb-3">
                    <Coffee className="w-4.5 h-4.5 text-blue-500" />
                    <span>Apply for Leave / Permission</span>
                  </div>

                  <form onSubmit={handleLeaveSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Leave Type</label>
                      <select
                        value={leaveForm.type}
                        onChange={(e) => setLeaveForm(prev => ({ ...prev, type: e.target.value }))}
                        className="input-field w-full bg-slate-900 text-xs py-2.5 cursor-pointer"
                      >
                        <option value="ANNUAL_LEAVE">Annual Leave (Cuti Tahunan)</option>
                        <option value="SICK_LEAVE">Sick Leave (Sakit dengan Surat)</option>
                        <option value="PERMIT">Permit (Izin Khusus)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Start Date</label>
                        <input
                          type="date"
                          required
                          value={leaveForm.startDate}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                          className="input-field w-full bg-slate-900 text-xs py-2"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">End Date</label>
                        <input
                          type="date"
                          required
                          value={leaveForm.endDate}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                          className="input-field w-full bg-slate-900 text-xs py-2"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Reason / Description</label>
                      <textarea
                        required
                        placeholder="State your reasons clearly..."
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="input-field w-full bg-slate-900 text-xs min-h-[90px] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={leaveRequestMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                    >
                      {leaveRequestMutation.isPending ? "Submitting..." : "Submit Leave Request"}
                    </button>
                  </form>
                </div>

                {/* Leaves History & Approvals */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Pending Approvals Inbox (Visible for SPV/Manager) */}
                  {pendingApprovals.length > 0 && (
                    <div className="bg-slate-950/40 border border-amber-500/20 bg-amber-500/[0.02] rounded-3xl p-6 shadow-2xl space-y-4">
                      <div className="text-sm font-black text-amber-500 flex items-center gap-2 border-b border-amber-500/10 pb-3">
                        <Shield className="w-4.5 h-4.5" />
                        <span>Approval Worklist Inbox ({pendingApprovals.length})</span>
                      </div>

                      <div className="space-y-3">
                        {pendingApprovals.map((req: any) => {
                          const activeStep = req.approvals.find((a: any) => a.status === "PENDING");
                          return (
                            <div
                              key={req.id}
                              className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-xs">{req.user.fullName}</span>
                                  <span className="bg-slate-800 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-lg">
                                    {req.type}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  📅 {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-slate-300 font-semibold italic">"{req.reason}"</div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApproveLeave(activeStep.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectLeave(activeStep.id)}
                                  className="bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Leaves History */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-850 pb-3">
                      <FileText className="w-4.5 h-4.5 text-blue-500" />
                      <span>Leave History & Approval Flow</span>
                    </div>

                    <div className="space-y-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                      {leaves.map((req: any) => (
                        <div
                          key={req.id}
                          className="bg-slate-900/40 border border-slate-800/80 p-4.5 rounded-2xl space-y-3 hover:border-slate-700/60 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{req.type}</span>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg",
                                req.status === "APPROVED" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                                req.status === "PENDING" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                req.status === "REJECTED" && "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              )}>
                                {req.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 font-medium">
                            📅 Date: <strong className="text-white">{new Date(req.startDate).toLocaleDateString()}</strong> to <strong className="text-white">{new Date(req.endDate).toLocaleDateString()}</strong>
                          </div>
                          <div className="text-xs text-slate-400 italic">Reason: "{req.reason}"</div>

                          {/* Approval Timeline Steps */}
                          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-850 text-[10px]">
                            {req.approvals.map((app: any) => (
                              <div key={app.id} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/80 space-y-1 relative">
                                <div className="font-black text-slate-400 uppercase tracking-widest">{app.roleName}</div>
                                <div className={cn(
                                  "font-bold flex items-center gap-1",
                                  app.status === "APPROVED" && "text-emerald-400",
                                  app.status === "PENDING" && "text-blue-400",
                                  app.status === "REJECTED" && "text-rose-400"
                                )}>
                                  {app.status === "APPROVED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {app.status === "REJECTED" && <XCircle className="w-3.5 h-3.5" />}
                                  {app.status === "PENDING" && <Clock className="w-3.5 h-3.5" />}
                                  <span>{app.status}</span>
                                </div>
                                {app.notes && (
                                  <div className="text-[9px] text-slate-500 italic mt-1 font-medium bg-slate-900/30 p-1.5 rounded">
                                    "{app.notes}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {leaves.length === 0 && (
                        <div className="py-12 text-center text-slate-500 font-medium text-xs">
                          No leave or permit requests submitted yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "swaps" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Request Shift Swap Form */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-850 pb-3">
                    <ArrowLeftRight className="w-4.5 h-4.5 text-blue-500" />
                    <span>Request Shift Trade / Swap</span>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!swapForm.targetUserId || !swapForm.requesterShiftId || !swapForm.targetShiftId) return;
                      swapRequestMutation.mutate(swapForm);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Colleague</label>
                      <select
                        value={swapForm.targetUserId}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, targetUserId: e.target.value }))}
                        className="input-field w-full bg-slate-900 text-xs py-2.5 cursor-pointer"
                      >
                        <option value="">Select a user...</option>
                        {users.map((u: any) => (
                          <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">My Shift (To Trade Out)</label>
                      <select
                        value={swapForm.requesterShiftId}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, requesterShiftId: e.target.value }))}
                        className="input-field w-full bg-slate-900 text-xs py-2.5 cursor-pointer"
                      >
                        <option value="">Select your shift...</option>
                        {roster.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            📅 {new Date(s.date).toLocaleDateString()} - {s.shiftCategory.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Target Shift (To Obtain)</label>
                      <input
                        type="text"
                        required
                        placeholder="Colleague's Shift ID (or enter shift Category / date details)..."
                        value={swapForm.targetShiftId}
                        onChange={(e) => setSwapForm(prev => ({ ...prev, targetShiftId: e.target.value }))}
                        className="input-field w-full bg-slate-900 text-xs py-2.5"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={swapRequestMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                    >
                      {swapRequestMutation.isPending ? "Sending Request..." : "Send Swap Proposal"}
                    </button>
                  </form>
                </div>

                {/* Info Card */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-850 pb-3">
                      <Shield className="w-4.5 h-4.5 text-blue-500" />
                      <span>Shift Trading & Swap Protocols</span>
                    </div>

                    <div className="space-y-3 text-xs text-slate-400">
                      <p>
                        Shift Swapping permits team members to exchange shifts while preserving service availability coverage, which is critical for **NOC Support Divisions**.
                      </p>
                      <div className="space-y-2 pt-2">
                        <div className="flex gap-2.5 items-start">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>The colleague must accept the trade request first.</span>
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Supervisor approval is auto-routed upon colleague acceptance.</span>
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Once approved, rosters are swapped instantly in the calendar database.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 p-4.5 rounded-2xl flex items-center gap-3 text-xs text-blue-400">
                    <MessageSquare className="w-5 h-5 shrink-0" />
                    <div>
                      Want to coordinate directly? Check the <strong>User Directory</strong> to message your teammates directly before sending swap proposals.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
