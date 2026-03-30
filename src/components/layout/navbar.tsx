"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  User,
  LogOut,
  Settings,
  List,
  Gamepad2,
  X,
  Menu,
  ChevronRight,
} from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const hasSteam = !!(user as any)?.steamId;

  // Elevated border on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return "GG";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const isActive = (href: string) => pathname === href;

  const navLinks = isAuthenticated
    ? [
        { href: "/", label: "Home" },
        { href: "/search", label: "Games" },
        { href: "/lists", label: "Lists" },
        { href: "/journal", label: "Journal" },
        ...(hasSteam ? [{ href: "/steam/library", label: "Steam" }] : []),
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/search", label: "Browse Games" },
      ];

  return (
    <>
      <nav
        className={`
          sticky top-0 z-50 w-full
          bg-background/95 backdrop-blur-md
          transition-all duration-200
          ${scrolled
            ? "border-b border-brand-purple/30 shadow-[0_1px_12px_0_rgba(77,64,117,0.2)]"
            : "border-b border-brand-purple/20"
          }
        `}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-6">

            {/* ── Logo ── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <div className="h-8 w-8 rounded-lg bg-brand-purple flex items-center justify-center transition-colors group-hover:bg-brand-purple/80 overflow-hidden mb-3">
                <Image
                  src="/images/logo/logo-mark-transparent.png"
                  alt="GameGauge mark"
                  width={28}
                  height={28}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="hidden sm:block font-flexing text-[17px] tracking-wide text-foreground">
                Game<span style={{ opacity: 0.6 }}>Gauge</span>
              </span>
            </Link>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`
                    px-3 py-1.5 rounded-md text-[13px] transition-colors
                    ${isActive(href)
                      ? "text-brand-amber font-medium"
                      : "text-foreground/50 hover:text-foreground/80"
                    }
                  `}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* ── Right Side ── */}
            <div className="flex items-center gap-2 ml-auto">

              {/* Search trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="
                  hidden md:flex items-center gap-2
                  bg-brand-purple/10 hover:bg-brand-purple/20
                  border border-brand-purple/25 hover:border-brand-purple/40
                  rounded-full px-3.5 py-1.5
                  text-[12px] text-foreground/40 hover:text-foreground/60
                  transition-all duration-150 cursor-pointer
                "
              >
                <Search className="h-3 w-3" />
                <span>Search games…</span>
                <kbd className="hidden lg:inline-block text-[10px] bg-brand-purple/20 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
              </button>

              {/* Authenticated user menu */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full ring-1 ring-brand-purple/30 hover:ring-brand-purple/60 transition-all">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar ?? undefined} alt={user.username} />
                        <AvatarFallback className="bg-brand-purple text-[11px] font-medium text-foreground/90">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-background border-brand-purple/20"
                  >
                    <DropdownMenuLabel className="pb-2">
                      <p className="text-sm font-medium text-foreground">{user.username}</p>
                      <p className="text-xs text-foreground/40 font-normal mt-0.5">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-brand-purple/15" />
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${user.username}`} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4 text-foreground/40" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/lists" className="cursor-pointer">
                        <List className="mr-2 h-4 w-4 text-foreground/40" />
                        My Lists
                      </Link>
                    </DropdownMenuItem>
                    {hasSteam && (
                      <DropdownMenuItem asChild>
                        <Link href="/steam/library" className="cursor-pointer">
                          <Gamepad2 className="mr-2 h-4 w-4 text-foreground/40" />
                          Steam Library
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4 text-foreground/40" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-brand-purple/15" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-brand-red focus:text-brand-red focus:bg-brand-red/5"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-[13px] text-foreground/50 hover:text-foreground/80 px-3 py-1.5 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="text-[13px] font-medium bg-brand-purple hover:bg-brand-purple/80 text-foreground px-4 py-1.5 rounded-md transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-md text-foreground/50 hover:text-foreground/80 hover:bg-brand-purple/10 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-brand-purple/20 bg-background">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">

              {/* Mobile search */}
              <form onSubmit={handleSearchSubmit} className="mb-3">
                <div className="flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/25 rounded-lg px-3 py-2">
                  <Search className="h-4 w-4 text-foreground/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search games…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground/30 outline-none"
                  />
                </div>
              </form>

              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] transition-colors
                    ${isActive(href)
                      ? "text-brand-amber bg-brand-amber/5 font-medium"
                      : "text-foreground/60 hover:text-foreground hover:bg-brand-purple/10"
                    }
                  `}
                >
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 opacity-30" />
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <div className="h-px bg-brand-purple/15 my-2" />
                  <Link
                    href={`/users/${user?.username}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-foreground/60 hover:text-foreground hover:bg-brand-purple/10 transition-colors"
                  >
                    <User className="h-4 w-4 opacity-50" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-foreground/60 hover:text-foreground hover:bg-brand-purple/10 transition-colors"
                  >
                    <Settings className="h-4 w-4 opacity-50" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] text-brand-red hover:bg-brand-red/5 transition-colors w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <div className="h-px bg-brand-purple/15 my-2" />
                  <Link
                    href="/login"
                    className="px-3 py-2.5 rounded-md text-[13px] text-foreground/60 hover:text-foreground hover:bg-brand-purple/10 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-2.5 rounded-md text-[13px] font-medium bg-brand-purple hover:bg-brand-purple/80 text-foreground transition-colors text-center"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Search Overlay ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="container mx-auto px-4 pt-24"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-xl mx-auto"
            >
              <div className="flex items-center gap-3 bg-background border border-brand-purple/40 rounded-xl px-4 py-3 shadow-[0_0_0_4px_hsl(var(--brand-purple)/0.1)]">
                <Search className="h-4 w-4 text-foreground/40 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a game…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-foreground/30 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors"
                >
                  esc
                </button>
              </div>
              <p className="text-center text-[12px] text-foreground/30 mt-3">
                Press enter to search or esc to close
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}