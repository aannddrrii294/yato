"use client";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { IntegrationModal } from "./components/IntegrationModal";
import { 
  Plug, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Power, 
  PowerOff,
  Link as LinkIcon,
  Server,
  Activity,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IntegrationData {
  id: string;
  name: string;
  type: string;
  connectorKey: string;
  endpointUrl: string;
  isActive: boolean;
  config: any;
}

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationData | null>(null);

  const { data: integrations, isLoading } = useQuery<IntegrationData[]>({
    queryKey: ["integrations"],
    queryFn: async () => {
      const response = await api.get("/integrations");
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/integrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      api.put(`/integrations/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const handleEdit = (integration: IntegrationData) => {
    setEditingIntegration(integration);
    setIsModalOpen(true);
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'PROVISIONING': return <Server className="w-5 h-5 text-indigo-500" />;
      case 'MONITORING': return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'NOTIFICATION': return <Bell className="w-5 h-5 text-amber-500" />;
      default: return <Plug className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBadgeForType = (type: string) => {
    switch(type) {
      case 'PROVISIONING': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'MONITORING': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'NOTIFICATION': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-[13px]">
      <MobileNav />
      <Sidebar />
      
      <main className="page-container">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <PageHeader title="Integration Hub" subtitle="Manage dynamic plugins, inbound webhooks, and external drivers" />
          </div>
          <div className="flex items-center gap-4 md:ml-auto">
            <button 
              onClick={() => {
                setEditingIntegration(null);
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2.5 whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Integration</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-400 glass-card">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading Integrations...</p>
            </div>
          ) : integrations?.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center py-32 text-slate-400 glass-card">
              <Plug className="w-12 h-12 mb-4 text-slate-200" />
              <p className="text-sm font-bold tracking-tight text-slate-500">No Integrations Configured</p>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-1 text-slate-400">Click "Add Integration" to register a plugin</p>
            </div>
          ) : (
            integrations?.map((integration) => (
              <motion.div 
                key={integration.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "glass-card p-6 relative group transition-all duration-300 border-2 overflow-hidden",
                  integration.isActive ? "border-transparent hover:border-blue-100" : "border-slate-100/50 opacity-75 grayscale-[0.3]"
                )}
              >
                {!integration.isActive && (
                  <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-xl z-10">
                    Disabled
                  </div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                      {getIconForType(integration.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 tracking-tight">{integration.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Key: {integration.connectorKey}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-600 truncate">{integration.endpointUrl}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn("badge uppercase tracking-wider text-[9px] font-bold", getBadgeForType(integration.type))}>
                      {integration.type}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => toggleStatusMutation.mutate({ id: integration.id, isActive: !integration.isActive })}
                    className={cn(
                      "flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors",
                      integration.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    {integration.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    {integration.isActive ? "Disable" : "Enable"}
                  </button>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(integration)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('Are you sure you want to delete this integration?')) {
                          deleteMutation.mutate(integration.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      <IntegrationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingIntegration={editingIntegration}
      />
    </div>
  );
}
