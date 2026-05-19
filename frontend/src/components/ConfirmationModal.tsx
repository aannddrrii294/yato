"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isLoading?: boolean;
  type?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm Action",
  isLoading = false,
  type = "danger"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20"
        >
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                type === 'danger' ? 'bg-rose-50 text-rose-600' : 
                type === 'warning' ? 'bg-amber-50 text-amber-600' : 
                'bg-blue-50 text-blue-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-all">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-8">
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {message}
            </p>
          </div>

          <div className="p-6 bg-slate-50 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-[11px] uppercase tracking-widest text-slate-500 hover:bg-white transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-[11px] uppercase tracking-widest text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                type === 'danger' ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700' : 
                type === 'warning' ? 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700' : 
                'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700'
              }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
