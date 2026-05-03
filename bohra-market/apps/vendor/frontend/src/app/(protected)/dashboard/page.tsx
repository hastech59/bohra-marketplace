"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package, ShoppingBag, TrendingUp, Plus, AlertCircle, Crown } from "lucide-react";
import { vendorApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, getStatusColor } from "@/lib/utils";
import type { VendorStats, Order } from "@/types";

export default function VendorDashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: () => vendorApi.getStats().then((r) => r.data as VendorStats),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: () => vendorApi.getOrders().then((r) => r.data),
  });

  const { data: profile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: () => vendorApi.getProfile().then((r) => r.data),
  });

  const isPending = user?.vendor?.approval_status === "pending";
  const isRejected = user?.vendor?.approval_status === "rejected";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary-500">
            Welcome back, {user?.full_name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile?.membership_plans?.name || "Basic"} Plan
          </p>
        </div>
        <Link href="/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* Status alerts */}
      {isPending && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Account Pending Approval</p>
            <p className="text-sm text-yellow-700 mt-1">
              Your vendor account is under review. You can set up your profile but won&apos;t be able to list products until approved.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Application Rejected</p>
            <p className="text-sm text-red-700 mt-1">
              {user?.vendor?.rejection_reason || "Your application was not approved. Please contact support."}
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Total Revenue</span>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          {statsLoading ? (
            <div className="skeleton h-8 w-24 rounded" />
          ) : (
            <p className="text-2xl font-bold text-primary-500">
              {formatPrice(stats?.total_revenue ?? 0)}
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Active Products</span>
            <Package size={20} className="text-blue-500" />
          </div>
          {statsLoading ? (
            <div className="skeleton h-8 w-16 rounded" />
          ) : (
            <p className="text-2xl font-bold text-primary-500">
              {stats?.active_product_count ?? 0}
            </p>
          )}
          {profile?.membership_plans && (
            <p className="text-xs text-gray-400 mt-1">
              of {profile.membership_plans.max_products === -1 ? "∞" : profile.membership_plans.max_products} allowed
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Recent Orders</span>
            <ShoppingBag size={20} className="text-purple-500" />
          </div>
          {ordersLoading ? (
            <div className="skeleton h-8 w-16 rounded" />
          ) : (
            <p className="text-2xl font-bold text-primary-500">{orders?.length ?? 0}</p>
          )}
        </div>
      </div>

      {/* Membership upgrade prompt */}
      {profile?.membership_plans?.name === "Basic" && (
        <div className="bg-gradient-to-r from-gold-50 to-cream-200 border border-gold-200 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown size={24} className="text-gold-500" />
            <div>
              <p className="font-semibold text-gray-900">Upgrade your plan</p>
              <p className="text-sm text-gray-600">List more products and get featured placement</p>
            </div>
          </div>
          <Link href="/membership" className="btn-secondary text-sm px-4 py-2">
            Upgrade
          </Link>
        </div>
      )}

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-primary-500 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {ordersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-3">
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            ))
          ) : orders?.slice(0, 5).map((item: Record<string, unknown>) => (
            <div key={item.id as string} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.product_name as string}</p>
                <p className="text-xs text-gray-500">
                  Qty: {item.quantity as number} · {formatPrice(item.total_price as number)}
                </p>
              </div>
              <span className={`badge ${getStatusColor((item.orders as Record<string, unknown>)?.status as string)}`}>
                {(item.orders as Record<string, unknown>)?.status as string}
              </span>
            </div>
          ))}
          {!ordersLoading && (!orders || orders.length === 0) && (
            <p className="p-6 text-center text-gray-400 text-sm">No orders yet</p>
          )}
        </div>
      </div>

      {/* Top products */}
      {stats?.top_products && stats.top_products.length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Top Products</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.top_products.map((item) => (
              <div key={item.product_id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cream-200 flex items-center justify-center text-lg">
                  {item.products?.images?.[0] ? "📦" : "🛍️"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.products?.name}</p>
                  <p className="text-xs text-gray-500">{item.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
