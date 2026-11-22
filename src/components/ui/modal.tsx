"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-slide-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`clay-modal w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto p-6 sm:p-7`}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-bold text-slate-800 dark:text-slate-100"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="group p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
