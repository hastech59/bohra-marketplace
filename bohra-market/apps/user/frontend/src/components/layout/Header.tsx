"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, User, Menu, X, Search, MapPin } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, toggleCart } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const itemCount = totalItems();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-primary-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-gold-400 text-2xl font-display font-bold tracking-tight">
              Bohra Market
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/shop" className="hover:text-gold-300 transition-colors">
              Shop
            </Link>
            <Link href="/shop?category=food-groceries" className="hover:text-gold-300 transition-colors">
              Food
            </Link>
            <Link href="/shop?category=clothing-accessories" className="hover:text-gold-300 transition-colors">
              Clothing
            </Link>
            <Link href="/shop?category=handmade-crafts" className="hover:text-gold-300 transition-colors">
              Crafts
            </Link>
            <Link href="/shop?category=services" className="hover:text-gold-300 transition-colors">
              Services
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/shop" className="hidden md:flex items-center gap-1 hover:text-gold-300 transition-colors">
              <Search size={18} />
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2 hover:text-gold-300 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* User menu */}
            {isAuthenticated() ? (
              <div className="relative group">
                <button className="flex items-center gap-2 hover:text-gold-300 transition-colors">
                  <User size={22} />
                  <span className="hidden md:block text-sm">{user?.full_name?.split(" ")[0]}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {user?.role === "vendor" && (
                    <Link href="/vendor/dashboard" className="block px-4 py-2.5 text-sm hover:bg-cream-100 rounded-t-xl">
                      Vendor Dashboard
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link href="/admin/dashboard" className="block px-4 py-2.5 text-sm hover:bg-cream-100 rounded-t-xl">
                      Admin Panel
                    </Link>
                  )}
                  <Link href="/profile" className="block px-4 py-2.5 text-sm hover:bg-cream-100">
                    My Profile
                  </Link>
                  <Link href="/orders" className="block px-4 py-2.5 text-sm hover:bg-cream-100">
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary-600 border-t border-primary-400 px-4 py-4 space-y-3">
          <Link href="/shop" className="block py-2 hover:text-gold-300" onClick={() => setMobileOpen(false)}>Shop All</Link>
          <Link href="/shop?category=food-groceries" className="block py-2 hover:text-gold-300" onClick={() => setMobileOpen(false)}>Food & Groceries</Link>
          <Link href="/shop?category=clothing-accessories" className="block py-2 hover:text-gold-300" onClick={() => setMobileOpen(false)}>Clothing</Link>
          <Link href="/shop?category=handmade-crafts" className="block py-2 hover:text-gold-300" onClick={() => setMobileOpen(false)}>Crafts</Link>
          <Link href="/shop?category=services" className="block py-2 hover:text-gold-300" onClick={() => setMobileOpen(false)}>Services</Link>
          {!isAuthenticated() && (
            <Link href="/login" className="block btn-secondary text-center mt-2" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
