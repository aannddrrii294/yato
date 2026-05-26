"use client";

import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  ArrowLeftRight,
  User,
  Plus,
  Loader2,
  CheckCircle2,
  Calendar,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const getFormattedDate = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export default function ShiftTradesPage() {
  const queryClient = useQueryClient();
  const [swapForm, setSwapForm] = useState({
    targetUserId: "",
    requesterShiftId: "",
    targetShiftId: "",
  });

  const startRosterDate = getFormattedDate(new Date(new Date().setDate(new Date().getDate() - 15)));
  const endRosterDate = getFormattedDate(new Date(new Date().setDate(new Date().getDate() + 15)));

  // Fetch roster
  const { data: roster = [] } = useQuery({
    queryKey: ["hrm", "roster", startRosterDate, endRosterDate],
    queryFn: async () => {
      const res = await api.get(`/hrm/shifts/my-roster?start=${startRosterDate}&end=${endRosterDate}`);
      return res.data;
    },
  });

  // Fetch users for targets
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });

  // Shift swaps list
  const { data: swaps = [], isLoading: isSwapsLoading } = useQuery({
    queryKey: ["hrm", "shifts", "swaps"],
    queryFn: async () => {
      const res = await api.get("/hrm/shifts/swap-requests"); // generic swaps fetcher
      return res.data || [];
    },
  });

  // Mutation for trade submit
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

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapForm.targetUserId || !swapForm.requesterShiftId || !swapForm.targetShiftId) {
      alert("Please select coworker and both shifts.");
      return;
    }
    swapRequestMutation.mutate(swapForm);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px] text-slate-900">
      <MobileNav />
      <Sidebar />

      <main className="page-container flex-1">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <PageHeader 
              title="Shift Trades" 
              subtitle="Submit shifts swap offers with active division coworkers and track supervisor approvals" 
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Swap request form */}
          <div className="bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-4.5 h-4.5 text-blue-600" />
              <span>Propose Shift Swap</span>
            </div>

            <form onSubmit={handleSwapSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Coworker Target</label>
                <select
                  value={swapForm.targetUserId}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, targetUserId: e.target.value }))}
                  className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
                >
                  <option value="">-- Choose Colleague --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Your Roster Shift to Swap</label>
                <select
                  value={swapForm.requesterShiftId}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, requesterShiftId: e.target.value }))}
                  className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
                >
                  <option value="">-- Choose Your Workday --</option>
                  {roster.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.date).toLocaleDateString()} - {s.shiftCategory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Target Colleague's Shift ID</label>
                <input
                  type="text"
                  required
                  placeholder="Input colleague shift ID..."
                  value={swapForm.targetShiftId}
                  onChange={(e) => setSwapForm(prev => ({ ...prev, targetShiftId: e.target.value }))}
                  className="input-field w-full bg-slate-50 text-xs py-2 border-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={swapRequestMutation.isPending}
                className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/10 active:scale-[0.98]"
              >
                {swapRequestMutation.isPending ? "Submitting Offer..." : "Submit Swap Request"}
              </button>
            </form>
          </div>

          {/* Trade History and offers */}
          <div className="lg:col-span-2 bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-4">
            <div className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ArrowLeftRight className="w-4.5 h-4.5 text-blue-600" />
              <span>Shift Swaps Offer Logs</span>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {swaps.map((req: any) => (
                <div
                  key={req.id}
                  className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-3 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-850 text-xs flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {req.targetUser?.fullName || "Coworker"}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                        req.status === "APPROVED" && "bg-emerald-50 text-emerald-600 border-emerald-100",
                        req.status === "PENDING" && "bg-blue-50 text-blue-600 border-blue-100",
                        req.status === "REJECTED" && "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {req.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-white border border-slate-100 p-3 rounded-xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Your Roster Day</span>
                      <span className="text-xs font-bold text-slate-700 mt-1 block">
                        📅 {new Date(req.requesterShift.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-100 p-3 rounded-xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Coworker Roster Day</span>
                      <span className="text-xs font-bold text-slate-700 mt-1 block">
                        📅 {new Date(req.targetShift.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {req.rejectionNotes && (
                    <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      <strong>Rejection Note:</strong> "{req.rejectionNotes}"
                    </div>
                  )}
                </div>
              ))}

              {swaps.length === 0 && (
                <div className="py-16 text-center text-slate-400 font-medium text-xs">
                  No shift trades recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
