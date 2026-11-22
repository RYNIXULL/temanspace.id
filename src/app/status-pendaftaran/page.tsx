import React from "react";
import { getSessionUser } from "@/lib/session";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { RegistrationStatusChecker } from "@/components/auth/registration-status-checker";

export const dynamic = "force-dynamic";

export default async function RegistrationStatusPage() {
  const sessionUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F0F5FA] via-[#F7FAFE] to-[#EAF3FC] dark:from-[#090F1D] dark:via-[#0B1325] dark:to-[#090F1D]">
      <PublicHeader sessionRole={sessionUser?.roleCode ?? null} />
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <RegistrationStatusChecker />
      </main>
      <PublicFooter />
    </div>
  );
}
