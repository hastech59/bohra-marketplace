"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Search } from "lucide-react";
import Image from "next/image";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";
import toast from "react-hot-toast";

export default function AdminProductsPage() {
  const [searchQ, setSearchQ] = useState("");
  const qc = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => adminApi.getProducts().then((r) => r.data as Product[]),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      adminApi.toggleFeatured(id, featured),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Updated");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminApi.removeProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product removed");
    },
  });

  const filtered = products?.filter((p) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.vendor_profiles?.business_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Product Management</h1>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="input pl-9 text-sm"
          placeholder="Search products or vendors…"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="skeleton h-4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No products found</td>
              </tr>
            ) : (
              filtered?.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 max-w-[180px] truncate">{product.name}</p>
                        {product.is_featured && (
                          <span className="badge bg-gold-100 text-gold-700 text-xs">Featured</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.vendor_profiles?.business_name}</td>
                  <td className="px-4 py-3 text-gray-600">{product.categories?.name}</td>
                  <td className="px-4 py-3 font-medium text-primary-500">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-gold-400 text-gold-400" />
                      <span className="text-gray-600">{product.avg_rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => featureMutation.mutate({ id: product.id, featured: !product.is_featured })}
                        className={`p-1.5 rounded-lg transition-colors ${
                          product.is_featured
                            ? "text-gold-500 bg-gold-50 hover:bg-gold-100"
                            : "text-gray-400 hover:text-gold-500 hover:bg-gold-50"
                        }`}
                        title={product.is_featured ? "Unfeature" : "Feature"}
                      >
                        <Star size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Remove this product?")) removeMutation.mutate(product.id);
                        }}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
