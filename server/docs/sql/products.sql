-- =============================================================================
-- Sigma Infotech — Products Table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CREATE TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT          NOT NULL UNIQUE,
  name                TEXT          NOT NULL,
  brand               TEXT          NOT NULL,
  description         TEXT,
  specs_short         TEXT,                        -- e.g. "i5-8350U · 8GB RAM · 256GB SSD · 14\""
  sku                 TEXT          NOT NULL UNIQUE,
  price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  price_formatted     TEXT          NOT NULL,       -- e.g. "₹19,999"
  price_old           NUMERIC(10,2) CHECK (price_old >= 0),
  price_old_formatted TEXT,                         -- e.g. "₹22,999"
  category            TEXT          NOT NULL CHECK (category IN ('laptop', 'desktop', 'printer', 'accessory', 'other')),
  condition           TEXT          NOT NULL CHECK (condition IN ('excellent', 'good', 'fair')),
  grade               TEXT          NOT NULL,       -- "Excellent" | "Good" | "Fair"
  grade_class         TEXT          NOT NULL DEFAULT '',  -- "" | "grade-good" | "grade-fair"
  icon_type           TEXT          NOT NULL DEFAULT 'laptop' CHECK (icon_type IN ('laptop', 'desktop', 'printer')),
  stock               INTEGER       NOT NULL DEFAULT 1 CHECK (stock >= 0),
  rating              NUMERIC(2,1)  DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count        INTEGER       DEFAULT 0 CHECK (review_count >= 0),
  featured            BOOLEAN       NOT NULL DEFAULT FALSE,
  images              TEXT[]        DEFAULT '{}',
  thumbnail           TEXT,
  specifications      JSONB         NOT NULL DEFAULT '[]',  -- array of [label, value] tuples
  tags                TEXT[]        DEFAULT '{}',
  status              TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------

-- Unique slug lookup (product detail page)
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx
  ON public.products (slug);

-- Filter by category
CREATE INDEX IF NOT EXISTS products_category_idx
  ON public.products (category);

-- Filter by status (always filter active-only in public APIs)
CREATE INDEX IF NOT EXISTS products_status_idx
  ON public.products (status);

-- Featured products homepage query
CREATE INDEX IF NOT EXISTS products_featured_idx
  ON public.products (featured)
  WHERE featured = TRUE;

-- Price range sorting
CREATE INDEX IF NOT EXISTS products_price_idx
  ON public.products (price);

-- Condition grade filter
CREATE INDEX IF NOT EXISTS products_condition_idx
  ON public.products (condition);

-- Full-text search on name + description
CREATE INDEX IF NOT EXISTS products_search_idx
  ON public.products
  USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(description, '')));

-- ---------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGER — auto-update on every row change
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can read active products
CREATE POLICY "Public can read active products"
  ON public.products
  FOR SELECT
  USING (status = 'active');

-- Admin write: only service-role (backend) can insert/update/delete
-- The backend uses the service-role key which bypasses RLS automatically.
-- These policies guard direct DB access for extra safety.

CREATE POLICY "Service role can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update products"
  ON public.products
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete products"
  ON public.products
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 5. SEED DATA — All 8 products from frontend/lib/products.js
-- ---------------------------------------------------------------------------

INSERT INTO public.products (
  slug, name, brand, description, specs_short, sku,
  price, price_formatted, price_old, price_old_formatted,
  category, condition, grade, grade_class, icon_type,
  stock, featured, specifications, tags, status
) VALUES

-- 1. Dell Latitude 7490
(
  'dell-latitude-7490',
  'Dell Latitude 7490 — 14" Business Laptop',
  'Dell · Latitude Series',
  'Lightweight business laptop, fully cleaned, tested and re-certified by our technicians. Battery, keyboard and display checked for full working condition before listing.',
  'i5-8350U · 8GB RAM · 256GB SSD · 14"',
  'SKU-DL-7490-001',
  19999.00, '₹19,999', 22999.00, '₹22,999',
  'laptop', 'excellent', 'Excellent', '', 'laptop',
  1, TRUE,
  '[
    ["Processor", "Intel Core i5-8350U (8th Gen)"],
    ["RAM", "8GB DDR4"],
    ["Storage", "256GB SSD"],
    ["Display", "14\" FHD (1920×1080)"],
    ["Graphics", "Intel UHD 620 (Integrated)"],
    ["Battery Health", "Tested — holds charge normally"],
    ["Condition Grade", "Excellent — minimal cosmetic wear"],
    ["Included", "Original charger, cleaned chassis"]
  ]'::jsonb,
  ARRAY['dell', 'latitude', 'business', 'laptop', '8th-gen', 'i5'],
  'active'
),

