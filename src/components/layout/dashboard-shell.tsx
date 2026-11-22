"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  FolderKanban,
  HelpCircle,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquareHeart,
  ScrollText,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-provider";
import { useToast } from "@/components/ui/toast-provider";
import { CategoryIcon } from "@/components/ui/streamline-icon";

export interface SidebarLinkItem {
  label: string;
  href: string;
  iconKey: string;
  exact?: boolean;
}

interface DashboardShellProps {
  mode: "student" | "admin";
  user: {
    fullName: string;
    email: string;
    gradeLevel: string | null;
    roleCode: "ADMIN" | "STUDENT";
  };
  links: SidebarLinkItem[];
  children: React.ReactNode;
}

function renderSidebarIcon(key: string) {
  switch (key) {
    case "dashboard":
      return <LayoutDashboard className="w-4 h-4 shrink-0" />;
    case "home":
      return <Home className="w-4 h-4 shrink-0" />;
    case "materi":
      return <BookOpen className="w-4 h-4 shrink-0" />;
    case "kuis":
      return <HelpCircle className="w-4 h-4 shrink-0" />;
    case "skenario":
      return <MessageSquareHeart className="w-4 h-4 shrink-0" />;
    case "bantuan":
      return <LifeBuoy className="w-4 h-4 shrink-0" />;
    case "profil":
      return <UserCircle className="w-4 h-4 shrink-0" />;
    case "persetujuan":
      return <ClipboardCheck className="w-4 h-4 shrink-0" />;
    case "siswa":
      return <Users className="w-4 h-4 shrink-0" />;
    case "kategori":
      return <FolderKanban className="w-4 h-4 shrink-0" />;
    case "kelola-materi":
      return <FileText className="w-4 h-4 shrink-0" />;
    case "audit":
      return <ScrollText className="w-4 h-4 shrink-0" />;
    case "pengaturan":
      return <Settings className="w-4 h-4 shrink-0" />;
    default:
      return <CategoryIcon name={key} className="w-4 h-4 shrink-0" />;
  }
}

export function DashboardShell({
  mode,
  user,
  links,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.info("Berhasil Keluar", "Sampai jumpa lagi di TEMANSPACE.ID.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Gagal Keluar", "Silakan coba lagi.");
    } finally {
      setLoggingOut(false);
    }
  };

  const isLinkActive = (item: SidebarLinkItem) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const sidebarNav = (
    <nav aria-label="Menu Dashboard" className="space-y-1.5">
      {links.map((item) => {
        const active = isLinkActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
              active
                ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-[0_8px_20px_-4px_rgba(14,165,233,0.45)]"
                : "text-slate-700 dark:text-slate-200 hover:bg-sky-50/90 dark:hover:bg-slate-800/80 hover:text-sky-700 dark:hover:text-sky-300"
            }`}
          >
            {renderSidebarIcon(item.iconKey)}
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F0F5FA] via-[#F7FAFE] to-[#EAF3FC] dark:from-[#090F1D] dark:via-[#0B1325] dark:to-[#090F1D]">
      <header className="sticky top-0 z-40 w-full bg-white/40 dark:bg-slate-950/60 backdrop-blur-md border-b border-white/40 dark:border-slate-800/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((p) => !p)}
              aria-label={sidebarOpen ? "Tutup menu samping" : "Buka menu samping"}
              className="lg:hidden p-2 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-white dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link
              href={mode === "admin" ? "/admin" : "/dashboard"}
              className="flex items-center gap-2.5 shrink-0"
            >
              <span className="keep-light relative w-12 h-9 rounded-xl bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <Image
                  src="/images/temanspace-logo.jpg"
                  alt="Logo TEMANSPACE.ID"
                  fill
                  sizes="48px"
                  className="object-cover object-center"
                />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display font-bold text-base text-slate-800 dark:text-slate-100">
                  TEMANSPACE<span className="text-sky-600 dark:text-sky-400">.ID</span>
                </span>
                <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                  {mode === "admin" ? "Panel Admin Layanan" : "Ruang Belajar Siswa"}
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 dark:bg-slate-800/75 border border-white/70 dark:border-slate-700 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100 max-w-[140px] truncate">
                {user.fullName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold">
                {mode === "admin"
                  ? "Admin"
                  : user.gradeLevel
                  ? `Kelas ${user.gradeLevel}`
                  : "Siswa"}
              </span>
            </div>

            {mode === "admin" && (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs clay-btn-secondary"
              >
                <span>Lihat Mode Siswa</span>
              </Link>
            )}

            <ThemeToggle />

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/70 dark:bg-slate-800/80 border border-white/80 dark:border-slate-700 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-7 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
          <div className="clay-card p-4 space-y-4">
            {sidebarNav}
            <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Beranda Publik</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-slate-900/45 backdrop-blur-sm flex"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSidebarOpen(false);
            }}
          >
            <div className="w-80 max-w-[85vw] h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 overflow-y-auto shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <p className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Menu Navigasi
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Tutup menu"
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {sidebarNav}
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
