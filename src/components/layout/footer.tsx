import Link from "next/link";
import Image from "next/image";
import { X, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-brand-purple/20 bg-background mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* ── Brand ── */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="h-7 w-7 rounded-md bg-brand-purple flex items-center justify-center overflow-hidden mb-2">
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
            <p className="text-[12px] text-foreground/35 leading-relaxed max-w-[200px]">
              A journal for your gaming life. Track, review, and discuss the games that matter.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/25 hover:text-foreground/60 transition-colors"
                aria-label="GitHub"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/25 hover:text-foreground/60 transition-colors"
                aria-label="Twitter"
              >
                <X className="h-4 w-4" />
              </a>
              <a
                href="mailto:contact@gamegauge.app"
                className="text-foreground/25 hover:text-foreground/60 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* ── Discover ── */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/35">
              Discover
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/search", label: "Browse Games" },
                { href: "/search?sort=popular", label: "Popular" },
                { href: "/search?sort=recent", label: "New Releases" },
                { href: "/lists/public", label: "Community Lists" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[12px] text-foreground/40 hover:text-foreground/70 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Account ── */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/35">
              Account
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/register", label: "Create account" },
                { href: "/login", label: "Sign in" },
                { href: "/settings", label: "Settings" },
                { href: "/settings#steam", label: "Connect Steam" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[12px] text-foreground/40 hover:text-foreground/70 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── About ── */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/35">
              About
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About GameGauge" },
                { href: "/privacy", label: "Privacy policy" },
                { href: "/terms", label: "Terms of service" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[12px] text-foreground/40 hover:text-foreground/70 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-brand-purple/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-foreground/25">
            © {new Date().getFullYear()} GameGauge. All rights reserved.
          </p>
          <p className="text-[11px] text-foreground/20">
            Game data provided by{" "}
            <a
              href="https://www.igdb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/40 transition-colors"
            >
              IGDB
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}