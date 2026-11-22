import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import {
  DashboardShell,
  type SidebarLinkItem,
} from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const categories = await prisma.materialCategory.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, iconName: true },
  });

  const links: SidebarLinkItem[] = [
    {
      label: "Ringkasan Belajar",
      href: "/dashboard",
      iconKey: "dashboard",
      exact: true,
    },
    ...categories.map((cat) => ({
      label: cat.name,
      href: `/dashboard/materi/${cat.slug}`,
      iconKey: cat.iconName,
    })),
    {
      label: "Semua Materi",
      href: "/dashboard/materi",
      iconKey: "materi",
      exact: true,
    },
    {
      label: "Kuis dan Skenario",
      href: "/dashboard/kuis",
      iconKey: "kuis",
    },
    {
      label: "Panduan Mencari Bantuan",
      href: "/dashboard/bantuan",
      iconKey: "bantuan",
    },
    {
      label: "Profil Saya",
      href: "/dashboard/profil",
      iconKey: "profil",
    },
  ];

  return (
    <DashboardShell mode="student" user={user} links={links}>
      {children}
    </DashboardShell>
  );
}
