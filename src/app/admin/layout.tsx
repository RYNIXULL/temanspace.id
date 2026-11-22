import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import {
  DashboardShell,
  type SidebarLinkItem,
} from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.roleCode !== "ADMIN") {
    redirect("/dashboard");
  }

  const links: SidebarLinkItem[] = [
    {
      label: "Overview Dashboard",
      href: "/admin",
      iconKey: "dashboard",
      exact: true,
    },
    {
      label: "Persetujuan Pendaftaran",
      href: "/admin/persetujuan",
      iconKey: "persetujuan",
    },
    {
      label: "Manajemen Akun Siswa",
      href: "/admin/siswa",
      iconKey: "siswa",
    },
    {
      label: "Kategori Materi",
      href: "/admin/kategori",
      iconKey: "kategori",
    },
    {
      label: "Manajemen Materi",
      href: "/admin/materi",
      iconKey: "kelola-materi",
    },
    {
      label: "Manajemen Kuis",
      href: "/admin/kuis",
      iconKey: "kuis",
    },
    {
      label: "Manajemen Skenario",
      href: "/admin/skenario",
      iconKey: "skenario",
    },
    {
      label: "Panduan Bantuan",
      href: "/admin/bantuan",
      iconKey: "bantuan",
    },
    {
      label: "Audit Log",
      href: "/admin/audit-log",
      iconKey: "audit",
    },
    {
      label: "Pengaturan Akun",
      href: "/admin/pengaturan",
      iconKey: "pengaturan",
    },
  ];

  return (
    <DashboardShell mode="admin" user={user} links={links}>
      {children}
    </DashboardShell>
  );
}
