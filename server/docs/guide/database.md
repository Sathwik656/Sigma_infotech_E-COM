# Database Documentation — Sigma Infotech

## Overview

All data is stored in **Supabase PostgreSQL**.  
The backend uses the **service-role** client (bypasses RLS) for all writes.  
Public reads go through the `active` status filter enforced at the API level.

---

## Tables

### `products`

The core product catalog table.

| Column               | Type           | Constraints                              | Description                                      |
|----------------------|----------------|------------------------------------------|--------------------------------------------------|
| `id`                 | `uuid`         | PK, default `gen_random_uuid()`          | Primary key                                      |
| `slug`               | `text`         | NOT NULL, UNIQUE                         | URL-friendly identifier (e.g. `dell-latitude-7490`) |
| `name`               | `text`         | NOT NULL                                 | Full product name with variant (e.g. `Dell Latitude 7490 — 14" Business Laptop`) |
| `brand`              | `text`         | NOT NULL                                 | Brand + series (e.g. `Dell · Latitude Series`)  |
| `description`        | `text`         | nullable                                 | Long description shown on product detail page   |
| `specs_short`        | `text`         | nullable                                 | Short spec summary for cards (e.g. `i5 · 8GB · 256GB`) |
| `sku`                | `text`         | NOT NULL, UNIQUE                         | Stock-keeping unit identifier                   |
| `price`              | `numeric(10,2)`| NOT NULL, >= 0                           | Numeric price in INR                            |
| `price_formatted`    | `text`         | NOT NULL                                 | Formatted price string (e.g. `₹19,999`)         |
| `price_old`          | `numeric(10,2)`| nullable, >= 0                           | Original/strikethrough price                    |
| `price_old_formatted`| `text`         | nullable                                 | Formatted original price (e.g. `₹22,999`)       |
| `category`           | `text`         | NOT NULL, CHECK enum                     | `laptop` / `desktop` / `printer` / `accessory` / `other` |
| `condition`          | `text`         | NOT NULL, CHECK enum                     | `excellent` / `good` / `fair`                   |
| `grade`              | `text`         | NOT NULL                                 | Display grade (e.g. `Excellent`, `Good`, `Fair`) |
| `grade_class`        | `text`         | NOT NULL, default `''`                   | CSS class for color (e.g. `grade-good`, `grade-fair`) |
| `icon_type`          | `text`         | NOT NULL, CHECK enum, default `laptop`   | `laptop` / `desktop` / `printer`                |
| `stock`              | `integer`      | NOT NULL, >= 0, default `1`              | Units in stock                                  |
| `rating`             | `numeric(2,1)` | 0.0–5.0, default `0.0`                   | Average customer rating                         |
| `review_count`       | `integer`      | >= 0, default `0`                        | Number of customer reviews                      |
| `featured`           | `boolean`      | NOT NULL, default `FALSE`               | Whether shown in the featured section           |
| `images`             | `text[]`       | default `{}`                             | Array of image URLs (for Supabase Storage)      |
| `thumbnail`          | `text`         | nullable                                 | Primary thumbnail URL                           |
| `specifications`     | `jsonb`        | NOT NULL, default `[]`                   | Array of `[label, value]` tuples                |
| `tags`               | `text[]`       | default `{}`                             | Search/filter tags                              |
| `status`             | `text`         | NOT NULL, CHECK enum, default `active`   | `active` / `inactive` / `draft`                 |
| `created_at`         | `timestamptz`  | NOT NULL, default `NOW()`               | Row creation time                               |
| `updated_at`         | `timestamptz`  | NOT NULL, default `NOW()`               | Auto-updated on every change via trigger         |

#### Indexes

