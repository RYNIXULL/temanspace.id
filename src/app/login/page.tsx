import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    redirect(sessionUser.roleCode === "ADMIN" ? "/admin" : "/dashboard");
  }

  const resolvedParams = await searchParams;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F0F5FA] via-[#F7FAFE] to-[#EAF3FC] dark:from-[#090F1D] dark:via-[#0B1325] dark:to-[#090F1D]">
      <PublicHeader sessionRole={null} />
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <LoginForm nextPath={resolvedParams.next} />
      </main>
      <PublicFooter />
    </div>
  );
}
