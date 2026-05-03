"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Crown, Loader2 } from "lucide-react";
import { vendorApi } from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import type { MembershipPlan } from "@/types";
import toast from "react-hot-toast";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function MembershipPage() {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["membership-plans"],
    queryFn: () => vendorApi.getMembershipPlans().then((r) => r.data as MembershipPlan[]),
  });

  const { data: profile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: () => vendorApi.getProfile().then((r) => r.data),
  });

  const currentPlanId = profile?.membership_plan_id;

  const handlePurchase = async (plan: MembershipPlan) => {
    if (plan.id === currentPlanId) return;
    setPurchasing(plan.id);

    try {
      const res = await vendorApi.purchaseMembership(plan.id);

      if (res.data.free) {
        toast.success("Plan activated!");
        setPurchasing(null);
        return;
      }

      // Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      const rzpOrder = res.data.razorpay_order;
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: "INR",
        name: "Bohra Market",
        description: `${plan.name} Membership`,
        order_id: rzpOrder.id,
        handler: async (response: Record<string, string>) => {
          try {
            await vendorApi.confirmMembership({
              plan_id: plan.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`${plan.name} plan activated!`);
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: profile?.profiles?.full_name, email: profile?.profiles?.email },
        theme: { color: "#1B4332" },
      });
      rzp.open();
    } catch {
      toast.error("Failed to initiate payment");
    } finally {
      setPurchasing(null);
    }
  };

  const PLAN_COLORS: Record<string, string> = {
    Basic: "border-gray-200",
    Silver: "border-gray-400",
    Gold: "border-gold-400",
    Platinum: "border-primary-500",
  };

  const PLAN_BADGES: Record<string, string> = {
    Basic: "bg-gray-100 text-gray-600",
    Silver: "bg-gray-200 text-gray-700",
    Gold: "bg-gold-100 text-gold-700",
    Platinum: "bg-primary-100 text-primary-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary-500">Membership Plans</h1>
        <p className="text-gray-500 text-sm mt-1">
          Choose a plan to unlock more product listings and features
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6 space-y-3">
              <div className="skeleton h-6 w-20 rounded" />
              <div className="skeleton h-8 w-24 rounded" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="skeleton h-3 w-full rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans?.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={cn(
                  "card p-6 border-2 relative",
                  PLAN_COLORS[plan.name] || "border-gray-200",
                  isCurrent && "ring-2 ring-primary-500"
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-primary-500 text-white text-xs px-3">
                    Current Plan
                  </span>
                )}
                {plan.name === "Gold" && (
                  <span className="absolute -top-3 right-4 badge bg-gold-500 text-white text-xs px-3">
                    Popular
                  </span>
                )}

                <div className="mb-4">
                  <span className={cn("badge text-sm px-3 py-1", PLAN_BADGES[plan.name])}>
                    {plan.name === "Platinum" && <Crown size={12} className="mr-1" />}
                    {plan.name}
                  </span>
                </div>

                <div className="mb-4">
                  {plan.price_monthly === 0 ? (
                    <p className="text-2xl font-bold text-gray-900">Free</p>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(plan.price_monthly)}
                      </p>
                      <p className="text-xs text-gray-400">/month</p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={14} className="text-green-500 flex-shrink-0" />
                    {plan.max_products === -1 ? "Unlimited products" : `Up to ${plan.max_products} products`}
                  </li>
                  {plan.features.featured_listings && (
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                      Featured listings
                    </li>
                  )}
                  {plan.features.priority_placement && (
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                      Priority placement
                    </li>
                  )}
                  {plan.features.analytics && (
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                      Analytics dashboard
                    </li>
                  )}
                  {plan.features.whatsapp_support && (
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                      WhatsApp support
                    </li>
                  )}
                  {plan.features.homepage_banner && (
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                      Homepage banner
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isCurrent || purchasing === plan.id}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    isCurrent
                      ? "bg-gray-100 text-gray-400 cursor-default"
                      : plan.name === "Platinum"
                      ? "bg-primary-500 text-white hover:bg-primary-600"
                      : plan.name === "Gold"
                      ? "bg-gold-500 text-white hover:bg-gold-600"
                      : "btn-outline"
                  )}
                >
                  {purchasing === plan.id && <Loader2 size={14} className="animate-spin" />}
                  {isCurrent ? "Active" : plan.price_monthly === 0 ? "Select Free" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
