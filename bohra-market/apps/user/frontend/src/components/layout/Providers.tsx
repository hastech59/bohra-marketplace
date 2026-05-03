"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib/queryClient";
import { CartDrawer } from "@/components/product/CartDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CartDrawer />
      <Toaster position="top-right" toastOptions={{
        style: { background: "#1B4332", color: "#FBF7EE", borderRadius: "10px" },
        success: { iconTheme: { primary: "#D4A017", secondary: "#FBF7EE" } },
        error: { style: { background: "#991B1B", color: "#FEF2F2" } },
      }} />
    </QueryClientProvider>
  );
}
