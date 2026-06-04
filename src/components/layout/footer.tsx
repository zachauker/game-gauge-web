import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Mail } from "lucide-react";

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
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/25 hover:text-foreground/60 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
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