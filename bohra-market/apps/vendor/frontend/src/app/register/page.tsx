"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  city: z.string().min(2),
  password: z.string().min(8),
  business_name: z.string().min(2, "Business name required"),
  business_type: z.string().min(1, "Select a business type"),
  whatsapp: z.string().min(10, "WhatsApp number required"),
  business_description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const BUSINESS_TYPES = ["Food", "Clothing", "Crafts", "Services", "Other"];

export default function VendorRegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.vendorRegister(data);
      setToken(res.data.access_token);
      setUser(res.data.user);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Registration failed");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center mx-auto">
            <Clock size={40} className="text-gold-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-primary-500">
            Application Submitted!
          </h1>
          <p className="text-gray-600">
            Your vendor application is under review. Our team will verify your details and approve
            your account within 24–48 hours. You&apos;ll be notified via email.
          </p>
          <div className="card p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={16} />
              Account created
            </div>
            <div className="flex items-center gap-2 text-sm text-gold-600">
              <Clock size={16} />
              Pending admin approval
            </div>
          </div>
          <Link href="/dashboard" className="btn-primary inline-block px-8 py-3">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-primary-500 text-3xl font-display font-bold">
            Bohra Market
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Register as a Vendor</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg border-b pb-2">Personal Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input {...register("full_name")} className="input" placeholder="Your name" />
                {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="label">City</label>
                <input {...register("city")} className="input" placeholder="Surat" />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register("email")} type="email" className="input" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input {...register("phone")} type="tel" className="input" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="label">WhatsApp</label>
                <input {...register("whatsapp")} type="tel" className="input" placeholder="+91…" />
                {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <input {...register("password")} type="password" className="input" placeholder="Min 8 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <h2 className="font-semibold text-gray-900 text-lg border-b pb-2 pt-2">Business Details</h2>

            <div>
              <label className="label">Business Name</label>
              <input {...register("business_name")} className="input" placeholder="Fatema's Kitchen" />
              {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>}
            </div>

            <div>
              <label className="label">Business Type</label>
              <select {...register("business_type")} className="input">
                <option value="">Select type…</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.business_type && <p className="text-red-500 text-xs mt-1">{errors.business_type.message}</p>}
            </div>

            <div>
              <label className="label">Business Description (optional)</label>
              <textarea
                {...register("business_description")}
                className="input resize-none"
                rows={3}
                placeholder="Tell customers about your business…"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Submit Application
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-500 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
