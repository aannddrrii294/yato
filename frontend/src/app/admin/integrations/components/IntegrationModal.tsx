import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plug, Server, Activity, Bell, Loader2, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingIntegration: any | null;
}

export function IntegrationModal({ isOpen, onClose, editingIntegration }: IntegrationModalProps) {
  const queryClient = useQueryClient();
  const [jsonError, setJsonError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "PROVISIONING",
    connectorKey: "",
    endpointUrl: "",
    authKey: "",
    configStr: "{\n  \n}",
    isActive: true
  });

  useEffect(() => {
    if (editingIntegration) {
      setFormData({
        name: editingIntegration.name,
        type: editingIntegration.type,
        connectorKey: editingIntegration.connectorKey,
        endpointUrl: editingIntegration.endpointUrl,
        authKey: editingIntegration.authKey || "",
        configStr: JSON.stringify(editingIntegration.config || {}, null, 2),
        isActive: editingIntegration.isActive
      });
      setJsonError("");
    } else {
      setFormData({
        name: "",
        type: "PROVISIONING",
        connectorKey: "",
        endpointUrl: "",
        authKey: "",
        configStr: "{\n  \n}",
        isActive: true
      });
      setJsonError("");
    }
  }, [editingIntegration, isOpen]);

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post("/integrations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/integrations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError("");
    
    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(formData.configStr);
    } catch (err: any) {
      setJsonError(`Invalid JSON format: ${err.message}`);
      return;
    }

    const payload = {
      name: formData.name,
      type: formData.type,
      connectorKey: formData.connectorKey,
      endpointUrl: formData.endpointUrl,
      authKey: formData.authKey,
      isActive: formData.isActive,
      config: parsedConfig
    };

    if (editingIntegration) {
      updateMutation.mutate({ id: editingIntegration.id, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/20">
                  <Plug className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">{editingIntegration ? 'Edit Integration' : 'Register Integration'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Configure dynamic plugin endpoint</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1">
              <form id="integration-form" onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  
                  <div className="space-y-1.5 col-span-2">
                    <label>Integration Name</label>
                    <input 
                      type="text" 
                      required
                      className="input-field w-full py-3.5"
                      placeholder="e.g. Proxmox Cluster Prod 1"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label>Plugin Type</label>
                    <select 
                      className="input-field w-full py-3.5 appearance-none bg-white"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="PROVISIONING">Provisioning (Outbound)</option>
                      <option value="MONITORING">Monitoring (Inbound/Webhooks)</option>
                      <option value="NOTIFICATION">Notification Gateway</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label>Connector Key</label>
                    <input 
                      type="text" 
                      required
                      className="input-field w-full py-3.5 font-mono text-sm"
                      placeholder="e.g. proxmox-ve"
                      value={formData.connectorKey}
                      onChange={e => setFormData({...formData, connectorKey: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label>Endpoint URL</label>
                    <input 
                      type="url" 
                      required
                      className="input-field w-full py-3.5 font-mono text-sm"
                      placeholder="http://yato-plugin-proxmox:5001"
                      value={formData.endpointUrl}
                      onChange={e => setFormData({...formData, endpointUrl: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <div className="flex justify-between items-end mb-1">
                      <label>Dynamic Configuration Secrets (JSON)</label>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Vault Encrypted</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                      Enter the required credentials (API keys, host URLs) for this plugin in raw JSON format. This will be encrypted by the YATO vault before saving.
                    </p>
                    <textarea 
                      className={cn(
                        "input-field w-full h-40 font-mono text-sm leading-relaxed py-3 resize-none bg-slate-900 text-slate-300",
                        jsonError ? "border-rose-500 ring-rose-500/20" : ""
                      )}
                      spellCheck={false}
                      value={formData.configStr}
                      onChange={e => {
                        setFormData({...formData, configStr: e.target.value});
                        setJsonError("");
                      }}
                    />
                    {jsonError && (
                      <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold mt-2">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{jsonError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/50 shrink-0">
              <button 
                type="submit" 
                form="integration-form"
                disabled={addMutation.isPending || updateMutation.isPending}
                className="btn-primary w-full py-4 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plug className="w-5 h-5" />}
                <span>{editingIntegration ? 'Save Configuration' : 'Register Integration'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
