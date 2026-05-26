"use client";

import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Edit,
  Shield,
  Clock,
  Plus,
  Loader2,
  FileText,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AttendanceAdjustmentsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    timesheetId: "",
    changedFrom: "",
    changedTo: "",
    newTotalHours: "",
    newStatus: "PRESENT",
    reason: "",
  });

  const [selectedUserId, setSelectedUserId] = useState("");
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  // Fetch users for target
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });

  // Fetch selected user's timesheets
  const { data: userTimesheets = [], isLoading: isTimesheetsLoading } = useQuery({
    queryKey: ["hrm", "user-timesheets", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const res = await api.get(`/hrm/timesheets/my?year=${year}&month=${month}`); // Simulating timesheet fetch for that user
      return res.data;
    },
    enabled: !!selectedUserId,
  });

  // Fetch manual adjustment audit logs (simulating by querying timesheet history or custom logs)
  const { data: adjustments = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ["hrm", "adjustments-history"],
    queryFn: async () => {
      const res = await api.get(`/hrm/timesheets/my?year=${year}&month=${month}`);
      // Find all timesheets that have custom notes indicating adjustments
      return res.data
        .filter((t: any) => t.notes?.includes("Adjusted") || t.notes?.includes("Correction"))
        .map((t: any) => ({
          id: t.id,
          date: t.date,
          status: t.status,
          totalHours: t.totalHours,
          reason: t.notes,
        }));
    },
  });

  // Adjustment mutation
  const adjustMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await api.post("/hrm/timesheets/adjust", {
        timesheetId: payload.timesheetId,
        changedFrom: payload.changedFrom,
        changedTo: payload.changedTo,
        newTotalHours: Number(payload.newTotalHours),
        newStatus: payload.newStatus,
        reason: payload.reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
      setForm({
        timesheetId: "",
        changedFrom: "",
        changedTo: "",
        newTotalHours: "",
        newStatus: "PRESENT",
        reason: "",
      });
      alert("Attendance record adjusted successfully!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.timesheetId || !form.changedFrom || !form.changedTo || !form.newTotalHours || !form.reason.trim()) {
      alert("Please fill in all required correction fields.");
      return;
    }
    adjustMutation.mutate(form);
  };

  const handleSelectTimesheet = (id: string) => {
    const ts = userTimesheets.find((t: any) => t.id === id);
    if (ts) {
      setForm(prev => ({
        ...prev,
        timesheetId: id,
        changedFrom: ts.status,
        newTotalHours: String(ts.totalHours),
      }));
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px] text-slate-900">
      <MobileNav />
      <Sidebar />

      <main className="page-container flex-1">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <PageHeader 
              title="Attendance Corrections" 
              subtitle="Perform manual corrections on daily timesheets and verify compliance logs" 
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Correction Form */}
          <div className="bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Edit className="w-4.5 h-4.5 text-blue-600" />
              <span>Correct Attendance Log</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1. Pick Employee</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setForm(prev => ({ ...prev, timesheetId: "" }));
                  }}
                  className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
                >
                  <option value="">-- Choose Employee --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>

              {selectedUserId && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2. Select Target Date</label>
                  <select
                    value={form.timesheetId}
                    onChange={(e) => handleSelectTimesheet(e.target.value)}
                    className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
                  >
                    <option value="">-- Choose Present Day --</option>
                    {userTimesheets.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {new Date(t.date).toLocaleDateString()} - Current: ({t.status}, {t.totalHours} hrs)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.timesheetId && (
                <div className="space-y-4 border-t border-slate-100 pt-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Original Status</label>
                      <input
                        type="text"
                        required
                        readOnly
                        value={form.changedFrom}
                        className="input-field w-full text-xs py-2 bg-slate-100 border-slate-200 text-slate-550 font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Correction Target Status</label>
                      <select
                        value={form.newStatus}
                        onChange={(e) => setForm(prev => ({ ...prev, newStatus: e.target.value, changedTo: e.target.value }))}
                        className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200 font-bold text-slate-700"
                      >
                        <option value="PRESENT">PRESENT</option>
                        <option value="LATE">LATE</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                        <option value="ABSENT">ABSENT</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Corrected Total Hours</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 8.0"
                      step="0.1"
                      value={form.newTotalHours}
                      onChange={(e) => setForm(prev => ({ ...prev, newTotalHours: e.target.value }))}
                      className="input-field w-full text-xs py-2 bg-slate-50 border-slate-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Correction Audit Reason</label>
                    <textarea
                      required
                      placeholder="Write exact reason for manual database override..."
                      value={form.reason}
                      onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="input-field w-full text-xs min-h-[70px] resize-none bg-slate-50 border-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adjustMutation.isPending}
                    className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/10 active:scale-[0.98]"
                  >
                    {adjustMutation.isPending ? "Overriding Log..." : "Submit Correction Log"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Audit History Logs */}
          <div className="lg:col-span-2 bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-4">
            <div className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4.5 h-4.5 text-blue-600" />
              <span>Manual Adjustment Audit Logs</span>
            </div>

            {isLogsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {adjustments.map((log: any) => (
                  <div
                    key={log.id}
                    className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-2 hover:border-slate-200 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-100">
                        🔄 Manual Adjustment Override
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        📅 Date: {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-semibold mt-1">
                      Corrected status: <strong className="text-blue-600">{log.status}</strong>, Work hours: <strong className="text-blue-600">{log.totalHours} hrs</strong>
                    </div>

                    <div className="text-xs text-slate-500 italic bg-white border border-slate-100 rounded-xl p-2.5 mt-2">
                      Reason: "{log.reason || 'Manual override performed'}"
                    </div>
                  </div>
                ))}

                {adjustments.length === 0 && (
                  <div className="py-16 text-center text-slate-400 font-medium text-xs">
                    No manual corrections performed this month.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
