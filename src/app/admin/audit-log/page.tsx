import React from "react";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const user = await getSessionUser();
  if (!user || user.roleCode !== "ADMIN") redirect("/login");

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: { fullName: true, email: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7 flex items-start gap-4">
        <div className="clay-icon-box p-3 shrink-0">
          <ScrollText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Audit Log Aktivitas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Catatan kronologis persetujuan pendaftaran, perubahan status akun,
            login, serta pengelolaan materi, kuis, dan panduan bantuan.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="clay-card p-8 text-center text-sm text-slate-500">
            Belum ada catatan aktivitas.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="clay-card p-4 sm:p-5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                    {log.action}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {log.targetType} • {log.targetId}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(log.createdAt).toLocaleString("id-ID")}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                Pelaku: <strong>{log.actor?.fullName || "Sistem"}</strong>{" "}
                {log.actor?.email ? `(${log.actor.email})` : ""}
                {log.ipAddress ? ` • IP: ${log.ipAddress}` : ""}
              </p>

              {log.metadata && log.metadata !== "{}" && (
                <pre className="text-[11px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 rounded-xl p-2.5 overflow-x-auto text-slate-600 dark:text-slate-300">
                  {log.metadata}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
