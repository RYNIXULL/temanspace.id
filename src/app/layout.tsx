import type { Metadata } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "TEMANSPACE.ID — Ruang Berteman, Tempat Bertumbuh",
    template: "%s | TEMANSPACE.ID",
  },
  description:
    "Media layanan bimbingan dan konseling sosial berbasis website untuk edukasi pertemanan sehat bagi siswa Sekolah Menengah Pertama (SMP).",
  icons: {
    icon: "/images/temanspace-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F0F5FA] dark:bg-[#090F1D] text-[#1E293B] dark:text-[#F1F5F9]">
        <ThemeProvider storageKey="temanspace_theme_mode">
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
