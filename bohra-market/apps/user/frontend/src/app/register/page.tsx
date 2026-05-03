"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Invalid phone number"),
  city: z.string().min(2, "City required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDetectingLocation(false);
        toast.success("Location detected");
      },
      () => {
        setDetectingLocation(false);
        toast.error("Could not detect location");
      }
    );
  };

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        password: data.password,
        latitude: location?.lat,
        longitude: location?.lng,
      });
      setToken(res.data.access_token);
      setUser(res.data.user);
      toast.success("Welcome to Bohra Market!");
      router.push("/shop");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-primary-500 text-3xl font-display font-bold">
            Bohra Market
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Create your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register("full_name")} className="input" placeholder="Fatema Bohra" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register("email")} type="email" className="input" placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone</label>
              <input {...register("phone")} type="tel" className="input" placeholder="+91 98765 43210" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="label">City</label>
              <input {...register("city")} className="input" placeholder="Surat, Mumbai, Indore…" />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>

            {/* Location */}
            <div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
                  location
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-600 hover:border-primary-300"
                }`}
              >
                <MapPin size={15} />
                {detectingLocation ? "Detecting…" : location ? "Location detected ✓" : "Detect my location (optional)"}
              </button>
            </div>

            <div>
              <label className="label">Password</label>
              <input {...register("password")} type="password" className="input" placeholder="Min 8 characters" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input {...register("confirm_password")} type="password" className="input" placeholder="Repeat password" />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
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
