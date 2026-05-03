"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { vendorApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { VendorStats } from "@/types";

export default function VendorAnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: () => vendorApi.getStats().then((r) => r.data as VendorStats),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-primary-500">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          {isLoading ? (
            <div className="skeleton h-8 w-24 rounded" />
          ) : (
            <p className="text-2xl font-bold text-primary-500">{formatPrice(stats?.total_revenue ?? 0)}</p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Active Products</p>
          {isLoading ? (
            <div className="skeleton h-8 w-16 rounded" />
          ) : (
            <p className="text-2xl font-bold text-primary-500">{stats?.active_product_count ?? 0}</p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Top Products</p>
          {isLoading ? (
            <div className="skeleton h-8 w-16 rounded" />
          ) : (
            <p className="text-2xl font-bold text-primary-500">{stats?.top_products?.length ?? 0}</p>
          )}
        </div>
      </div>

      {/* Top products chart */}
      {stats?.top_products && stats.top_products.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Products by Sales</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={stats.top_products.map((p) => ({
                name: p.products?.name?.slice(0, 20) || "Product",
                sold: p.quantity,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, "Units Sold"]} />
              <Bar dataKey="sold" fill="#1B4332" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isLoading && (!stats?.top_products || stats.top_products.length === 0) && (
        <div className="card p-12 text-center text-gray-400">
          <p>No sales data yet. Start selling to see analytics!</p>
        </div>
      )}
    </div>
  );
}
