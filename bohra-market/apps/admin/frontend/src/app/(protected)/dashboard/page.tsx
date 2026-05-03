"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Store, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { AdminStats } from "@/types";
import Link from "next/link";

const PIE_COLORS = ["#1B4332", "#D4A017", "#2E9158", "#E8BF2A", "#56B880", "#EFCF4E"];

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats().then((r) => r.data as AdminStats),
  });

  const { data: ordersChart } = useQuery({
    queryKey: ["admin-orders-chart"],
    queryFn: () => adminApi.getOrdersChart().then((r) => r.data as Array<{ day: string; count: number }>),
  });

  const { data: revenueByCategory } = useQuery({
    queryKey: ["admin-revenue-category"],
    queryFn: () => adminApi.getRevenueByCategory().then((r) => r.data as Array<{ category_name: string; total: number }>),
  });

  const statCards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Total Vendors", value: stats?.total_vendors ?? 0, icon: Store, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Orders Today", value: stats?.orders_today ?? 0, icon: ShoppingBag, color: "text-green-500", bg: "bg-green-50" },
    { label: "Monthly Revenue", value: formatPrice(stats?.monthly_revenue ?? 0), icon: TrendingUp, color: "text-gold-500", bg: "bg-gold-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Platform Dashboard</h1>
        {stats?.pending_vendors && stats.pending_vendors > 0 ? (
          <Link
            href="/admin/vendors?status=pending"
            className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-100 transition-colors"
          >
            <AlertCircle size={16} />
            {stats.pending_vendors} pending vendor{stats.pending_vendors > 1 ? "s" : ""}
          </Link>
        ) : null}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            {isLoading ? (
              <div className="skeleton h-8 w-24 rounded" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders line chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Orders — Last 30 Days</h2>
          {ordersChart && ordersChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ordersChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleDateString("en-IN")}
                  formatter={(v) => [v, "Orders"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1B4332"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              No order data yet
            </div>
          )}
        </div>

        {/* Revenue pie chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue by Category</h2>
          {revenueByCategory && revenueByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  dataKey="total"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatPrice(v as number)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              No revenue data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
