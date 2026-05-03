"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ordersApi } from "@/lib/api";
import { formatPrice, getStatusColor } from "@/lib/utils";
import type { Order } from "@/types";

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => ordersApi.myOrders().then((r) => r.data as Order[]),
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-display font-bold text-primary-500 mb-6">My Orders</h1>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="skeleton h-5 w-32 rounded mb-3" />
                  <div className="skeleton h-4 w-full rounded mb-2" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : orders?.length === 0 ? (
            <div className="card p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" strokeWidth={1} />
              <p className="text-gray-500 font-medium">No orders yet</p>
              <Link href="/shop" className="btn-primary inline-block mt-4 px-6">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders?.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="card p-5 block hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {order.order_items?.length ?? 0} item(s) · {order.delivery_address.city}
                    </p>
                    <p className="font-bold text-primary-500">{formatPrice(order.total_amount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
