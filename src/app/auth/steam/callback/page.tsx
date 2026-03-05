"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SteamCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    const linked = searchParams.get("linked");
    const isNewUser = searchParams.get("isNewUser") === "true";

    // Handle errors from the Steam callback
    if (error) {
      setStatus("error");
      setErrorMessage(
        decodeURIComponent(error).replace(/_/g, " ")
      );

      // Auto-redirect to login after a few seconds
      setTimeout(() => {
        router.push(`/login?error=${encodeURIComponent(error)}`);
      }, 3000);
      return;
    }

    // Handle account linking success
    if (linked === "true") {
      // Redirect to settings/profile with success message
      router.push("/settings?steamLinked=true");
      return;
    }

    // Handle sign-in / sign-up — we have a token
    if (token) {
      handleTokenAuth(token, isNewUser);
      return;
    }

    // Fallback — no recognizable params
    setStatus("error");
    setErrorMessage("No authentication data received from Steam.");
    setTimeout(() => router.push("/login"), 3000);
  }, [searchParams, router, setAuth]);

  const handleTokenAuth = async (token: string, isNewUser: boolean) => {
    try {
      // Store the token temporarily so the API client uses it
      localStorage.setItem("token", token);

      // Fetch the full user profile from the API
      const response = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = response.data.data;

      // Update Zustand auth store
      setAuth(user, token);

      // Redirect based on whether this is a new user
      if (isNewUser) {
        // New Steam user — send them to complete their profile
        router.push("/settings?welcome=true");
      } else {
        // Returning user — send to home
        router.push("/");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        "Failed to complete sign-in. Please try again."
      );
      localStorage.removeItem("token");

      setTimeout(() => router.push("/login"), 3000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" ? (
            <>
              <CardTitle className="text-xl">
                Completing Steam Sign-In
              </CardTitle>
              <CardDescription>
                Please wait while we verify your Steam account...
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-xl text-destructive">
                Steam Sign-In Failed
              </CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          {status === "loading" ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Redirecting you back to login...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap in Suspense because useSearchParams() needs it in Next.js App Router
export default function SteamCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SteamCallbackContent />
    </Suspense>
  );
}
