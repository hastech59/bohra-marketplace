"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit2, Trash2, Package, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product, MembershipPlan } from "@/types";
import toast from "react-hot-toast";

export default function VendorProductsPage() {
  const qc = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["vendor-products"],
    queryFn: () => vendorApi.getProducts().then((r) => r.data as Product[]),
  });

  const { data: profile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: () => vendorApi.getProfile().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("Product deleted");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const plan: MembershipPlan | undefined = profile?.membership_plans;
  const maxProducts = plan?.max_products ?? 5;
  const currentCount = products?.length ?? 0;
  const atLimit = maxProducts !== -1 && currentCount >= maxProducts;
  const usagePercent = maxProducts === -1 ? 0 : Math.min((currentCount / maxProducts) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-primary-500">My Products</h1>
        {atLimit ? (
          <Link href="/membership" className="btn-secondary flex items-center gap-2">
            <AlertCircle size={16} />
            Upgrade to Add More
          </Link>
        ) : (
          <Link href="/products/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add Product
          </Link>
        )}
      </div>

      {/* Usage bar */}
      {plan && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {currentCount} / {maxProducts === -1 ? "∞" : maxProducts} products used
            </span>
            <span className="text-xs text-gray-400">{plan.name} Plan</span>
          </div>
          {maxProducts !== -1 && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-primary-500"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Products list */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton w-16 h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No products yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first product to start selling</p>
          <Link href="/products/new" className="btn-primary inline-block mt-4 px-6">
            Add Product
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {products?.map((product) => (
            <div key={product.id} className="p-4 flex items-center gap-4">
              {/* Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-sm text-gray-500">{product.categories?.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-primary-500 font-semibold text-sm">
                    {formatPrice(product.price)}
                  </span>
                  {product.discount_percent > 0 && (
                    <span className="badge bg-red-100 text-red-600 text-xs">
                      -{product.discount_percent}%
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Stock: {product.stock_quantity}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/products/${product.id}/edit`}
                  className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  aria-label="Edit product"
                >
                  <Edit2 size={16} />
                </Link>
                <button
                  onClick={() => {
                    if (confirm("Delete this product?")) {
                      deleteMutation.mutate(product.id);
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete product"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