-- 2. HP EliteBook 840 G5
(
  'hp-elitebook-840-g5',
  'HP EliteBook 840 G5 — 14" Business Laptop',
  'HP · EliteBook Series',
  'Reliable business laptop, fully cleaned, tested and re-certified by our technicians. Battery, keyboard and display checked for full working condition before listing.',
  'i5-8250U · 8GB RAM · 512GB SSD · 14"',
  'SKU-HP-840G5-001',
  21499.00, '₹21,499', 24499.00, '₹24,499',
  'laptop', 'good', 'Good', 'grade-good', 'laptop',
  1, TRUE,
  '[
    ["Processor", "Intel Core i5-8250U (8th Gen)"],
    ["RAM", "8GB DDR4"],
    ["Storage", "512GB SSD"],
    ["Display", "14\" FHD (1920×1080)"],
    ["Graphics", "Intel UHD 620 (Integrated)"],
    ["Battery Health", "Tested — good capacity"],
    ["Condition Grade", "Good — light cosmetic wear"],
    ["Included", "Original charger"]
  ]'::jsonb,
  ARRAY['hp', 'elitebook', 'business', 'laptop', '8th-gen', 'i5'],
  'active'
),

-- 3. Lenovo ThinkPad T480
(
  'lenovo-thinkpad-t480',
  'Lenovo ThinkPad T480 — 14" Business Laptop',
  'Lenovo · ThinkPad Series',
  'High-spec business laptop, fully cleaned, tested and re-certified by our technicians. Battery, keyboard and display checked for full working condition before listing.',
  'i7-8550U · 16GB RAM · 512GB SSD · 14"',
  'SKU-LN-T480-001',
  26999.00, '₹26,999', 30999.00, '₹30,999',
  'laptop', 'excellent', 'Excellent', '', 'laptop',
  1, TRUE,
  '[
    ["Processor", "Intel Core i7-8550U (8th Gen)"],
    ["RAM", "16GB DDR4"],
    ["Storage", "512GB SSD"],
    ["Display", "14\" FHD (1920×1080)"],
    ["Graphics", "Intel UHD 620 (Integrated)"],
    ["Battery Health", "Tested — holds charge normally"],
    ["Condition Grade", "Excellent — minimal cosmetic wear"],
    ["Included", "Original charger, cleaned chassis"]
  ]'::jsonb,
  ARRAY['lenovo', 'thinkpad', 'business', 'laptop', '8th-gen', 'i7'],
  'active'
),

-- 4. Acer Aspire 5
(
  'acer-aspire-5',
  'Acer Aspire 5 — 15.6" Everyday Laptop',
  'Acer · Aspire Series',
  'Budget-friendly everyday laptop, fully cleaned and tested by our technicians. Ideal for browsing, office work and study use.',
  'i3-7100U · 4GB RAM · 500GB HDD · 15.6"',
  'SKU-AC-A5-001',
  12999.00, '₹12,999', 15499.00, '₹15,499',
  'laptop', 'fair', 'Fair', 'grade-fair', 'laptop',
  1, FALSE,
  '[
    ["Processor", "Intel Core i3-7100U (7th Gen)"],
    ["RAM", "4GB DDR4"],
    ["Storage", "500GB HDD"],
    ["Display", "15.6\" HD (1366×768)"],
    ["Graphics", "Intel HD 620 (Integrated)"],
    ["Battery Health", "Tested — reduced capacity"],
    ["Condition Grade", "Fair — visible cosmetic wear"],
    ["Included", "Charger"]
  ]'::jsonb,
  ARRAY['acer', 'aspire', 'student', 'laptop', 'budget', 'i3'],
  'active'
),

