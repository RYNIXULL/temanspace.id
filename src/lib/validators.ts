import { z } from "zod";

/**
 * Normalize and sanitize plain text inputs to avoid stray control characters
 * and excessive whitespace without corrupting Indonesian punctuation.
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .transform(sanitizeText)
      .pipe(
        z
          .string()
          .min(2, "Nama tampilan minimal 2 karakter.")
          .max(80, "Nama tampilan maksimal 80 karakter.")
      ),
    email: z
      .string()
      .transform((v) => sanitizeText(v).toLowerCase())
      .pipe(z.email("Format email tidak valid.").max(120)),
    gradeLevel: z.enum(["7", "8", "9"], {
      error: "Pilih tingkat kelas SMP (7, 8, atau 9).",
    }),
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter.")
      .max(128, "Kata sandi maksimal 128 karakter.")
      .regex(/[A-Za-z]/, "Kata sandi harus mengandung minimal satu huruf.")
      .regex(/[0-9]/, "Kata sandi harus mengandung minimal satu angka."),
    confirmPassword: z.string(),
    reasonNote: z
      .string()
      .optional()
      .transform((v) => (v ? sanitizeText(v) : ""))
      .pipe(z.string().max(300, "Catatan maksimal 300 karakter.")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .transform((v) => sanitizeText(v).toLowerCase())
    .pipe(z.email("Masukkan alamat email yang valid.")),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const registrationStatusLookupSchema = z.object({
  email: z
    .string()
    .transform((v) => sanitizeText(v).toLowerCase())
    .pipe(z.email("Masukkan alamat email yang valid.")),
  referenceCode: z
    .string()
    .transform((v) => sanitizeText(v).toUpperCase())
    .pipe(
      z
        .string()
        .min(5, "Kode referensi pendaftaran wajib diisi.")
        .max(24, "Kode referensi terlalu panjang.")
    ),
});

export const registrationDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reviewNote: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeText(v) : ""))
    .pipe(z.string().max(300, "Catatan keputusan maksimal 300 karakter.")),
});

export const studentProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, "Nama minimal 2 karakter.").max(80)),
  gradeLevel: z.enum(["7", "8", "9"]),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter.")
      .max(128)
      .regex(/[A-Za-z]/, "Kata sandi baru harus mengandung huruf.")
      .regex(/[0-9]/, "Kata sandi baru harus mengandung angka."),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Konfirmasi kata sandi baru tidak cocok.",
    path: ["confirmNewPassword"],
  });

export const adminUserUpdateSchema = z.object({
  fullName: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2).max(80))
    .optional(),
  gradeLevel: z.enum(["7", "8", "9"]).nullable().optional(),
  status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, "Nama kategori minimal 2 karakter.").max(80)),
  slug: z
    .string()
    .transform((v) => slugify(v))
    .pipe(z.string().min(2, "Slug kategori minimal 2 karakter.").max(80))
    .optional(),
  description: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(5, "Deskripsi minimal 5 karakter.").max(400)),
  iconName: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(1).max(40))
    .default("book-open"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});

export const materialSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih."),
  title: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(3, "Judul materi minimal 3 karakter.").max(140)),
  slug: z
    .string()
    .transform((v) => slugify(v))
    .pipe(z.string().min(2).max(100))
    .optional(),
  summary: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(10, "Ringkasan minimal 10 karakter.").max(500)),
  content: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(20, "Isi materi minimal 20 karakter.").max(20000)),
  keyPoints: z.array(z.string().transform(sanitizeText).pipe(z.string().min(1).max(300))).default([]),
  examples: z
    .array(
      z.object({
        situation: z.string().transform(sanitizeText).pipe(z.string().min(1).max(300)),
        response: z.string().transform(sanitizeText).pipe(z.string().min(1).max(500)),
      })
    )
    .default([]),
  readingMinutes: z.coerce.number().int().min(1).max(60).default(5),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});

export const quizSchema = z.object({
  categoryId: z.string().nullable().optional(),
  title: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(3, "Judul minimal 3 karakter.").max(140)),
  slug: z
    .string()
    .transform((v) => slugify(v))
    .pipe(z.string().min(2).max(100))
    .optional(),
  description: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(10, "Deskripsi minimal 10 karakter.").max(600)),
  type: z.enum(["QUIZ", "SCENARIO"]).default("QUIZ"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});

export const quizOptionInputSchema = z.object({
  id: z.string().optional(),
  label: z
    .string()
    .transform((v) => sanitizeText(v).toUpperCase())
    .pipe(z.string().min(1).max(4)),
  optionText: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, "Teks pilihan minimal 2 karakter.").max(400)),
  isRecommended: z.boolean().default(false),
  feedbackText: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(4, "Penjelasan edukatif minimal 4 karakter.").max(600)),
  sortOrder: z.coerce.number().int().min(0).max(20).default(0),
});

export const quizQuestionSchema = z.object({
  prompt: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(5, "Pertanyaan minimal 5 karakter.").max(800)),
  scenarioContext: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? sanitizeText(v) : null)),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  options: z
    .array(quizOptionInputSchema)
    .min(2, "Minimal harus ada 2 pilihan jawaban.")
    .max(6, "Maksimal 6 pilihan jawaban."),
});

export const quizAttemptSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionId: z.string().min(1),
      })
    )
    .min(1, "Pilih jawaban untuk minimal satu pertanyaan."),
});

export const helpResourceSchema = z.object({
  title: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(3, "Judul panduan minimal 3 karakter.").max(140)),
  audienceScope: z.enum(["SCHOOL", "HOME", "SAFETY_STEPS"]),
  summary: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(10, "Ringkasan minimal 10 karakter.").max(500)),
  whenToReachOut: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(5, "Kapan menghubungi minimal 5 karakter.").max(600)),
  steps: z.array(z.string().transform(sanitizeText).pipe(z.string().min(2).max(400))).min(1),
  contactRole: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, "Pihak yang dihubungi minimal 2 karakter.").max(120)),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});
