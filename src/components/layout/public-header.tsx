"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  Home,
  Info,
  LogIn,
  Menu,
  UserPlus,
  X,
} from "lucide-react";
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-navbar";
import { ThemeToggle, useTheme } from "@/components/ui/theme-provider";

export function PublicHeader({
  sessionRole,
}: {
  sessionRole?: "ADMIN" | "STUDENT" | null;
}) {
  const pathname = usePathname();
  const { theme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: LiquidNavItem[] = [
    {
      label: "Beranda",
      href: "/",
      icon: <Home className="w-3.5 h-3.5" />,
      fx: "glow",
    },
    {
      label: "Tentang",
      href: "/tentang",
      icon: <Info className="w-3.5 h-3.5" />,
      fx: "pop",
    },
    {
      label: "Status Pendaftaran",
      href: "/status-pendaftaran",
      icon: <ClipboardCheck className="w-3.5 h-3.5" />,
      fx: "wave",
    },
    {
      label: "Masuk",
      href: "/login",
      icon: <LogIn className="w-3.5 h-3.5" />,
      fx: "pop",
    },
    {
      label: "Daftar",
      href: "/daftar",
      icon: <UserPlus className="w-3.5 h-3.5" />,
      fx: "pop",
    },
  ];

  const activeIdx = Math.max(
    0,
    navItems.findIndex((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href || "")
    )
  );

  const dashboardHref = sessionRole === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/40 dark:bg-slate-950/60 backdrop-blur-md border-b border-white/40 dark:border-slate-800/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-5 xl:px-8 h-16 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-2 focus-visible:outline-sky-500 rounded-xl"
        >
          <span className="keep-light relative w-14 h-10 rounded-2xl bg-white border-2 border-white shadow-[0_8px_18px_-4px_rgba(14,165,233,0.22)] overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/images/temanspace-logo.jpg"
              alt="Logo TEMANSPACE.ID"
              fill
              sizes="56px"
              className="object-cover object-center"
              priority
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-800 dark:text-slate-100">
              TEMANSPACE<span className="text-sky-600 dark:text-sky-400">.ID</span>
            </span>
            <span className="hidden sm:inline-block lg:hidden xl:inline-block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              ruang berteman, tempat bertumbuh
            </span>
          </span>
        </Link>

        <LiquidNavbar
          items={navItems}
          active={activeIdx}
          tone={mounted && theme === "dark" ? "dark" : "light"}
          className="hidden lg:inline-flex shrink-0"
        />

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {sessionRole ? (
            <Link
              href={dashboardHref}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm clay-btn-primary"
            >
              {sessionRole === "ADMIN" ? "Dashboard Admin" : "Dashboard Siswa"}
            </Link>
          ) : (
            <Link
              href="/daftar"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm clay-btn-primary"
            >
              Mulai Belajar
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileOpen}
            className="lg:hidden p-2.5 rounded-full bg-white/60 dark:bg-slate-800/80 border border-white/70 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/40 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href || "");
            return (
              <Link
                key={item.href}
                href={item.href || "/"}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
          {sessionRole && (
            <Link
              href={dashboardHref}
              onClick={() => setMobileOpen(false)}
              className="block text-center w-full py-3 text-sm clay-btn-primary mt-2"
            >
              {sessionRole === "ADMIN" ? "Buka Dashboard Admin" : "Buka Dashboard Siswa"}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