-- 5. Dell OptiPlex 7050 SFF
(
  'dell-optiplex-7050-sff',
  'Dell OptiPlex 7050 SFF — Desktop Tower',
  'Dell · OptiPlex Series',
  'Compact small-form-factor desktop, fully cleaned, tested and re-certified by our technicians. Great for home or office use.',
  'i5-6500 · 8GB RAM · 256GB SSD',
  'SKU-DL-OP7050-001',
  17999.00, '₹17,999', 20999.00, '₹20,999',
  'desktop', 'good', 'Good', 'grade-good', 'desktop',
  1, FALSE,
  '[
    ["Processor", "Intel Core i5-6500"],
    ["RAM", "8GB DDR4"],
    ["Storage", "256GB SSD"],
    ["Form Factor", "Small Form Factor (SFF)"],
    ["Graphics", "Intel HD 530 (Integrated)"],
    ["Condition Grade", "Good — light cosmetic wear"],
    ["Included", "Power cable (monitor/keyboard/mouse sold separately)"]
  ]'::jsonb,
  ARRAY['dell', 'optiplex', 'desktop', 'sff', 'office', 'i5'],
  'active'
),

-- 6. HP ProDesk 600 G4
(
  'hp-prodesk-600-g4',
  'HP ProDesk 600 G4 — Desktop Tower',
  'HP · ProDesk Series',
  'High-performance small-form-factor desktop, fully cleaned, tested and re-certified by our technicians.',
  'i7-8700 · 16GB RAM · 512GB SSD',
  'SKU-HP-PD600G4-001',
  24999.00, '₹24,999', 28999.00, '₹28,999',
  'desktop', 'excellent', 'Excellent', '', 'desktop',
  1, FALSE,
  '[
    ["Processor", "Intel Core i7-8700"],
    ["RAM", "16GB DDR4"],
    ["Storage", "512GB SSD"],
    ["Form Factor", "Small Form Factor (SFF)"],
    ["Graphics", "Intel UHD 630 (Integrated)"],
    ["Condition Grade", "Excellent — minimal cosmetic wear"],
    ["Included", "Power cable (monitor/keyboard/mouse sold separately)"]
  ]'::jsonb,
  ARRAY['hp', 'prodesk', 'desktop', 'sff', 'office', 'i7'],
  'active'
),

-- 7. Canon PIXMA G2010
(
  'canon-pixma-g2010',
  'Canon PIXMA G2010 — Ink Tank Printer',
  'Canon · PIXMA Series',
  'Ink tank printer with print and scan, tested by our technicians for smooth ink flow and clean output.',
  'Ink tank · Print & Scan',
  'SKU-CN-G2010-001',
  4499.00, '₹4,499', 5999.00, '₹5,999',
  'printer', 'good', 'Good', 'grade-good', 'printer',
  1, FALSE,
  '[
    ["Type", "Ink tank (print & scan)"],
    ["Connectivity", "USB"],
    ["Print Speed", "Up to 8.8 ipm (mono)"],
    ["Condition Grade", "Good — tested ink system"],
    ["Included", "Power cable, USB cable"]
  ]'::jsonb,
  ARRAY['canon', 'pixma', 'printer', 'ink-tank', 'scanner'],
  'active'
),

-- 8. HP LaserJet P1102
(
  'hp-laserjet-p1102',
  'HP LaserJet P1102 — Mono Laser Printer',
  'HP · LaserJet Series',
  'Compact mono laser printer, tested for print quality and reliability by our technicians.',
  'Mono laser · Print only',
  'SKU-HP-P1102-001',
  3199.00, '₹3,199', 4299.00, '₹4,299',
  'printer', 'fair', 'Fair', 'grade-fair', 'printer',
  1, FALSE,
  '[
    ["Type", "Mono laser (print only)"],
    ["Connectivity", "USB"],
    ["Print Speed", "Up to 18 ppm"],
    ["Condition Grade", "Fair — visible cosmetic wear"],
    ["Included", "Power cable, USB cable"]
  ]'::jsonb,
  ARRAY['hp', 'laserjet', 'printer', 'laser', 'mono'],
  'active'
);

-- ---------------------------------------------------------------------------
-- 6. VERIFY
-- ---------------------------------------------------------------------------

SELECT slug, name, category, condition, price_formatted, featured, status
FROM public.products
ORDER BY category, price;
