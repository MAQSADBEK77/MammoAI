import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "MammoAI — Ko'krak saratonini erta aniqlash tizimi",
  description:
    "MammoAI — ko'krak saratoni xavf omillarini onlayn baholash, shaxsiy kabinet va tibbiy nazorat tizimi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
