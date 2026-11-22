import React from "react";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Home,
  LifeBuoy,
  School,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudentHelpGuidePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const resources = await prisma.helpResource.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  const renderScopeBadge = (scope: string) => {
    switch (scope) {
      case "SCHOOL":
        return (
          <span className="clay-badge inline-flex items-center gap-1.5 px-3 py-1 text-xs">
            <School className="w-3.5 h-3.5" />
            <span>Lingkungan Sekolah</span>
          </span>
        );
      case "HOME":
        return (
          <span className="clay-badge inline-flex items-center gap-1.5 px-3 py-1 text-xs">
            <Home className="w-3.5 h-3.5" />
            <span>Lingkungan Rumah</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Langkah Keselamatan</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-4">
          <div className="clay-icon-box p-3.5 shrink-0 text-rose-500">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Panduan Mencari Bantuan
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Kamu tidak harus menghadapi pengucilan, ancaman, atau perundungan
              sendirian. Meminta bantuan kepada orang dewasa yang tepat adalah
              tindakan berani untuk menjaga keselamatanmu.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-700/50 p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-950 dark:text-amber-200">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Penting Diketahui:</strong> TEMANSPACE.ID adalah media
            edukasi, bukan pengganti Guru BK atau layanan konseling profesional.
            Aplikasi ini tidak menjanjikan kerahasiaan mutlak apabila
            keselamatanmu atau orang lain terancam—segera ceritakan kepada Guru
            BK, wali kelas, atau orang tua/wali.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {resources.map((res) => {
          const steps = JSON.parse(res.stepsJson || "[]") as string[];
          return (
            <article key={res.id} className="clay-card p-6 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {renderScopeBadge(res.audienceScope)}
                <span className="text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                  Hubungi: {res.contactRole}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {res.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {res.summary}
                </p>
              </div>

              <div className="rounded-2xl bg-sky-50/80 dark:bg-slate-800/75 border border-sky-200/70 dark:border-slate-700 p-4 space-y-1">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                  Kapan Perlu Menghubungi?
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {res.whenToReachOut}
                </p>
              </div>

              {steps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Langkah yang Dapat Kamu Lakukan
                  </p>
                  <ul className="space-y-2">
                    {steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
