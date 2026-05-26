"use client";

import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Coins,
  Shield,
  Clock,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OvertimeHubPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    timesheetId: "",
    hoursClaimed: "",
    reason: "",
  });

  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  // Fetch my timesheets (to choose timesheetId to claim overtime on)
  const { data: timesheets = [] } = useQuery({
    queryKey: ["hrm", "timesheets-overtime"],
    queryFn: async () => {
      const res = await api.get(`/hrm/timesheets/my?year=${year}&month=${month}`);
      return res.data;
    },
  });

  // Fetch all overtime claims (to show logs)
  const { data: overtimes = [], isLoading: isClaimsLoading } = useQuery({
    queryKey: ["hrm", "overtimes"],
    queryFn: async () => {
      const res = await api.get(`/hrm/timesheets/my?year=${year}&month=${month}`);
      // Overtime requests are mapped on my daily timesheets
      const list = res.data.flatMap((t: any) => 
        t.overtimes?.map((o: any) => ({ ...o, date: t.date, totalHoursWorked: t.totalHours, timesheetId: t.id })) || []
      );
      return list;
    },
  });

  // Submit overtime claim mutation
  const claimMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await api.post("/hrm/overtimes", {
        timesheetId: payload.timesheetId,
        hoursClaimed: Number(payload.hoursClaimed),
        reason: payload.reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
      setForm({ timesheetId: "", hoursClaimed: "", reason: "" });
      alert("Overtime claim submitted successfully!");
    },
  });

  // Admin action mutation
  const actionMutation = useMutation({
    mutationFn: async (payload: { id: string; status: "APPROVED" | "REJECTED"; notes?: string }) => {
      const res = await api.post(`/hrm/overtimes/${payload.id}/action`, {
        status: payload.status,
        notes: payload.notes,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
      alert("Overtime claim status updated successfully!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.timesheetId || !form.hoursClaimed || !form.reason.trim()) return;
    claimMutation.mutate(form);
  };

  const handleApprove = (id: string) => {
    actionMutation.mutate({ id, status: "APPROVED" });
  };

  const handleReject = (id: string) => {
    const notes = prompt("Enter required reason for rejection:");
    if (notes === null) return;
    if (!notes.trim()) {
      alert("Rejection notes are required!");
      return;
    }
    actionMutation.mutate({ id, status: "REJECTED", notes });
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px] text-slate-900">
      <MobileNav />
      <Sidebar />

      <main className="page-container flex-1">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <PageHeader 
              title="Overtime Hub" 
              subtitle="Submit overtime claims, justify excess hours, and review and approve department overtime sheets" 
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Claim Submission Form */}
          <div className="bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-4.5 h-4.5 text-blue-600" />
              <span>Claim Overtime Hours</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose Work Date</label>
                <select
                  value={form.timesheetId}
                  onChange={(e) => setForm(prev => ({ ...prev, timesheetId: e.target.value }))}
                  className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
                >
                  <option value="">-- Choose Present Day --</option>
                  {timesheets
                    .filter((t: any) => t.status === "PRESENT" || t.status === "LATE")
                    .map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {new Date(t.date).toLocaleDateString()} - ({t.totalHours} hrs worked)
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Claim Hours Count</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2.5"
                  step="0.1"
                  value={form.hoursClaimed}
                  onChange={(e) => setForm(prev => ({ ...prev, hoursClaimed: e.target.value }))}
                  className="input-field w-full text-xs py-2 bg-slate-50 border-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Overtime Justification Reason</label>
                <textarea
                  required
                  placeholder="Summarize the core technical work completed during overtime..."
                  value={form.reason}
                  onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-field w-full text-xs min-h-[90px] resize-none bg-slate-50 border-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={claimMutation.isPending}
                className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/10 active:scale-[0.98]"
              >
                {claimMutation.isPending ? "Submitting Claim..." : "Request Overtime Claim"}
              </button>
            </form>
          </div>

          {/* Overtime Request Logs */}
          <div className="lg:col-span-2 bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-4">
            <div className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Coins className="w-4.5 h-4.5 text-blue-600" />
              <span>Overtime History & Action Inbox</span>
            </div>

            {isClaimsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {overtimes.map((claim: any) => (
                  <div
                    key={claim.id}
                    className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-3 hover:border-slate-200 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          ⏱️ {claim.hoursClaimed} Hours Claimed
                        </span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                          claim.status === "APPROVED" && "bg-emerald-50 text-emerald-600 border-emerald-100",
                          claim.status === "PENDING" && "bg-blue-50 text-blue-600 border-blue-100",
                          claim.status === "REJECTED" && "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {claim.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        📅 Workday: {new Date(claim.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 italic bg-white border border-slate-100 rounded-xl p-2.5">
                      Justification: "{claim.reason}"
                    </div>

                    {claim.notes && (
                      <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 font-semibold italic">
                        Manager Note: "{claim.notes}"
                      </div>
                    )}

                    {claim.status === "PENDING" && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleReject(claim.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-rose-500/10"
                        >
                          Reject Claim
                        </button>
                        <button
                          onClick={() => handleApprove(claim.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                        >
                          Approve Claim
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {overtimes.length === 0 && (
                  <div className="py-16 text-center text-slate-400 font-medium text-xs">
                    No overtime claims submitted this month.
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
