"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Store, Package, Crown, LogOut, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors",   label: "Vendors",   icon: Store },
  { href: "/users",     label: "Users",     icon: Users },
  { href: "/products",  label: "Products",  icon: Package },
  { href: "/membership",label: "Membership",icon: Crown },
];

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated() || user?.role !== "admin") router.push("/login");
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated() || user?.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-primary-500 text-white flex flex-col">
        <div className="p-5 border-b border-primary-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-gold-400" />
            <span className="font-display font-bold text-lg">Admin Panel</span>
          </div>
          <p className="text-xs text-primary-200 mt-1">Bohra Market</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname === href ? "bg-white/20 text-white" : "text-primary-100 hover:bg-white/10 hover:text-white"
              )}>
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-primary-400">
          <button onClick={() => { logout(); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary-200 hover:bg-white/10 hover:text-white">
            <LogOut size={18} />Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
