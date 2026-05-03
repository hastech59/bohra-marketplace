"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Star, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { reviewsApi } from "@/lib/api";
import { formatPrice, getDiscountedPrice, formatDistance, cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  showDistance?: boolean;
}

export function ProductCard({ product, showDistance = false }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const discountedPrice = getDiscountedPrice(product.price, product.discount_percent);
  const hasDiscount = product.discount_percent > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock_quantity === 0) {
      toast.error("Out of stock");
      return;
    }
    addItem(product);
    openCart();
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      toast.error("Please sign in to save items");
      return;
    }
    try {
      await reviewsApi.addWishlist(product.id);
      toast.success("Saved to wishlist");
    } catch {
      toast.error("Already in wishlist");
    }
  };

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="card hover:shadow-md transition-shadow duration-200">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-cream-200">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {product.categories?.slug?.includes("food") ? "🍱" :
               product.categories?.slug?.includes("clothing") ? "👗" :
               product.categories?.slug?.includes("craft") ? "🧵" : "🛍️"}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="badge bg-red-500 text-white">
                -{product.discount_percent}%
              </span>
            )}
            {product.is_featured && (
              <span className="badge bg-gold-500 text-white">Featured</span>
            )}
            {product.stock_quantity === 0 && (
              <span className="badge bg-gray-500 text-white">Out of Stock</span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full
                       opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            aria-label="Add to wishlist"
          >
            <Heart size={16} className="text-gray-600 hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Vendor */}
          <p className="text-xs text-gray-500 truncate mb-0.5">
            {product.vendor_profiles?.business_name}
          </p>

          {/* Name */}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} className="fill-gold-400 text-gold-400" />
              <span className="text-xs text-gray-600">
                {product.avg_rating.toFixed(1)} ({product.review_count})
              </span>
            </div>
          )}

          {/* Distance */}
          {showDistance && product.distance_km !== undefined && (
            <div className="flex items-center gap-1 mb-2">
              <MapPin size={12} className="text-primary-400" />
              <span className="text-xs text-primary-500 font-medium">
                {formatDistance(product.distance_km)}
              </span>
            </div>
          )}

          {/* Price + Add to cart */}
          <div className="flex items-center justify-between mt-auto">
            <div>
              <span className="text-primary-500 font-bold text-base">
                {formatPrice(discountedPrice)}
              </span>
              {hasDiscount && (
                <span className="text-gray-400 text-xs line-through ml-1">
                  {formatPrice(product.price)}
                </span>
              )}
              <span className="text-gray-400 text-xs ml-1">/{product.unit}</span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className={cn(
                "p-2 rounded-lg transition-colors",
                product.stock_quantity === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-primary-500 text-white hover:bg-primary-600"
              )}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Skeleton loader
export function ProductCardSkeleton() {
  return (
    <div className="card">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="flex justify-between items-center mt-2">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
