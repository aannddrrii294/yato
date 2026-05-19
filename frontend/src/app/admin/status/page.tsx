"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { 
  Zap, 
  Shield, 
  Activity, 
  Server, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check,
  RefreshCw,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, Fragment } from "react";

// Status types: simplified to only Active, Busy, and Down
type ServiceStatus = 'ACTIVE' | 'BUSY' | 'DOWN';

interface ServiceProcess {
  name: string;
  description: string;
  status: ServiceStatus;
}

interface EngineGroup {
  id: string;
  name: string;
  description: string;
  icon: any;
  services: ServiceProcess[];
}

export default function SystemStatusPage() {
  const { data: statusData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const response = await api.get("/system/config/status");
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10s
  });

  // Dynamically map backend live status to services
  const getLiveStatus = (groupId: string, defaultStatus: ServiceStatus): ServiceStatus => {
    if (!statusData) return defaultStatus;
    const groupData = statusData.find((g: any) => g.id === groupId);
    if (!groupData) return defaultStatus;
    
    // Map live status: if backend has DEGRADED -> BUSY, if OFFLINE/DOWN -> DOWN
    if (groupData.status === 'DEGRADED') {
      return 'BUSY';
    } else if (groupData.status === 'OFFLINE' || groupData.status === 'DOWN') {
      return 'DOWN';
    }
    return defaultStatus;
  };

  const processGroups: EngineGroup[] = [
    {
      id: "engine",
      name: "PROVISIONING ENGINE",
      description: "Automated VM and Service deployment orchestrator",
      icon: Server,
      services: [
        { 
          name: "VM Provisioner Daemon", 
          description: "Manages ESXi/Proxmox VM provisioning pipelines", 
          status: getLiveStatus("engine", "ACTIVE")
        },
        { 
          name: "Service Asset Deployer", 
          description: "Handles docker-compose and kubernetes application packaging", 
          status: getLiveStatus("engine", "BUSY")
        },
        { 
          name: "Network Orchestrator Service", 
          description: "Automates VLAN assignments and IPAM allocations", 
          status: getLiveStatus("engine", "ACTIVE")
        },
        { 
          name: "CMDB Sync Engine", 
          description: "Syncs hypervisor states with local physical inventory", 
          status: getLiveStatus("engine", "ACTIVE")
        }
      ]
    },
    {
      id: "vault",
      name: "IDENTITY & VAULT SERVICE",
      description: "Encryption layer for credential and certificate management",
      icon: Shield,
      services: [
        { 
          name: "Key Management Service (KMS)", 
          description: "Symmetric and asymmetric encryption provider", 
          status: getLiveStatus("vault", "ACTIVE")
        },
        { 
          name: "Secret Rotation Runner", 
          description: "Automates SSH key and database password rotation schedules", 
          status: getLiveStatus("vault", "ACTIVE")
        },
        { 
          name: "Active Directory Gateway", 
          description: "Syncs corporate directories with HermesOps roles", 
          status: getLiveStatus("vault", "ACTIVE")
        }
      ]
    },
    {
      id: "notification",
      name: "NOTIFICATION RELAY ENGINE",
      description: "Real-time alert delivery and webhook dispatch engine",
      icon: Zap,
      services: [
        { 
          name: "SMTP Relay Agent", 
          description: "Handles transactional email notifications", 
          status: getLiveStatus("notification", "ACTIVE")
        },
        { 
          name: "Webhook Publisher", 
          description: "Dispatches events to Slack, Discord, and custom API links", 
          status: getLiveStatus("notification", "ACTIVE")
        },
        { 
          name: "Push Dispatch Daemon", 
          description: "Mobile notification push routing mechanism", 
          status: getLiveStatus("notification", "ACTIVE")
        }
      ]
    },
    {
      id: "audit",
      name: "AUDIT LEDGER SERVICE",
      description: "Compliance tracking and tamper-proof log repository",
      icon: Activity,
      services: [
        { 
          name: "Immutable Ledger Logger", 
          description: "Signs and writes system events securely to the database", 
          status: getLiveStatus("audit", "ACTIVE")
        },
        { 
          name: "Log Rotation Service", 
          description: "Compresses, encrypts, and ships logs to secondary archives", 
          status: getLiveStatus("audit", "ACTIVE")
        },
        { 
          name: "Security Auditing Daemon", 
          description: "Detects unauthorized access patterns in real-time", 
          status: getLiveStatus("audit", "ACTIVE")
        }
      ]
    }
  ];

  // Helper to render Tableau style status badges (simplified to Active, Busy, Down)
  const renderStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded bg-emerald-500 text-white shadow-sm hover:scale-105 transition-transform" title="Active">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        );
      case 'BUSY':
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded bg-cyan-500 text-white shadow-sm hover:scale-105 transition-transform" title="Busy">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          </div>
        );
      case 'DOWN':
      default:
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded bg-rose-500 text-white shadow-sm hover:scale-105 transition-transform animate-pulse" title="Down">
            <X className="w-4 h-4 stroke-[3]" />
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <MobileNav />
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <main className="page-container p-8 flex-1">
          
          {/* Header */}
          <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="page-title text-3xl font-extrabold text-slate-900 tracking-tight">System Status</h1>
              <p className="page-subtitle text-slate-500 mt-1">Real-time health monitoring and process states of the HermesOps cluster</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => refetch()}
                className="btn-secondary flex items-center gap-2 py-2.5 px-4 shadow-sm hover:border-slate-300 transition-all bg-white"
                disabled={isLoading || isRefetching}
              >
                {isLoading || isRefetching ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                )}
                <span className="font-semibold text-xs text-slate-700">Refresh Status</span>
              </button>
            </div>
          </header>

          {/* Quick Overview Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              ))
            ) : (
              statusData?.map((item: any) => {
                const isHealthy = item.status === 'HEALTHY' || item.status === 'SECURE' || item.status === 'OPERATIONAL';
                return (
                  <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black shadow-sm",
                        isHealthy ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {item.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.name}</p>
                        <p className="text-xs font-extrabold text-slate-900 mt-0.5">{item.latency || '0ms'} latency</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full border shadow-sm",
                      isHealthy ? "bg-emerald-500 border-emerald-300 animate-pulse" : "bg-rose-500 border-rose-300 animate-pulse"
                    )} />
                  </div>
                );
              })
            )}
          </div>

          {/* Tableau-Style Process Status Grid Card */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-8">
            
            {/* Card Info Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Process Status</h2>
              <p className="text-slate-500 text-xs mt-0.5">The real-time status of daemon services and engines running in the HermesOps Server.</p>
            </div>

            {/* Tableau Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-3/4">Process</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-1/4">
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold text-slate-800">HermesOps Server</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5 font-mono">192.168.201.18</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processGroups.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <Fragment key={group.id}>
                        <tr className="bg-slate-50/30">
                          <td colSpan={2} className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <GroupIcon className="w-4 h-4 text-blue-600 animate-pulse" />
                              <span className="text-xs font-extrabold text-slate-900 tracking-wider uppercase">{group.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">— {group.description}</span>
                            </div>
                          </td>
                        </tr>
                        {group.services.map((service) => (
                          <tr key={service.name} className="hover:bg-slate-50/30 transition-colors group/row">
                            <td className="px-6 py-4 pl-10">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-semibold text-slate-800 group-hover/row:text-blue-600 transition-colors">
                                  {service.name}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                  {service.description}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center">
                                {renderStatusBadge(service.status)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tableau Legend Footer (Simplified to Active, Busy, Down) */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-2">
                {renderStatusBadge('ACTIVE')}
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2">
                {renderStatusBadge('BUSY')}
                <span>Busy</span>
              </div>
              <div className="flex items-center gap-2">
                {renderStatusBadge('DOWN')}
                <span>Down</span>
              </div>
            </div>

          </div>

          {/* Premium Bottom Info Section */}
          <div className="bg-slate-900 rounded-[2rem] p-10 text-white overflow-hidden relative group shadow-xl">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Security Standard</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Compliance Level: High</h2>
              <p className="text-slate-400 text-sm max-w-lg mb-8">Your platform infrastructure is currently operating under strict security protocols with TLS 1.3 active and end-to-end audit logging enabled.</p>
              <div className="flex gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TLS Encryption</p>
                  <p className="text-base font-semibold">TLS 1.3 ACTIVE</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auditing</p>
                  <p className="text-base font-semibold">ENABLED</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MFA Enforcement</p>
                  <p className="text-base font-semibold">GLOBAL</p>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
