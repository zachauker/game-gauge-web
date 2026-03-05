"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface SteamLoginButtonProps {
  /** "signin" for login page, "link" for settings page (linking existing account) */
  mode?: "signin" | "link";
  /** Custom class name */
  className?: string;
}

/**
 * "Sign in with Steam" button.
 *
 * In "signin" mode, redirects the user to the Steam OpenID login page.
 * In "link" mode, passes the user's existing JWT so the backend can
 * link the Steam account to their current Game Gauge account.
 */
export function SteamLoginButton({
  mode = "signin",
  className,
}: SteamLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();

  const handleClick = () => {
    setIsLoading(true);

    let url = `${API_URL}/api/auth/steam`;

    if (mode === "link" && token) {
      const params = new URLSearchParams({
        linkMode: "true",
        token: token,
      });
      url = `${url}?${params.toString()}`;
    }

    // Navigate the full page to the Steam auth endpoint
    // (Steam requires a full page redirect — no iframes or popups)
    window.location.href = url;
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full gap-2 ${className || ""}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <SteamIcon className="h-5 w-5" />
      )}
      {mode === "link" ? "Link Steam Account" : "Sign in with Steam"}
    </Button>
  );
}

/**
 * Steam logo icon (simplified SVG).
 * Valve provides official "Sign in through Steam" button images,
 * but a clean icon works well inside our existing button component.
 */
function SteamIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .128.003.19.007l2.862-4.146V8.9a4.482 4.482 0 0 1 4.482-4.482 4.482 4.482 0 0 1 4.482 4.482 4.482 4.482 0 0 1-4.482 4.482h-.104l-4.08 2.91c0 .074.004.148.004.224a3.376 3.376 0 0 1-3.376 3.376 3.39 3.39 0 0 1-3.331-2.806L.309 13.27A12.018 12.018 0 0 0 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zM7.54 18.21l-1.473-.61a2.535 2.535 0 0 0 4.817-.737 2.534 2.534 0 0 0-2.47-2.533l1.522.63a1.867 1.867 0 1 1-2.396 3.25zm8.36-5.598a2.988 2.988 0 0 0 2.988-2.989 2.988 2.988 0 0 0-2.988-2.988 2.988 2.988 0 0 0-2.989 2.988 2.99 2.99 0 0 0 2.989 2.989zm-.001-4.984a1.997 1.997 0 1 1 0 3.994 1.997 1.997 0 0 1 0-3.994z" />
    </svg>
  );
}
