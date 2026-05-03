export type UserRole = "user" | "vendor" | "admin";
export type VendorStatus = "pending" | "approved" | "rejected" | "suspended";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  vendor?: VendorProfile;
}

export interface MembershipPlan {
  id: string;
  name: "Basic" | "Silver" | "Gold" | "Platinum";
  price_monthly: number;
  max_products: number; // -1 = unlimited
  features: {
    badge: string;
    featured_listings: boolean;
    priority_placement: boolean;
    analytics: boolean;
    whatsapp_support: boolean;
    homepage_banner?: boolean;
    dedicated_support?: boolean;
  };
  is_active: boolean;
  sort_order: number;
}

export interface VendorProfile {
  id: string;
  business_name: string;
  business_type: string;
  business_description?: string;
  whatsapp?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  approval_status: VendorStatus;
  rejection_reason?: string;
  membership_plan_id?: string;
  membership_expires_at?: string;
  membership_plans?: MembershipPlan;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  icon?: string;
  sort_order: number;
  children?: Category[];
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  discount_percent: number;
  stock_quantity: number;
  unit: string;
  images: string[];
  tags: string[];
  latitude?: number;
  longitude?: number;
  avg_rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  // Joined fields
  categories?: { name: string; slug: string };
  vendor_profiles?: {
    business_name: string;
    city: string;
    whatsapp?: string;
    business_description?: string;
    approval_status: VendorStatus;
  };
  distance_km?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DeliveryAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  delivery_address: DeliveryAddress;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_image?: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer_name?: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: Product;
}

export interface AISearchResult {
  filters: Record<string, unknown>;
  products: Product[];
  explanation: string;
}

export interface VendorStats {
  total_revenue: number;
  top_products: Array<{
    product_id: string;
    quantity: number;
    products: { name: string; images: string[] };
  }>;
  active_product_count: number;
}

export interface AdminStats {
  total_users: number;
  total_vendors: number;
  orders_today: number;
  monthly_revenue: number;
  pending_vendors: number;
}
