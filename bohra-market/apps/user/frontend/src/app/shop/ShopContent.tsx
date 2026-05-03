"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard, ProductCardSkeleton } from "@/components/product/ProductCard";
import { productsApi, aiApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";
import toast from "react-hot-toast";

export default function ShopContent() {
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [aiQuery, setAiQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [aiProducts, setAiProducts] = useState<Product[] | null>(null);
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.categories().then((r) => r.data as Category[]),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", selectedCategory, searchQuery, minPrice, maxPrice, page],
    queryFn: () =>
      productsApi
        .list({
          q: searchQuery || undefined,
          category_id: selectedCategory || undefined,
          min_price: minPrice,
          max_price: maxPrice,
          page,
          page_size: 24,
        })
        .then((r) => r.data),
    enabled: !aiProducts && !useLocation,
  });

  const { data: nearbyData, isLoading: nearbyLoading } = useQuery({
    queryKey: ["nearby-products", userLocation, selectedCategory],
    queryFn: () =>
      productsApi
        .nearby({
          latitude: userLocation!.lat,
          longitude: userLocation!.lng,
          radius_km: 50,
          category_id: selectedCategory || undefined,
        })
        .then((r) => r.data),
    enabled: useLocation && !!userLocation,
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseLocation(true);
        toast.success("Location detected");
      },
      () => toast.error("Could not get location")
    );
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const res = await aiApi.search(aiQuery, userLocation?.lat, userLocation?.lng);
      setAiProducts(res.data.products);
      toast.success(res.data.explanation);
    } catch {
      toast.error("AI search failed");
    } finally {
      setIsAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiProducts(null);
    setAiQuery("");
  };

  const displayProducts =
    aiProducts ??
    (useLocation ? nearbyData?.products : productsData?.products) ??
    [];
  const loading = isLoading || nearbyLoading || isAiSearching;
  const topCategories = categoriesData?.filter((c) => !c.parent_id) ?? [];

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero search */}
      <div className="bg-primary-500 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-white font-display text-2xl font-bold text-center">
            Discover Authentic Bohra Products
          </h1>

          {/* AI search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Sparkles size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400" />
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                placeholder='Try: "rida under ₹800 in Surat" or "Bohra pickles near me"'
                className="w-full pl-9 pr-4 py-3 rounded-xl text-sm bg-white/10 text-white placeholder:text-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
            <button
              onClick={handleAiSearch}
              disabled={isAiSearching}
              className="bg-gold-500 hover:bg-gold-600 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
            >
              {isAiSearching ? "…" : "AI Search"}
            </button>
          </div>

          {/* Regular search + location */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setAiProducts(null); }}
                placeholder="Search products…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
            <button
              onClick={handleGetLocation}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                useLocation ? "bg-gold-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              <MapPin size={15} />
              {useLocation ? "Near Me ✓" : "Nearby"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* AI search active banner */}
        {aiProducts && (
          <div className="mb-4 flex items-center justify-between bg-gold-50 border border-gold-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gold-800">
              <Sparkles size={16} />
              <span>AI results for: <strong>{aiQuery}</strong></span>
            </div>
            <button onClick={clearAiSearch} className="text-gold-600 hover:text-gold-800">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <button
            onClick={() => setSelectedCategory("")}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              !selectedCategory
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-primary-300"
            )}
          >
            All
          </button>
          {topCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setAiProducts(null); }}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                selectedCategory === cat.id
                  ? "bg-primary-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-primary-300"
              )}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="w-64 flex-shrink-0 space-y-6 hidden lg:block">
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice ?? ""}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice ?? ""}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
            </div>

            {selectedCategory && (
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Sub-categories</h3>
                <div className="space-y-1">
                  {categoriesData
                    ?.filter((c) => c.parent_id === selectedCategory)
                    .map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedCategory(sub.id)}
                        className="w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-cream-100 text-gray-700"
                      >
                        {sub.icon} {sub.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {loading ? "Loading…" : `${displayProducts.length} products`}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : displayProducts.map((product: Product) => (
                    <ProductCard key={product.id} product={product} showDistance={useLocation} />
                  ))}
            </div>

            {!aiProducts && !useLocation && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={displayProducts.length < 24}
                  className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
