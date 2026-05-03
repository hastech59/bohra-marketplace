import { Suspense } from "react";
import ShopContent from "./ShopContent";
import { Header } from "@/components/layout/Header";

export default function ShopPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-screen bg-cream" />}>
        <ShopContent />
      </Suspense>
    </>
  );
}
