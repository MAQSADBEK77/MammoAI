import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthShell({
  children,
  footerText,
  footerLinkText,
  footerHref,
}: {
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, rgba(59,130,246,0.25), transparent 70%)",
        }}
      />
      <div className="animate-fade-in-up relative w-full max-w-md">
        <div className="mb-8">
          <Logo size="md" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-blue-200/70">
          {footerText}{" "}
          <Link href={footerHref} className="font-semibold text-blue-300 hover:text-blue-200">
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
