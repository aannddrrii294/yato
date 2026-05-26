"use client";

import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Shield,
  Plus,
  Edit,
  Users,
  UserCheck,
  Building,
  Loader2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";


export default function DivisionMappingsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState<any>(null);
  
  // Form State
  const [form, setForm] = useState({
    name: "",
    description: "",
    supervisorId: "",
    managerId: "",
    headId: "",
  });

  // Fetch divisions
  const { data: divisions = [], isLoading: isDivsLoading } = useQuery({
    queryKey: ["hrm", "divisions"],
    queryFn: async () => {
      const res = await api.get("/hrm/divisions");
      return res.data;
    },
  });

  // Fetch users for SPV/Mgr/Head mapping
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });

  // Mutation to create/update division
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      if (editingDivision) {
        const res = await api.put(`/hrm/divisions/${editingDivision.id}`, payload);
        return res.data;
      } else {
        const res = await api.post("/hrm/divisions", payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrm"] });
      setShowModal(false);
      setEditingDivision(null);
      setForm({ name: "", description: "", supervisorId: "", managerId: "", headId: "" });
    },
  });

  const handleOpenCreate = () => {
    setEditingDivision(null);
    setForm({ name: "", description: "", supervisorId: "", managerId: "", headId: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (div: any) => {
    setEditingDivision(div);
    setForm({
      name: div.name,
      description: div.description || "",
      supervisorId: div.supervisor?.id || "",
      managerId: div.manager?.id || "",
      headId: div.head?.id || "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    saveMutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px] text-slate-900">
      <MobileNav />
      <Sidebar />

      <main className="page-container flex-1">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <PageHeader 
              title="Division Mappings" 
              subtitle="Configure departments, describe operational roles, and map supervising layers for automated approval routing" 
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="btn-primary flex items-center gap-2 py-3 px-5 text-xs font-bold uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md hover:from-blue-750 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Division
          </button>
        </header>

        {isDivsLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="font-bold uppercase tracking-widest text-[10px]">Loading Divisions...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {divisions.map((div: any) => (
              <div
                key={div.id}
                className="bg-white border border-slate-150/60 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                        <Building className="w-4.5 h-4.5" />
                      </div>
                      <span className="font-extrabold text-slate-850 text-sm tracking-tight">{div.name}</span>
                    </div>
                    <button
                      onClick={() => handleOpenEdit(div)}
                      className="bg-slate-50 border border-slate-100 hover:bg-slate-100 p-2 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    {div.description || "No division description added yet."}
                  </p>

                  <div className="space-y-2.5 pt-3">
                    <div className="flex items-center justify-between text-xs bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                        Supervisor
                      </span>
                      <span className="font-bold text-slate-700">{div.supervisor?.fullName || "Not Mapped"}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                        Manager
                      </span>
                      <span className="font-bold text-slate-700">{div.manager?.fullName || "Not Mapped"}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                        Department Head
                      </span>
                      <span className="font-bold text-slate-700">{div.head?.fullName || "Not Mapped"}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    {div._count?.users || 0} Registered Employees
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Division Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-8 max-w-md w-full relative space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                      {editingDivision ? "Edit Division Structure" : "New Division Assignment"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Division Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Technology & Core Infrastructure"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field w-full text-xs py-2.5 bg-slate-50 border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Description</label>
                    <textarea
                      placeholder="Brief summary of division operational functions..."
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      className="input-field w-full text-xs min-h-[70px] resize-none bg-slate-50 border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">1. Supervisor Step (SPV)</label>
                    <select
                      value={form.supervisorId}
                      onChange={(e) => setForm(prev => ({ ...prev, supervisorId: e.target.value }))}
                      className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
                    >
                      <option value="">-- No Supervisor Assigned --</option>
                      {users.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">2. Manager Step (Manager)</label>
                    <select
                      value={form.managerId}
                      onChange={(e) => setForm(prev => ({ ...prev, managerId: e.target.value }))}
                      className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
                    >
                      <option value="">-- No Manager Assigned --</option>
                      {users.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">3. Department Head Step (Head)</label>
                    <select
                      value={form.headId}
                      onChange={(e) => setForm(prev => ({ ...prev, headId: e.target.value }))}
                      className="input-field w-full bg-slate-50 text-xs py-2.5 cursor-pointer border-slate-200"
                    >
                      <option value="">-- No Head Mapped --</option>
                      {users.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="bg-slate-100 hover:bg-slate-250 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {saveMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
