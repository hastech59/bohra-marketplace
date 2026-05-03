"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Heart } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { authApi, reviewsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { WishlistItem } from "@/types";
import toast from "react-hot-toast";

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(10).optional().or(z.literal("")),
  city: z.string().min(2).optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "wishlist">("profile");
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => reviewsApi.getWishlist().then((r) => r.data as WishlistItem[]),
    enabled: activeTab === "wishlist",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      city: user?.city || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.updateProfile(data);
      setUser({ ...user!, ...res.data });
      toast.success("Profile updated");
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-display font-bold text-primary-500 mb-6">My Profile</h1>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 mb-6">
            {(["profile", "wishlist"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary-500 text-primary-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "wishlist" && <Heart size={14} className="inline mr-1" />}
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <div className="card p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input {...register("full_name")} className="input" />
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input value={user?.email || ""} disabled className="input bg-gray-50 text-gray-400" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input {...register("phone")} type="tel" className="input" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input {...register("city")} className="input" />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {activeTab === "wishlist" && (
            <div>
              {wishlistLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card">
                      <div className="aspect-square skeleton" />
                      <div className="p-3 space-y-2">
                        <div className="skeleton h-4 w-3/4 rounded" />
                        <div className="skeleton h-3 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : wishlist?.length === 0 ? (
                <div className="card p-12 text-center">
                  <Heart size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
                  <p className="text-gray-500">No saved items yet</p>
                  <Link href="/shop" className="btn-primary inline-block mt-4 px-6">
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {wishlist?.map((item) =>
                    item.products ? (
                      <ProductCard key={item.id} product={item.products} />
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
