"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api";
import { formatPrice, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function VendorOrdersPage() {
  const qc = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: () => vendorApi.getOrders().then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      vendorApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-primary-500">Orders</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Qty</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders yet</td>
              </tr>
            ) : (
              orders?.map((item: Record<string, unknown>) => {
                const order = item.orders as Record<string, unknown>;
                const profile = (order?.profiles as Record<string, string>) || {};
                return (
                  <tr key={item.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.product_name as string}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{profile.full_name || "—"}</p>
                      <p className="text-xs text-gray-400">{profile.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.quantity as number}</td>
                    <td className="px-4 py-3 font-medium text-primary-500">
                      {formatPrice(item.total_price as number)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {order?.created_at
                        ? new Date(order.created_at as string).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order?.status as string}
                        onChange={(e) =>
                          statusMutation.mutate({
                            orderId: order?.id as string,
                            status: e.target.value,
                          })
                        }
                        className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${getStatusColor(order?.status as string)}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
