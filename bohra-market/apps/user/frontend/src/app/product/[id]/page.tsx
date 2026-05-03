"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Star, MapPin, MessageCircle, ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { productsApi, reviewsApi } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, getDiscountedPrice, cn } from "@/lib/utils";
import type { Product, Review } from "@/types";
import toast from "react-hot-toast";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id).then((r) => r.data as Product),
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewsApi.getProductReviews(id).then((r) => r.data as Review[]),
  });

  const { data: relatedData } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: () =>
      productsApi
        .list({ category_id: product!.category_id, page_size: 4 })
        .then((r) => r.data.products as Product[]),
    enabled: !!product?.category_id,
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`skeleton h-${i === 0 ? 8 : 4} rounded`} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) return null;

  const discountedPrice = getDiscountedPrice(product.price, product.discount_percent);
  const hasDiscount = product.discount_percent > 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    openCart();
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated()) {
      toast.error("Please sign in");
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
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/shop" className="hover:text-primary-500 flex items-center gap-1">
              <ChevronLeft size={16} />
              Shop
            </Link>
            <span>/</span>
            <span className="text-gray-400">{product.categories?.name}</span>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-200">
                {product.images[selectedImage] ? (
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">🛍️</div>
                )}
                {hasDiscount && (
                  <span className="absolute top-4 left-4 badge bg-red-500 text-white text-sm px-3 py-1">
                    -{product.discount_percent}% OFF
                  </span>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                        selectedImage === i ? "border-primary-500" : "border-transparent"
                      )}
                    >
                      <Image src={img} alt="" width={64} height={64} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="space-y-5">
              <div>
                <p className="text-sm text-primary-400 font-medium mb-1">
                  {product.categories?.name}
                </p>
                <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Rating */}
              {product.review_count > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={cn(
                          i < Math.round(product.avg_rating)
                            ? "fill-gold-400 text-gold-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.avg_rating.toFixed(1)} ({product.review_count} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary-500">
                  {formatPrice(discountedPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
                <span className="text-gray-500 text-sm">per {product.unit}</span>
              </div>

              {/* Stock */}
              <p className={cn(
                "text-sm font-medium",
                product.stock_quantity > 0 ? "text-green-600" : "text-red-500"
              )}>
                {product.stock_quantity > 0
                  ? `In stock (${product.stock_quantity} available)`
                  : "Out of stock"}
              </p>

              {/* Quantity + Add to cart */}
              {product.stock_quantity > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-4 py-3 hover:bg-gray-50 text-lg font-medium"
                    >
                      −
                    </button>
                    <span className="px-4 py-3 font-medium min-w-[3rem] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                      className="px-4 py-3 hover:bg-gray-50 text-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                  <button onClick={handleAddToCart} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                  <button onClick={handleWishlist} className="p-3 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors">
                    <Heart size={20} className="text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">About this product</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="badge bg-cream-200 text-primary-600 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Vendor card */}
              {product.vendor_profiles && (
                <div className="border border-primary-100 rounded-xl p-4 bg-primary-50">
                  <h3 className="font-semibold text-primary-700 mb-1">
                    {product.vendor_profiles.business_name}
                  </h3>
                  {product.vendor_profiles.city && (
                    <div className="flex items-center gap-1 text-sm text-primary-500 mb-2">
                      <MapPin size={14} />
                      {product.vendor_profiles.city}
                    </div>
                  )}
                  {product.vendor_profiles.business_description && (
                    <p className="text-sm text-gray-600">{product.vendor_profiles.business_description}</p>
                  )}
                  {product.vendor_profiles.whatsapp && (
                    <a
                      href={`https://wa.me/${product.vendor_profiles.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      <MessageCircle size={16} />
                      Chat on WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <section className="mb-12">
            <h2 className="section-title mb-6">Customer Reviews</h2>
            {reviews && reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{review.reviewer_name}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={cn(
                              i < review.rating ? "fill-gold-400 text-gold-400" : "text-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No reviews yet. Be the first to review!</p>
            )}
          </section>

          {/* Related products */}
          {relatedData && relatedData.length > 0 && (
            <section>
              <h2 className="section-title mb-6">You might also like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedData
                  .filter((p) => p.id !== product.id)
                  .slice(0, 4)
                  .map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
