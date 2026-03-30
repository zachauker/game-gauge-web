"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SteamLoginButton } from "@/components/auth/steam-login-button";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login", data);
      const { user, token } = response.data.data;
      setAuth(user, token);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-7">

      {/* Heading */}
      <div>
        <h1 className="text-[22px] font-medium tracking-tight text-foreground mb-1.5">
          Welcome back
        </h1>
        <p className="text-[13px] text-foreground/40">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Sign up free
          </Link>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-brand-red/10 border border-brand-red/20 px-4 py-3 text-[12px] text-brand-red">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground/60" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            disabled={isLoading}
            className="w-full bg-card border border-brand-purple/20 hover:border-brand-purple/40 focus:border-brand-purple/60 rounded-lg px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-foreground/25 outline-none transition-colors disabled:opacity-50"
          />
          {errors.email && (
            <p className="text-[11px] text-brand-red mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground/60" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              disabled={isLoading}
              className="w-full bg-card border border-brand-purple/20 hover:border-brand-purple/40 focus:border-brand-purple/60 rounded-lg px-3.5 py-2.5 pr-10 text-[13px] text-foreground placeholder:text-foreground/25 outline-none transition-colors disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
              tabIndex={-1}
            >
              {showPassword
                ? <EyeOff className="h-4 w-4" />
                : <Eye className="h-4 w-4" />
              }
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-brand-red mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-50 text-foreground font-medium text-[13px] rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-brand-purple/15" />
        <span className="text-[11px] text-foreground/25 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-brand-purple/15" />
      </div>

      {/* Steam SSO */}
      <SteamLoginButton />

    </div>
  );
}