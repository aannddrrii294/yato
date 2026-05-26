"use client";

import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Coffee,
  Shield,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  Plus,
  Loader2,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBranding } from "@/context/branding-context";


export default function LeaveHubPage() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const { appName, appLogo } = useBranding();
  const [selectedPrintLeave, setSelectedPrintLeave] = useState<any | null>(null);

  const handlePrintLeaveForm = (leave: any) => {
    setSelectedPrintLeave(leave);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Form state
  const [leaveForm, setLeaveForm] = useState({
    type: "ANNUAL_LEAVE",
    startDate: "",
    endDate: "",
    reason: "",
  });


  // Fetch Leave Balance
  const { data: leaveBalance } = useQuery({
    queryKey: ["hrm", "leave-balance", currentYear],
    queryFn: async () => {
      const res = await api.get(`/hrm/leaves/balance?year=${currentYear}`);
      return res.data;
    },
  });

  // Fetch Leaves History
  const { data: leaves = [], isLoading: isLeavesLoading, refetch: refetchLeaves } = useQuery({
    queryKey: ["hrm", "leaves"],
    queryFn: async () => {
      const res = await api.get("/hrm/leaves/my");
      return res.data;
    },
  });

  // Fetch Pending Approvals to Act on
  const { data: pendingApprovals = [], refetch: refetchPendingApprovals } = useQuery({
    queryKey: ["hrm", "pending-approvals"],
    queryFn: async () => {
      const res = await api.get("/hrm/leaves/pending");
      return res.data;
    },
  });

  // Submit leave mutation
  const leaveRequestMutation = useMutation({
    mutationFn: async (payload: typeof leaveForm) => {
      const res = await api.post("/hrm/leaves", payload);
      return res.data;
    },
    onSuccess: () => {
      refetchLeaves();
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
      setLeaveForm({ type: "ANNUAL_LEAVE", startDate: "", endDate: "", reason: "" });
      alert("Leave request submitted successfully!");
    },
  });

  // Take leave action mutation
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
    if (notes === null) return;
    if (!notes.trim()) {
      alert("Rejection notes are required!");
      return;
    }
    leaveApprovalMutation.mutate({ approvalId, action: "REJECTED", notes });
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px] text-slate-900">
      <MobileNav />
      <Sidebar />

      <main className="page-container flex-1">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <PageHeader 
              title="Leave Hub" 
              subtitle="Submit annual or sick leaves, view balance metrics, and manage division hierarchy approvals" 
            />
          </div>
        </header>

        {/* Leave Balance Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 flex items-center gap-4 border border-slate-100/80 shadow-sm">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <Coffee className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Allocated Cuti</div>
              <div className="text-sm font-bold text-slate-850 mt-0.5">
                {leaveBalance ? `${leaveBalance.allocated} Days` : "12 Days"}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-4 border border-slate-100/80 shadow-sm">
            <div className="bg-emerald-50 p-3 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Used Balance</div>
              <div className="text-sm font-bold text-slate-850 mt-0.5">
                {leaveBalance ? `${leaveBalance.used} Days` : "0 Days"}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex items-center gap-4 border border-slate-100/80 shadow-sm">
            <div className="bg-indigo-50 p-3 rounded-2xl">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining Cuti</div>
              <div className="text-sm font-bold text-slate-850 mt-0.5">
                {leaveBalance ? `${leaveBalance.remaining} Days` : "12 Days"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submission Form Card */}
          <div className="bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-4.5 h-4.5 text-blue-600" />
              <span>Apply for New Leave</span>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Leave Type</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, type: e.target.value }))}
                  className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
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
                    className="input-field w-full bg-slate-50 text-xs py-2 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input-field w-full bg-slate-50 text-xs py-2 border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Reason / Details</label>
                <textarea
                  required
                  placeholder="State your reasons clearly..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-field w-full bg-slate-50 text-xs min-h-[90px] resize-none border-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={leaveRequestMutation.isPending}
                className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/10 active:scale-[0.98]"
              >
                {leaveRequestMutation.isPending ? "Submitting..." : "Submit Leave Request"}
              </button>
            </form>
          </div>

          {/* Leave History & Approvals List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Approvals Inbox (Visible to SPV/Managers) */}
            {pendingApprovals.length > 0 && (
              <div className="bg-amber-50/30 border border-amber-200 rounded-[2rem] p-8 shadow-sm space-y-4">
                <div className="text-sm font-bold text-amber-800 flex items-center gap-2 border-b border-amber-100 pb-3">
                  <Shield className="w-4.5 h-4.5 text-amber-600" />
                  <span>Approval Worklist Inbox ({pendingApprovals.length})</span>
                </div>

                <div className="space-y-3">
                  {pendingApprovals.map((req: any) => {
                    const activeStep = req.approvals.find((a: any) => a.status === "PENDING");
                    return (
                      <div
                        key={req.id}
                        className="bg-white border border-amber-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 text-xs">{req.user.fullName}</span>
                            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {req.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            📅 {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-600 font-semibold italic mt-1">"{req.reason}"</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveLeave(activeStep.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm shadow-emerald-500/10"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectLeave(activeStep.id)}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm shadow-rose-500/10"
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

            {/* History Card */}
            <div className="bg-white border border-slate-150/60 rounded-[2rem] p-8 shadow-sm space-y-4">
              <div className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4.5 h-4.5 text-blue-600" />
                <span>Leave Request Pipeline Tracking</span>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {leaves.map((req: any) => (
                  <div
                    key={req.id}
                    className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-3 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{req.type}</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                          req.status === "APPROVED" && "bg-emerald-50 text-emerald-600 border-emerald-100",
                          req.status === "PENDING" && "bg-blue-50 text-blue-600 border-blue-100",
                          req.status === "REJECTED" && "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {req.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintLeaveForm(req)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                          title="Print Official Form"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      📅 Duration: <strong className="text-slate-800">{new Date(req.startDate).toLocaleDateString()}</strong> to <strong className="text-slate-800">{new Date(req.endDate).toLocaleDateString()}</strong>
                    </div>
                    <div className="text-xs text-slate-500 italic bg-white border border-slate-100 rounded-xl p-2.5">
                      Reason: "{req.reason}"
                    </div>

                    {/* Timeline Tracker */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-[10px]">
                      {req.approvals.map((app: any) => (
                        <div key={app.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-1 relative">
                          <div className="font-black text-slate-400 uppercase tracking-widest text-[8px]">{app.roleName}</div>
                          <div className={cn(
                            "font-bold flex items-center gap-1 text-[10px] mt-1",
                            app.status === "APPROVED" && "text-emerald-600",
                            app.status === "PENDING" && "text-blue-600",
                            app.status === "REJECTED" && "text-rose-600"
                          )}>
                            {app.status === "APPROVED" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            {app.status === "REJECTED" && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                            {app.status === "PENDING" && <Clock className="w-3.5 h-3.5 text-blue-500" />}
                            <span>{app.status}</span>
                          </div>
                          {app.notes && (
                            <p className="text-[9px] text-slate-400 mt-1 italic leading-tight">
                              Note: "{app.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {leaves.length === 0 && (
                  <div className="py-16 text-center text-slate-400 font-medium text-xs">
                    No leaves requested yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
          </main>

      {/* Printable Leave Request Form */}
      {selectedPrintLeave && (
        <div id="printable-leave-form" className="hidden print:block p-12 bg-white text-black font-sans min-h-screen">
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b-2 border-slate-950 pb-6 mb-8">
            <div className="flex items-center gap-4">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-slate-900 flex items-center justify-center text-white font-bold rounded-xl text-xl">
                  Y
                </div>
              )}
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{appName || "YATO"}</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise HR Management Hub</p>
              </div>
            </div>
            <div className="text-right text-[10px] font-mono text-slate-400">
              <p>DOCUMENT ID: {selectedPrintLeave.id}</p>
              <p>DATE GENERATED: {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-8">
            <h2 className="text-lg font-black uppercase tracking-widest text-slate-900 decoration-double underline underline-offset-4">
              FORMULIR PENGAJUAN CUTI KARYAWAN
            </h2>
            <p className="text-xs text-slate-500 mt-1">Status Dokumen: <strong className="uppercase">{selectedPrintLeave.status}</strong></p>
          </div>

          {/* Information Section */}
          <div className="grid grid-cols-2 gap-8 mb-8 border border-slate-200 rounded-2xl p-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">PROFIL KARYAWAN</h3>
              <table className="w-full text-xs text-left">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 font-bold text-slate-500">Nama Lengkap</td>
                    <td className="py-2 text-slate-900 font-extrabold">{selectedPrintLeave.user?.fullName || "Karyawan YATO"}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 font-bold text-slate-500">Departemen / Divisi</td>
                    <td className="py-2 text-slate-900">{selectedPrintLeave.user?.division?.name || "Unassigned"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-500">Alamat Email</td>
                    <td className="py-2 text-slate-900">{selectedPrintLeave.user?.email || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">RINCIAN PENGAJUAN</h3>
              <table className="w-full text-xs text-left">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 font-bold text-slate-500">Tipe Cuti</td>
                    <td className="py-2 text-slate-900 font-bold uppercase">{selectedPrintLeave.type}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 font-bold text-slate-500">Durasi Cuti</td>
                    <td className="py-2 text-slate-900 font-bold">
                      {new Date(selectedPrintLeave.startDate).toLocaleDateString()} s/d {new Date(selectedPrintLeave.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-slate-500">Alasan / Detail</td>
                    <td className="py-2 text-slate-900 italic">"{selectedPrintLeave.reason}"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow Tracker */}
          <div className="space-y-4 mb-12">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-2">WORKFLOW APPROVAL TRACKER (PERSETUJUAN BERJENJANG)</h3>
            <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-left font-black text-slate-600">LEVEL</th>
                  <th className="p-3 text-left font-black text-slate-600">ROLE JABATAN</th>
                  <th className="p-3 text-left font-black text-slate-600">APPROVER</th>
                  <th className="p-3 text-left font-black text-slate-600">STATUS</th>
                  <th className="p-3 text-left font-black text-slate-600">CATATAN PENINJAUAN</th>
                </tr>
              </thead>
              <tbody>
                {selectedPrintLeave.approvals?.map((app: any) => (
                  <tr key={app.id} className="border-b border-slate-100">
                    <td className="p-3 font-mono font-bold text-slate-500">Lvl {app.level}</td>
                    <td className="p-3 font-bold text-slate-700">{app.roleName}</td>
                    <td className="p-3 text-slate-800">{app.approver?.fullName || "-"}</td>
                    <td className="p-3 font-black uppercase">{app.status}</td>
                    <td className="p-3 text-slate-500 italic">"{app.notes || '-'}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signature Boxes */}
          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200">
            <div className="text-center space-y-16">
              <div>
                <p className="text-xs font-bold text-slate-400">Pemohon (Karyawan),</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 underline underline-offset-4">{selectedPrintLeave.user?.fullName || "Karyawan YATO"}</p>
                <p className="text-[10px] text-slate-400 mt-1">Tanda Tangan & Tanggal</p>
              </div>
            </div>

            <div className="text-center space-y-16">
              <div>
                <p className="text-xs font-bold text-slate-400">Penyetuju Akhir (Dept Head),</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 underline underline-offset-4">
                  {selectedPrintLeave.approvals?.find((a: any) => a.level === 3)?.approver?.fullName || "________________________"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Tanda Tangan & Tanggal</p>
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="mt-20 text-center text-[9px] text-slate-400 border-t pt-4">
            <p>Formulir ini adalah dokumen digital resmi yang dihasilkan secara otomatis oleh {appName || "YATO"} Platform.</p>
            <p className="font-mono mt-0.5">Checksum: MD5-{selectedPrintLeave.id.substring(0, 8).toUpperCase()}</p>
          </div>

          {/* Global Print CSS Injector */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-leave-form, #printable-leave-form * {
                visibility: visible !important;
              }
              #printable-leave-form {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
              }
            }
          `}} />
        </div>
      )}
    </div>
  );
}

