# Product API Documentation

**Base URL:** `http://localhost:5000`  
**All public endpoints require no authentication.**  
**Admin endpoints require:** `Authorization: Bearer <access_token>` + admin role in user_metadata.

---

## Endpoints

### 1. `GET /api/products`

Returns a paginated list of active products with optional filtering and sorting.

**Query Parameters**

| Param       | Type    | Default    | Description                                               |
|-------------|---------|------------|-----------------------------------------------------------|
| `page`      | number  | `1`        | Page number                                               |
| `limit`     | number  | `20`       | Items per page (max 100)                                  |
| `category`  | string  | —          | Filter by category: `laptop`, `desktop`, `printer`        |
| `condition` | string  | —          | Filter by condition: `excellent`, `good`, `fair`          |
| `search`    | string  | —          | Search by name, brand, or specs                           |
| `featured`  | boolean | —          | `true` to return only featured products                   |
| `sort`      | string  | `relevance`| `price-asc`, `price-desc`, `newest`, `relevance`          |

**Example Request**
```
GET /api/products?category=laptop&sort=price-asc&page=1&limit=10
```

**Example Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "slug": "dell-latitude-7490",
      "name": "Dell Latitude 7490 — 14\" Business Laptop",
      "brand": "Dell · Latitude Series",
      "description": "Lightweight business laptop...",
      "specs_short": "i5-8350U · 8GB RAM · 256GB SSD · 14\"",
      "sku": "SKU-DL-7490-001",
      "price": 19999.00,
      "price_formatted": "₹19,999",
      "price_old": 22999.00,
      "price_old_formatted": "₹22,999",
      "category": "laptop",
      "condition": "excellent",
      "grade": "Excellent",
      "grade_class": "",
      "icon_type": "laptop",
      "stock": 1,
      "rating": 0.0,
      "review_count": 0,
      "featured": true,
      "images": [],
      "thumbnail": null,
      "specifications": [
        ["Processor", "Intel Core i5-8350U (8th Gen)"],
        ["RAM", "8GB DDR4"]
      ],
      "tags": ["dell", "latitude", "business", "laptop"],
      "status": "active",
      "created_at": "2026-07-11T00:00:00.000Z",
      "updated_at": "2026-07-11T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1
  }
}
```

**Status Codes**
| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Invalid query parameters |
| 500  | Server error |

---

### 2. `GET /api/products/:slug`

Returns a single active product by its URL slug.

**Example Request**
```
GET /api/products/dell-latitude-7490
```

**Example Response**
```json
{
  "success": true,
  "data": { /* full product object — same shape as above */ }
}
```

**Status Codes**
| Code | Meaning |
|------|---------|
| 200  | Product found |
| 404  | Product not found or inactive |
| 500  | Server error |

---

### 3. `GET /api/products/:slug/related`

Returns up to 3 related products in the same category, excluding the current product.

**Query Parameters**

| Param   | Type   | Default | Description                   |
|---------|--------|---------|-------------------------------|
| `limit` | number | `3`     | Max related products (max 10) |

**Example Request**
```
GET /api/products/dell-latitude-7490/related?limit=3
```

**Example Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "hp-elitebook-840-g5",
      "name": "HP EliteBook 840 G5 — 14\" Business Laptop",
      "brand": "HP · EliteBook Series",
      "specs_short": "i5-8250U · 8GB RAM · 512GB SSD · 14\"",
      "price_formatted": "₹21,499",
      "grade": "Good",
      "grade_class": "grade-good",
      "icon_type": "laptop",
      "category": "laptop",
      "condition": "good"
    }
  ]
}
```

---

### 4. `GET /api/products/id/:id` *(Admin only)*

Returns a product by UUID, regardless of status.

**Headers:** `Authorization: Bearer <token>`  
**Admin role required.**

**Example Request**
```
GET /api/products/id/550e8400-e29b-41d4-a716-446655440000
```

---

### 5. `POST /api/products` *(Admin only)*

Create a new product.

**Headers:** `Authorization: Bearer <token>`  
**Admin role required.**

**Request Body**
```json
{
  "slug": "lenovo-ideapad-330",
  "name": "Lenovo IdeaPad 330 — 15.6\" Laptop",
  "brand": "Lenovo · IdeaPad Series",
  "description": "Budget-friendly daily driver...",
  "specs_short": "i3-7020U · 4GB RAM · 1TB HDD · 15.6\"",
  "sku": "SKU-LN-IP330-001",
  "price": 9999.00,
  "price_formatted": "₹9,999",
  "price_old": 12999.00,
  "price_old_formatted": "₹12,999",
  "category": "laptop",
  "condition": "fair",
  "grade": "Fair",
  "grade_class": "grade-fair",
  "icon_type": "laptop",
  "stock": 1,
  "featured": false,
  "specifications": [
    ["Processor", "Intel Core i3-7020U"],
    ["RAM", "4GB DDR4"]
  ],
  "tags": ["lenovo", "ideapad", "budget", "laptop"],
  "status": "active"
}
```

**Example Response**
```json
{
  "success": true,
  "message": "Product created successfully.",
  "data": { /* created product object */ }
}
```

**Status Codes**
| Code | Meaning |
|------|---------|
| 201  | Product created |
| 400  | Validation failed |
| 401  | Not authenticated |
| 403  | Not an admin |
| 409  | Duplicate slug or SKU |
| 500  | Server error |

---

### 6. `PUT /api/products/:id` *(Admin only)*

Update a product by UUID. All fields are optional.

**Headers:** `Authorization: Bearer <token>`  
**Admin role required.**

**Example Request**
```
PUT /api/products/550e8400-e29b-41d4-a716-446655440000
```

**Request Body (partial update)**
```json
{
  "price": 17999.00,
  "price_formatted": "₹17,999",
  "stock": 2,
  "featured": true
}
```

**Status Codes**
| Code | Meaning |
|------|---------|
| 200  | Updated |
| 400  | Validation failed |
| 401  | Not authenticated |
| 403  | Not an admin |
| 404  | Product not found |
| 409  | Duplicate slug or SKU |

---

### 7. `DELETE /api/products/:id` *(Admin only)*

Soft-delete a product by setting `status = 'inactive'`. No data is permanently removed.

**Headers:** `Authorization: Bearer <token>`  
**Admin role required.**

**Example Request**
```
DELETE /api/products/550e8400-e29b-41d4-a716-446655440000
```

**Example Response**
```json
{
  "success": true,
  "message": "Product deactivated successfully.",
  "data": { /* product with status: "inactive" */ }
}
```

**Status Codes**
| Code | Meaning |
|------|---------|
| 200  | Deactivated |
| 401  | Not authenticated |
| 403  | Not an admin |
| 404  | Product not found |

---

## Granting Admin Access

To make a user an admin, run the following SQL in the **Supabase SQL Editor**:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@yourdomain.com';
```

The `requireAdmin` middleware on the server will then allow that user to access write endpoints.

---

## Error Response Shape

All error responses follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error description."
}
```

Validation errors include an `errors` array:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "price", "message": "price must be a positive number" },
    { "field": "slug",  "message": "slug is required" }
  ]
}
```
