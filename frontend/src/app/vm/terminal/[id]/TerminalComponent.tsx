"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { io, Socket } from "socket.io-client";
import "xterm/css/xterm.css";
import { useParams } from "next/navigation";
import { Terminal as TerminalIcon, X, Loader2, Key, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TerminalComponent() {
  const { id } = useParams();
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const xtermRef = useRef<Terminal | null>(null);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authData, setAuthData] = useState({ username: "", password: "" });
  const [isConnecting, setIsConnecting] = useState(true);

  const connectTerminal = (overrides?: { username?: string; password?: string }) => {
    if (!socketRef.current || !xtermRef.current) return;
    
    setIsConnecting(true);
    xtermRef.current.writeln("\r\n\x1b[34m[YATO]\x1b[0m Initiating SSH connection...");
    socketRef.current.emit("startTerminal", { 
      vmId: id,
      ...overrides
    });
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#0f172a",
        foreground: "#f8fafc",
      },
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    term.writeln("\x1b[34m[YATO]\x1b[0m Establishing secure gateway channel...");

    // Initialize Socket.io
    const socket = io("/terminal", {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      term.writeln("\x1b[32m[Connected]\x1b[0m Gateway established.");
      connectTerminal();
    });

    socket.on("terminalOutput", (data: string) => {
      term.write(data);
      setIsConnecting(false);
    });

    socket.on("terminalError", (error: string) => {
      term.writeln(`\r\n\x1b[31m[Error]\x1b[0m ${error}`);
      setIsConnecting(false);
      if (error.includes("Authentication failed") || error.includes("credentials")) {
        setShowAuthModal(true);
      }
    });

    term.onData((data) => {
      socket.emit("terminalInput", data);
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      socket.emit("terminalResize", {
        cols: term.cols,
        rows: term.rows,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.disconnect();
      term.dispose();
    };
  }, [id]);

  const handleManualAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAuthModal(false);
    connectTerminal(authData);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-white overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-5 h-5 text-blue-500" />
          <h1 className="text-sm font-bold tracking-tight uppercase">
            Secure Terminal Session
          </h1>
          <button 
            onClick={() => setShowAuthModal(true)}
            className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-2"
          >
            <Key className="w-3 h-3" />
            MANUAL AUTH
          </button>
        </div>
        <button 
          onClick={() => window.close()} 
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-hidden p-4 relative bg-[#0f172a]">
        <div ref={terminalRef} className="h-full w-full" />

        {/* Auth Modal Overlay */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm uppercase tracking-wide">SSH Authentication</h3>
                  </div>
                  <button onClick={() => setShowAuthModal(false)} className="text-slate-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleManualAuth} className="p-8 space-y-6">
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    The automatic connection failed or required manual credentials. Please provide valid SSH access details for the target instance.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-blue-500 outline-none transition-all" 
                        placeholder="root / administrator"
                        value={authData.username}
                        onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                      <input 
                        type="password" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-blue-500 outline-none transition-all" 
                        placeholder="••••••••"
                        value={authData.password}
                        onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                  >
                    Authenticate & Connect
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {isConnecting && !showAuthModal && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/50 pointer-events-none">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="px-6 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase">
          <span className="text-slate-600 truncate max-w-[200px]">ID: {id}</span>
          <div className="w-px h-3 bg-slate-800" />
          <span>&copy; 2026 YATO</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isConnecting ? "bg-amber-500" : "bg-emerald-500")} />
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {isConnecting ? "Negotiating..." : "Session Active"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
