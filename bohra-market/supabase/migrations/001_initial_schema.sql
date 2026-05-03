-- ============================================================
-- Bohra Market — Initial Schema Migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for full-text search

-- ============================================================
-- MEMBERSHIP PLANS
-- ============================================================
CREATE TABLE membership_plans (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL UNIQUE,          -- Basic, Silver, Gold, Platinum
    price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_products  INTEGER NOT NULL DEFAULT 5,  -- -1 = unlimited
    features    JSONB NOT NULL DEFAULT '{}',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT NOT NULL,
    phone       TEXT,
    city        TEXT,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'vendor', 'admin')),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VENDOR PROFILES
-- ============================================================
CREATE TABLE vendor_profiles (
    id                  UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    business_name       TEXT NOT NULL,
    business_type       TEXT NOT NULL,  -- Food, Clothing, Crafts, Services
    business_description TEXT,
    whatsapp            TEXT,
    city                TEXT,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    approval_status     TEXT NOT NULL DEFAULT 'pending'
                        CHECK (approval_status IN ('pending','approved','rejected','suspended')),
    rejection_reason    TEXT,
    membership_plan_id  UUID REFERENCES membership_plans(id),
    membership_expires_at TIMESTAMPTZ,
    bank_account        JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES (nested tree)
-- ============================================================
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    parent_id   UUID REFERENCES categories(id),
    icon        TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id       UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES categories(id),
    name            TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
                    CHECK (discount_percent >= 0 AND discount_percent <= 90),
    stock_quantity  INTEGER NOT NULL DEFAULT 0,
    unit            TEXT NOT NULL DEFAULT 'piece',  -- kg, piece, box, litre, dozen
    images          TEXT[] NOT NULL DEFAULT '{}',
    tags            TEXT[] NOT NULL DEFAULT '{}',
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
    review_count    INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GiST spatial index for nearby queries
CREATE INDEX idx_products_location ON products USING GIST (
    point(longitude, latitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_tags ON products USING GIN (tags);
CREATE INDEX idx_products_vendor ON products (vendor_id);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_active ON products (is_active, created_at DESC);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES profiles(id),
    total_amount        NUMERIC(12,2) NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
    payment_method      TEXT NOT NULL DEFAULT 'razorpay',
    payment_status      TEXT NOT NULL DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','paid','failed','refunded')),
    razorpay_payment_id TEXT,
    razorpay_order_id   TEXT,
    delivery_address    JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created ON orders (created_at DESC);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    vendor_id       UUID NOT NULL REFERENCES vendor_profiles(id),
    quantity        INTEGER NOT NULL,
    unit_price      NUMERIC(10,2) NOT NULL,
    total_price     NUMERIC(12,2) NOT NULL,
    product_name    TEXT NOT NULL,  -- snapshot at time of order
    product_image   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_vendor ON order_items (vendor_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(id),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id    UUID NOT NULL REFERENCES orders(id),
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id, order_id)
);

CREATE INDEX idx_reviews_product ON reviews (product_id);

-- ============================================================
-- WISHLISTS
-- ============================================================
CREATE TABLE wishlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists (user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vendor_profiles_updated_at
    BEFORE UPDATE ON vendor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Recalculate product avg_rating after review insert/delete
CREATE OR REPLACE FUNCTION update_product_rating(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE products
    SET avg_rating   = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p_id), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = p_id)
    WHERE id = p_id;
END;
$$;

-- Decrement stock safely
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, qty INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE products
    SET stock_quantity = GREATEST(stock_quantity - qty, 0)
    WHERE id = p_id;
END;
$$;

-- Nearby products using Haversine formula
CREATE OR REPLACE FUNCTION get_nearby_products(
    user_lat  DOUBLE PRECISION,
    user_lng  DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 50,
    cat_id    UUID DEFAULT NULL,
    page_offset INTEGER DEFAULT 0,
    page_limit  INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID, vendor_id UUID, category_id UUID, name TEXT, description TEXT,
    price NUMERIC, discount_percent NUMERIC, stock_quantity INTEGER, unit TEXT,
    images TEXT[], tags TEXT[], latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    avg_rating NUMERIC, review_count INTEGER, is_active BOOLEAN, is_featured BOOLEAN,
    created_at TIMESTAMPTZ, distance_km DOUBLE PRECISION
)
LANGUAGE sql STABLE AS $$
    SELECT
        p.id, p.vendor_id, p.category_id, p.name, p.description,
        p.price, p.discount_percent, p.stock_quantity, p.unit,
        p.images, p.tags, p.latitude, p.longitude,
        p.avg_rating, p.review_count, p.is_active, p.is_featured,
        p.created_at,
        (6371 * acos(
            LEAST(1.0, cos(radians(user_lat)) * cos(radians(p.latitude))
            * cos(radians(p.longitude) - radians(user_lng))
            + sin(radians(user_lat)) * sin(radians(p.latitude)))
        )) AS distance_km
    FROM products p
    WHERE p.is_active = TRUE
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
      AND (cat_id IS NULL OR p.category_id = cat_id)
      AND (6371 * acos(
            LEAST(1.0, cos(radians(user_lat)) * cos(radians(p.latitude))
            * cos(radians(p.longitude) - radians(user_lng))
            + sin(radians(user_lat)) * sin(radians(p.latitude)))
          )) <= radius_km
    ORDER BY distance_km ASC
    LIMIT page_limit OFFSET page_offset;
$$;

-- Vendor total revenue (delivered orders)
CREATE OR REPLACE FUNCTION get_vendor_revenue(v_id UUID)
RETURNS TABLE (total NUMERIC) LANGUAGE sql STABLE AS $$
    SELECT COALESCE(SUM(oi.total_price), 0) AS total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.vendor_id = v_id AND o.status = 'delivered';
$$;

-- Platform stats helpers
CREATE OR REPLACE FUNCTION orders_today_count()
RETURNS TABLE (count BIGINT) LANGUAGE sql STABLE AS $$
    SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE;
$$;

CREATE OR REPLACE FUNCTION monthly_revenue()
RETURNS TABLE (total NUMERIC) LANGUAGE sql STABLE AS $$
    SELECT COALESCE(SUM(total_amount), 0)
    FROM orders
    WHERE payment_status = 'paid'
      AND created_at >= date_trunc('month', NOW());
$$;

CREATE OR REPLACE FUNCTION orders_per_day_30()
RETURNS TABLE (day DATE, count BIGINT) LANGUAGE sql STABLE AS $$
    SELECT DATE(created_at) AS day, COUNT(*) AS count
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day;
$$;

CREATE OR REPLACE FUNCTION revenue_by_category()
RETURNS TABLE (category_name TEXT, total NUMERIC) LANGUAGE sql STABLE AS $$
    SELECT c.name AS category_name, COALESCE(SUM(oi.total_price), 0) AS total
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN categories c ON c.id = p.category_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.payment_status = 'paid'
    GROUP BY c.name
    ORDER BY total DESC;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- profiles: users can read their own, admins can read all
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- vendor_profiles: vendors manage own, public can read approved
CREATE POLICY "vendor_profiles_public_read" ON vendor_profiles
    FOR SELECT USING (approval_status = 'approved');

CREATE POLICY "vendor_profiles_own" ON vendor_profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "vendor_profiles_admin" ON vendor_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- products: public can read active, vendors manage own
CREATE POLICY "products_public_read" ON products
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "products_vendor_manage" ON products
    FOR ALL USING (
        auth.uid() = vendor_id AND
        EXISTS (SELECT 1 FROM vendor_profiles WHERE id = auth.uid() AND approval_status = 'approved')
    );

CREATE POLICY "products_admin" ON products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- orders: users see own orders
CREATE POLICY "orders_user_own" ON orders
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "orders_admin" ON orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- order_items: users see items in their orders, vendors see their items
CREATE POLICY "order_items_user" ON order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
    );

CREATE POLICY "order_items_vendor" ON order_items
    FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "order_items_admin" ON order_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- reviews: public read, authenticated users create own
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (TRUE);

CREATE POLICY "reviews_user_create" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_admin" ON reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- wishlists: users manage own
CREATE POLICY "wishlists_own" ON wishlists
    FOR ALL USING (auth.uid() = user_id);

-- membership_plans: public read
CREATE POLICY "membership_plans_public_read" ON membership_plans
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "membership_plans_admin" ON membership_plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- categories: public read
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (TRUE);

CREATE POLICY "categories_admin" ON categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
