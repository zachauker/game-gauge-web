"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
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
  Menu, 
  X, 
  Search, 
  Home, 
  User, 
  LogOut, 
  Settings,
  List,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

export function Navbar() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "GG";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">G</span>
            </div>
            <span className="hidden font-bold text-xl sm:inline-block">
              <span className="text-primary">Game</span> Gauge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  href="/"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Home
                </Link>
                <Link
                  href="/search"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Search
                </Link>
                <Link
                  href="/lists"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  My Lists
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Home
                </Link>
                <Link
                  href="/search"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Browse Games
                </Link>
                <Link
                  href="/lists"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  My Lists
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hidden md:inline-flex"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Search Button (Desktop) */}
            <Link href="/search" className="hidden md:inline-flex">
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </Link>

            {/* User Menu or Auth Buttons */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${user.username}`} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/lists" className="cursor-pointer">
                      <List className="mr-2 h-4 w-4" />
                      My Lists
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex md:items-center md:space-x-2">
                <Link href="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/search"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </Link>
                  <Link
                    href="/lists"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <List className="h-4 w-4" />
                    <span>My Lists</span>
                  </Link>
                    <Link
                      href={`/users/${user?.username}`}
                      className="flex items-center space-x-2 text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center space-x-2 text-sm font-medium"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                  <Link
                    href="/search"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Search className="h-4 w-4" />
                    <span>Browse Games</span>
                  </Link>
                  <Link
                    href="/lists"
                    className="flex items-center space-x-2 text-sm font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <List className="h-4 w-4" />
                    <span>My Lists</span>
                  </Link>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center space-x-2 text-sm font-medium"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                  <div className="flex flex-col space-y-2 pt-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">Sign up</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
