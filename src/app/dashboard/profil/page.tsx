import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ProfileEditor } from "@/components/student/profile-editor";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <ProfileEditor
      initialFullName={user.fullName}
      email={user.email}
      initialGradeLevel={user.gradeLevel}
      roleCode={user.roleCode}
    />
  );
}
