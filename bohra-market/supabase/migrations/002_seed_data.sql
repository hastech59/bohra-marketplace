-- ============================================================
-- Bohra Market — Seed Data
-- ============================================================

-- ── Membership Plans ─────────────────────────────────────────
INSERT INTO membership_plans (name, price_monthly, max_products, features, sort_order) VALUES
(
    'Basic', 0, 5,
    '{"badge": "basic", "featured_listings": false, "priority_placement": false, "analytics": false, "whatsapp_support": false}',
    1
),
(
    'Silver', 299, 30,
    '{"badge": "silver", "featured_listings": false, "priority_placement": false, "analytics": true, "whatsapp_support": true}',
    2
),
(
    'Gold', 599, 100,
    '{"badge": "gold", "featured_listings": true, "priority_placement": false, "analytics": true, "whatsapp_support": true, "homepage_banner": false}',
    3
),
(
    'Platinum', 999, -1,
    '{"badge": "platinum", "featured_listings": true, "priority_placement": true, "analytics": true, "whatsapp_support": true, "homepage_banner": true, "dedicated_support": true}',
    4
);

-- ── Categories (Bohra product tree) ──────────────────────────

-- Top-level categories
INSERT INTO categories (id, name, slug, parent_id, icon, sort_order) VALUES
(uuid_generate_v4(), 'Food & Groceries',    'food-groceries',    NULL, '🍱', 1),
(uuid_generate_v4(), 'Clothing & Accessories', 'clothing-accessories', NULL, '👗', 2),
(uuid_generate_v4(), 'Handmade Crafts',     'handmade-crafts',   NULL, '🧵', 3),
(uuid_generate_v4(), 'Services',            'services',          NULL, '🛎️', 4);

-- Food sub-categories
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Pickles & Achaar', 'pickles-achaar', id, '🫙', 1
FROM categories WHERE slug = 'food-groceries';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Mithai & Sweets', 'mithai-sweets', id, '🍬', 2
FROM categories WHERE slug = 'food-groceries';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Home-cooked Meals & Tiffin', 'tiffin-meals', id, '🥘', 3
FROM categories WHERE slug = 'food-groceries';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Dry Fruits & Nuts', 'dry-fruits', id, '🥜', 4
FROM categories WHERE slug = 'food-groceries';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Spices & Masala', 'spices-masala', id, '🌶️', 5
FROM categories WHERE slug = 'food-groceries';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Bakery & Snacks', 'bakery-snacks', id, '🥐', 6
FROM categories WHERE slug = 'food-groceries';

-- Clothing sub-categories
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Rida', 'rida', id, '👘', 1
FROM categories WHERE slug = 'clothing-accessories';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Topi', 'topi', id, '🎩', 2
FROM categories WHERE slug = 'clothing-accessories';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Kurta & Shalwar', 'kurta-shalwar', id, '👔', 3
FROM categories WHERE slug = 'clothing-accessories';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Jewellery & Accessories', 'jewellery', id, '💍', 4
FROM categories WHERE slug = 'clothing-accessories';

-- Crafts sub-categories
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Embroidery & Zardozi', 'embroidery', id, '🪡', 1
FROM categories WHERE slug = 'handmade-crafts';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Pottery & Ceramics', 'pottery', id, '🏺', 2
FROM categories WHERE slug = 'handmade-crafts';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Candles & Home Decor', 'candles-decor', id, '🕯️', 3
FROM categories WHERE slug = 'handmade-crafts';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Handmade Bags & Purses', 'bags-purses', id, '👜', 4
FROM categories WHERE slug = 'handmade-crafts';

-- Services sub-categories
INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Catering & Event Food', 'catering', id, '🍽️', 1
FROM categories WHERE slug = 'services';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Tailoring & Stitching', 'tailoring', id, '✂️', 2
FROM categories WHERE slug = 'services';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Mehendi & Beauty', 'mehendi-beauty', id, '💅', 3
FROM categories WHERE slug = 'services';

INSERT INTO categories (name, slug, parent_id, icon, sort_order)
SELECT 'Home Tutoring', 'tutoring', id, '📚', 4
FROM categories WHERE slug = 'services';
