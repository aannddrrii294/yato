"use client";

import { Info, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(true)}
            className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors shadow-sm shrink-0"
            title="Tampilkan Info"
          >
            <Info className="w-4 h-4" />
          </button>
          <h1 className="page-title text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3 text-slate-900">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold">{title}</h2>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="px-7 py-6 text-sm text-slate-500 leading-relaxed font-medium bg-slate-50/50">
                {subtitle}
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm active:scale-95"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
