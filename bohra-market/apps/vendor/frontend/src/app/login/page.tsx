"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function VendorLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      if (res.data.user.role !== "vendor" && res.data.user.role !== "admin") {
        toast.error("Vendor account required");
        return;
      }
      setToken(res.data.access_token);
      setUser(res.data.user);
      toast.success(`Welcome back, ${res.data.user.full_name.split(" ")[0]}!`);
      router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-primary-500 text-3xl font-display font-bold">
            Bohra Market
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Vendor Portal — Sign in</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input {...register("email")} type="email" autoComplete="email" className="input" placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register("password")} type={showPassword ? "text" : "password"} autoComplete="current-password" className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            New vendor?{" "}
            <Link href="/register" className="text-primary-500 font-medium hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
