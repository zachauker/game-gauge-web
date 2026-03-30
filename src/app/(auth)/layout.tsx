import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: brand / marketing ── */}
      <div className="hidden lg:flex lg:flex-col lg:w-[440px] lg:shrink-0 bg-brand-purple/20 border-r border-brand-purple/20 relative overflow-hidden px-12 py-10">

        {/* Subtle background texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #FEF3F9 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10 w-fit">
          <div className="h-8 w-8 rounded-lg bg-brand-purple flex items-center justify-center overflow-hidden">
            <Image
              src="/images/logo/logo-mark-transparent.png"
              alt="GameGauge"
              width={26}
              height={26}
              className="object-contain mb-0.5"
            />
          </div>
          <span className="font-flexing text-[16px] tracking-wide text-foreground/80">
            GameGauge
          </span>
        </Link>

        {/* Main copy — vertically centred */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <p className="text-[11px] uppercase tracking-[0.12em] text-brand-amber mb-4">
            Your gaming journal
          </p>
          <h2 className="text-2xl font-medium tracking-tight text-foreground leading-snug mb-4">
            Every game you've played.
            <br />
            <span className="text-foreground/40">Remembered.</span>
          </h2>
          <p className="text-[13px] text-foreground/40 leading-relaxed max-w-[280px]">
            Track your library, write reviews backed by real playtime, and
            discover what to play next.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-3">
            {[
              "Sync your Steam library automatically",
              "Rate and review games you've actually played",
              "Build lists and share with friends",
              "Track hours, achievements, and completion",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-teal shrink-0" />
                <span className="text-[12px] text-foreground/40">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom attribution */}
        <p className="text-[11px] text-foreground/20 relative z-10">
          Game data powered by IGDB
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo — only visible on small screens */}
        <div className="lg:hidden px-6 pt-6">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="h-7 w-7 rounded-md bg-brand-purple flex items-center justify-center overflow-hidden">
              <Image
                src="/images/logo/logo-mark-transparent.png"
                alt="GameGauge"
                width={22}
                height={22}
                className="object-contain mb-0.5"
              />
            </div>
            <span className="font-flexing text-[15px] tracking-wide text-foreground/80">
              GameGauge
            </span>
          </Link>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}