| Index Name                  | Columns                  | Type    | Purpose                                |
|-----------------------------|--------------------------|---------|----------------------------------------|
| `products_slug_idx`         | `slug`                   | UNIQUE  | Fast lookup by URL slug                |
| `products_category_idx`     | `category`               | BTREE   | Filter by category                     |
| `products_status_idx`       | `status`                 | BTREE   | Always filter active products          |
| `products_featured_idx`     | `featured` WHERE `= TRUE`| PARTIAL | Fast homepage featured query           |
| `products_price_idx`        | `price`                  | BTREE   | Price range sorting                    |
| `products_condition_idx`    | `condition`              | BTREE   | Condition grade filtering              |
| `products_search_idx`       | `name + brand + desc`    | GIN     | Full-text search (tsvector)            |

#### Triggers

| Trigger Name                  | Event         | Function            | Purpose                        |
|-------------------------------|---------------|---------------------|--------------------------------|
| `products_set_updated_at`     | BEFORE UPDATE | `set_updated_at()`  | Auto-update `updated_at` field |

#### Row Level Security

| Policy Name                           | Operation | Rule                                  |
|---------------------------------------|-----------|---------------------------------------|
| `Public can read active products`     | SELECT    | `status = 'active'`                   |
| `Service role can insert products`    | INSERT    | `auth.role() = 'service_role'`        |
| `Service role can update products`    | UPDATE    | `auth.role() = 'service_role'`        |
| `Service role can delete products`    | DELETE    | `auth.role() = 'service_role'`        |

---

## Relationships

Currently, the `products` table is standalone. Future foreign key relationships:

```
products.category ←→ categories.slug  (future)
products.id ←→ order_items.product_id  (future)
products.id ←→ wishlist_items.product_id  (future)
products.id ←→ cart_items.product_id  (future)
products.id ←→ reviews.product_id  (future)
```

---

## Future Tables

### `categories`
| Column        | Type    | Description              |
|---------------|---------|--------------------------|
| `id`          | uuid    | Primary key              |
| `slug`        | text    | URL slug                 |
| `name`        | text    | Display name             |
| `description` | text    | Short description        |
| `icon`        | text    | SVG icon string          |
| `href`        | text    | Navigation link          |
| `created_at`  | timestamptz | Auto timestamp       |

---

### `orders`
| Column          | Type        | Description               |
|-----------------|-------------|---------------------------|
| `id`            | uuid        | Primary key               |
| `user_id`       | uuid        | FK → auth.users           |
| `status`        | text        | pending / paid / shipped / cancelled |
| `total_amount`  | numeric     | Total order value         |
| `created_at`    | timestamptz | Order placed time         |
| `updated_at`    | timestamptz | Last status change        |

---

### `order_items`
| Column       | Type        | Description               |
|--------------|-------------|---------------------------|
| `id`         | uuid        | Primary key               |
| `order_id`   | uuid        | FK → orders               |
| `product_id` | uuid        | FK → products             |
| `quantity`   | integer     | Quantity ordered          |
| `unit_price` | numeric     | Price at time of purchase |

---

### `wishlist`
| Column       | Type        | Description               |
|--------------|-------------|---------------------------|
| `id`         | uuid        | Primary key               |
| `user_id`    | uuid        | FK → auth.users           |
| `product_id` | uuid        | FK → products             |
| `created_at` | timestamptz | When added                |

---

### `cart_items`
| Column       | Type        | Description               |
|--------------|-------------|---------------------------|
| `id`         | uuid        | Primary key               |
| `user_id`    | uuid        | FK → auth.users           |
| `product_id` | uuid        | FK → products             |
| `quantity`   | integer     | Quantity in cart          |
| `created_at` | timestamptz | When added                |

---

### `reviews`
| Column       | Type        | Description               |
|--------------|-------------|---------------------------|
| `id`         | uuid        | Primary key               |
| `user_id`    | uuid        | FK → auth.users           |
| `product_id` | uuid        | FK → products             |
| `rating`     | numeric(2,1)| 1.0–5.0                   |
| `comment`    | text        | Review body               |
| `created_at` | timestamptz | Review date               |

---

## Migration Notes

- All schema changes should be tracked as numbered SQL files in `server/docs/sql/`
- Run scripts in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
- The `service_role` key on the backend bypasses RLS — never expose it to the frontend
