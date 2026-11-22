"use client";

import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export interface MaterialViewItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  keyPoints: string[];
  examples: Array<{ situation: string; response: string }>;
  readingMinutes: number;
  isCompleted: boolean;
}

export function AssertiveSentenceBuilder() {
  const toast = useToast();
  const [feeling, setFeeling] = useState("tidak nyaman");
  const [eventText, setEventText] = useState(
    "namaku dijadikan bahan ejekan di depan teman-teman"
  );
  const [reasonText, setReasonText] = useState(
    "hal itu membuatku merasa malu dan tertekan"
  );
  const [hopeText, setHopeText] = useState(
    "kamu memanggilku dengan namaku saja mulai sekarang"
  );

  const builtSentence = `Aku merasa ${feeling || "..."} ketika ${
    eventText || "..."
  }, karena ${reasonText || "..."}. Aku berharap ${hopeText || "..."}.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(builtSentence);
      toast.success("Kalimat Disalin", "Contoh kalimat asertif siap kamu latih.");
    } catch {
      toast.info("Kalimat Asertif", builtSentence);
    }
  };

  return (
    <div className="clay-card p-6 sm:p-7 border-2 border-sky-200/80 dark:border-sky-500/30 space-y-4">
      <div>
        <span className="clay-badge inline-flex items-center gap-1.5 px-3 py-1 text-xs mb-2">
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Latihan Interaktif</span>
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Susun Kalimat Asertif: &ldquo;Aku Merasa... Ketika...&rdquo;
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Coba ubah bagian di bawah ini untuk berlatih menyampaikan perasaanmu
          dengan jelas tanpa menyalahkan atau menyerang teman.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="assert-feeling"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
          >
            1. Aku merasa...
          </label>
          <input
            id="assert-feeling"
            type="text"
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            className="clay-inset w-full px-3.5 py-2 text-sm"
            placeholder="sedih / kecewa / tidak nyaman"
          />
        </div>
        <div>
          <label
            htmlFor="assert-event"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
          >
            2. Ketika... (kejadian spesifik)
          </label>
          <input
            id="assert-event"
            type="text"
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            className="clay-inset w-full px-3.5 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="assert-reason"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
          >
            3. Karena... (dampaknya bagimu)
          </label>
          <input
            id="assert-reason"
            type="text"
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            className="clay-inset w-full px-3.5 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="assert-hope"
            className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
          >
            4. Aku berharap... (permintaan jelas)
          </label>
          <input
            id="assert-hope"
            type="text"
            value={hopeText}
            onChange={(e) => setHopeText(e.target.value)}
            className="clay-inset w-full px-3.5 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-sky-50/90 dark:bg-slate-800/90 border border-sky-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
          &ldquo;{builtSentence}&rdquo;
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="clay-btn-secondary px-4 py-2 text-xs shrink-0"
        >
          Salin Kalimat
        </button>
      </div>
    </div>
  );
}

export function MaterialReader({
  materials,
  showAssertiveBuilder,
}: {
  materials: MaterialViewItem[];
  showAssertiveBuilder: boolean;
}) {
  const toast = useToast();
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(materials.map((m) => [m.id, m.isCompleted]))
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleMarkDone = async (id: string, title: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/student/materials/${id}/progress`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error("Gagal Menyimpan", data.error || "Coba beberapa saat lagi.");
        return;
      }
      setCompletedIds((prev) => ({ ...prev, [id]: true }));
      toast.success("Progres Disimpan", `Materi "${title}" ditandai sudah dibaca.`);
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menyimpan progres bacaan.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {materials.length === 0 ? (
        <div className="clay-card p-8 text-center text-sm text-slate-600 dark:text-slate-300">
          Belum ada modul materi yang diterbitkan pada topik ini.
        </div>
      ) : (
        materials.map((item, idx) => {
          const isDone = Boolean(completedIds[item.id]);
          const paragraphs = item.content
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean);

          return (
            <article
              key={item.id}
              id={item.id}
              className="clay-card p-6 sm:p-8 space-y-5 scroll-mt-24"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="clay-badge px-3 py-1 text-xs">
                    Modul {idx + 1}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.readingMinutes} menit baca</span>
                  </span>
                </div>

                {isDone ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sudah Dibaca</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleMarkDone(item.id, item.title)}
                    className="clay-btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      {busyId === item.id ? "Menyimpan..." : "Tandai Sudah Dibaca"}
                    </span>
                  </button>
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="text-sm text-sky-700 dark:text-sky-300 font-medium mt-1">
                  {item.summary}
                </p>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                {paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="whitespace-pre-line">
                    {p}
                  </p>
                ))}
              </div>

              {item.keyPoints.length > 0 && (
                <div className="rounded-2xl bg-sky-50/75 dark:bg-slate-800/75 border border-sky-200/80 dark:border-slate-700 p-5 space-y-2.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Poin Utama yang Perlu Diingat
                  </p>
                  <ul className="space-y-2">
                    {item.keyPoints.map((kp, kpIdx) => (
                      <li
                        key={kpIdx}
                        className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.examples.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Contoh Situasi & Respons Sehat
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {item.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 p-4 space-y-2"
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Situasi
                        </p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {ex.situation}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400 pt-1">
                          Contoh Respons
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                          {ex.response}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}

      {showAssertiveBuilder && <AssertiveSentenceBuilder />}
    </div>
  );
}
