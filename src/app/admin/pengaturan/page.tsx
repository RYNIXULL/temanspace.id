import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AdminSettingsEditor } from "@/components/admin/admin-settings-editor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await getSessionUser();
  if (!user || user.roleCode !== "ADMIN") redirect("/login");

  return (
    <AdminSettingsEditor initialFullName={user.fullName} email={user.email} />
  );
}
