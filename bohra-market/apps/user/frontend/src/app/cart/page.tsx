"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/api";
import { formatPrice, getDiscountedPrice } from "@/lib/utils";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const addressSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(10),
  address_line1: z.string().min(5),
  address_line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [placing, setPlacing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { full_name: user?.full_name, phone: user?.phone, city: user?.city },
  });

  const total = totalPrice();

  const onSubmit = async (address: AddressForm) => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setPlacing(true);

    const orderItems = items.map((i) => ({
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: getDiscountedPrice(i.product.price, i.product.discount_percent),
    }));

    if (paymentMethod === "cod") {
      try {
        await ordersApi.create({
          items: orderItems,
          delivery_address: address,
          payment_method: "cod",
        });
        clearCart();
        toast.success("Order placed successfully!");
        router.push("/orders");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        toast.error(msg || "Failed to place order");
      } finally {
        setPlacing(false);
      }
      return;
    }

    // Razorpay flow
    try {
      const rzpOrderRes = await ordersApi.createRazorpayOrder(total);
      const rzpOrder = rzpOrderRes.data;

      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: "INR",
        name: "Bohra Market",
        description: `Order of ${items.length} item(s)`,
        order_id: rzpOrder.id,
        handler: async (response: Record<string, string>) => {
          try {
            await ordersApi.create({
              items: orderItems,
              delivery_address: address,
              payment_method: "razorpay",
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            toast.success("Order placed and payment confirmed!");
            router.push("/orders");
          } catch {
            toast.error("Order creation failed after payment");
          }
        },
        prefill: { name: address.full_name, contact: address.phone },
        theme: { color: "#1B4332" },
        modal: { ondismiss: () => setPlacing(false) },
      });
      rzp.open();
    } catch {
      toast.error("Payment initiation failed");
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShoppingBag size={64} className="mx-auto text-gray-300" strokeWidth={1} />
            <h2 className="text-xl font-display font-bold text-gray-700">Your cart is empty</h2>
            <Link href="/shop" className="btn-primary inline-block px-8 py-3">
              Start Shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-display font-bold text-primary-500 mb-6">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items + address */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items */}
              <div className="card divide-y divide-gray-50">
                {items.map((item) => {
                  const discounted = getDiscountedPrice(item.product.price, item.product.discount_percent);
                  return (
                    <div key={item.product.id} className="p-4 flex gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream-200 flex-shrink-0">
                        {item.product.images[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.name} width={64} height={64} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.product.vendor_profiles?.business_name}</p>
                        <p className="text-primary-500 font-semibold mt-1">{formatPrice(discounted)}/{item.product.unit}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button onClick={() => removeItem(item.product.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                        <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-50">
                            <Minus size={12} />
                          </button>
                          <span className="px-2 text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-50">
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="text-sm font-semibold">{formatPrice(discounted * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery address */}
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Delivery Address</h2>
                <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name</label>
                      <input {...register("full_name")} className="input" />
                      {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input {...register("phone")} type="tel" className="input" />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="label">Address Line 1</label>
                    <input {...register("address_line1")} className="input" placeholder="House/Flat no, Street" />
                    {errors.address_line1 && <p className="text-red-500 text-xs mt-1">{errors.address_line1.message}</p>}
                  </div>
                  <div>
                    <label className="label">Address Line 2 (optional)</label>
                    <input {...register("address_line2")} className="input" placeholder="Landmark, Area" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">City</label>
                      <input {...register("city")} className="input" />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input {...register("state")} className="input" />
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                    </div>
                    <div>
                      <label className="label">Pincode</label>
                      <input {...register("pincode")} className="input" maxLength={6} />
                      {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Order summary */}
            <div className="space-y-4">
              <div className="card p-5 space-y-4">
                <h2 className="font-semibold text-gray-900">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} items)</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-primary-500 text-lg">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                  <div className="space-y-2">
                    {(["razorpay", "cod"] as const).map((method) => (
                      <label key={method} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                          className="accent-primary-500"
                        />
                        <span className="text-sm text-gray-700">
                          {method === "razorpay" ? "Pay Online (Razorpay)" : "Cash on Delivery"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={placing}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {placing && <Loader2 size={16} className="animate-spin" />}
                  {paymentMethod === "razorpay" ? "Pay Now" : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
