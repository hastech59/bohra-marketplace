"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, BarChart2, Crown, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/products",   label: "Products",   icon: Package },
  { href: "/orders",     label: "Orders",     icon: ShoppingBag },
  { href: "/analytics",  label: "Analytics",  icon: BarChart2 },
  { href: "/membership", label: "Membership", icon: Crown },
];

export default function VendorProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
    else if (user?.role !== "vendor" && user?.role !== "admin") router.push("/login");
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated()) return null;

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="p-5 border-b border-gray-100">
          <p className="font-display font-bold text-primary-500 text-lg">Bohra Market</p>
          <p className="text-xs text-gray-500 mt-0.5">Vendor Portal</p>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900 text-sm">{user?.vendor?.business_name || user?.full_name}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.vendor?.approval_status || "vendor"}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname === href ? "bg-primary-500 text-white" : "text-gray-600 hover:bg-cream-100 hover:text-primary-500"
              )}>
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-cream-100">
            <User size={18} />Profile
          </Link>
          <button onClick={() => { logout(); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50">
            <LogOut size={18} />Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
