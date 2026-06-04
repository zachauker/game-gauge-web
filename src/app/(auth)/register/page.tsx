"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(30, "Max 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must include uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-brand-red mt-1">{message}</p>;
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await api.post("/auth/register", registerData);
      const { user, token } = response.data.data;
      setAuth(user, token);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full bg-card border border-brand-purple/20 hover:border-brand-purple/40 focus:border-brand-purple/60 rounded-lg px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-foreground/25 outline-none transition-colors disabled:opacity-50";

  const labelClass = "text-[12px] font-medium text-foreground/60";

  return (
    <div className="space-y-7">

      {/* Heading */}
      <div>
        <h1 className="text-[22px] font-medium tracking-tight text-foreground mb-1.5">
          Create your account
        </h1>
        <p className="text-[13px] text-foreground/40">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground/70 hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Sign in
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

        {/* Email */}
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="email">
            Email <span style={{ color: "#E30613" }}>*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            disabled={isLoading}
            className={inputClass}
          />
          <FieldError message={errors.email?.message} />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="username">
            Username <span style={{ color: "#E30613" }}>*</span>
          </label>
          <input
            id="username"
            type="text"
            placeholder="johndoe"
            autoComplete="username"
            {...register("username")}
            disabled={isLoading}
            className={inputClass}
          />
          <FieldError message={errors.username?.message} />
        </div>

        {/* First + last name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              {...register("firstName")}
              disabled={isLoading}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              {...register("lastName")}
              disabled={isLoading}
              className={inputClass}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="password">
            Password <span style={{ color: "#E30613" }}>*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
              disabled={isLoading}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
          {!errors.password && (
            <p className="text-[11px] text-foreground/30">
              Min. 8 characters with uppercase, lowercase, and a number
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="confirmPassword">
            Confirm password <span style={{ color: "#E30613" }}>*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
              disabled={isLoading}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-purple hover:bg-brand-purple/80 disabled:opacity-50 text-foreground font-medium text-[13px] rounded-lg py-2.5 transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>

      {/* Terms note */}
      <p className="text-[11px] text-foreground/25 text-center leading-relaxed">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="hover:text-foreground/50 underline underline-offset-2 transition-colors">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="hover:text-foreground/50 underline underline-offset-2 transition-colors">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}