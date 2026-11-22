"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4500);
    },
    []
  );

  const value: ToastContextValue = {
    success: (title, message) => push("success", title, message),
    error: (title, message) => push("error", title, message),
    info: (title, message) => push("info", title, message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifikasi"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const icon =
            toast.kind === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : toast.kind === "error" ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-sky-500 shrink-0" />
            );

          const accentRing =
            toast.kind === "success"
              ? "border-emerald-200/80 dark:border-emerald-500/40"
              : toast.kind === "error"
              ? "border-rose-200/80 dark:border-rose-500/40"
              : "border-sky-200/80 dark:border-sky-500/40";

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto rounded-[24px] border-[2.5px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-[0_20px_45px_-6px_rgba(14,165,233,0.22),inset_2px_2px_6px_rgba(255,255,255,0.8)] dark:shadow-[0_20px_45px_-6px_rgba(2,6,23,0.75)] flex items-start gap-3 animate-slide-up ${accentRing}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="group p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
