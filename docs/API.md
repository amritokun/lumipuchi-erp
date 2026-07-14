# API Reference

REST APIs exposed by the FastAPI backend server (running at port 8000). All endpoints (except login and signup) require a valid JWT access token passed in the `Authorization` header:
`Authorization: Bearer <access_token>`

---

## Authentication Module

### Sign Up User
* **URL:** `/auth/signup`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "email": "owner@lumipuchi.in",
    "password": "securepassword",
    "name": "Owner User",
    "role": "owner"
  }
  ```
* **Success Response (201 Created):** User object response.

### Log In User
* **URL:** `/auth/login`
* **Method:** `POST`
* **Request Body (form-data):**
  * `username`: Email address
  * `password`: Password
* **Success Response (200 OK):**
  ```json
  {
    "access_token": "jwt-token-string",
    "token_type": "bearer"
  }
  ```

### Get Current User Profile
* **URL:** `/auth/me`
* **Method:** `GET`
* **Success Response (200 OK):** Current logged-in user profile.

---

## Procurement & Supplier Module

### List Suppliers
* **URL:** `/suppliers`
* **Method:** `GET`
* **Success Response (200 OK):** Array of suppliers.

### Create Supplier
* **URL:** `/suppliers`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "name": "Yiwu Factory A",
    "contact_email": "sales@yiwufactory.cn",
    "address": "No. 88 Yiwu Trade Rd, China",
    "country": "China",
    "currency": "CNY"
  }
  ```
* **Success Response (201 Created):** Created supplier details.

---

## Foreign Exchange (Forex) Module

### List Exchange Rates
* **URL:** `/forex`
* **Method:** `GET`
* **Success Response (200 OK):** Active exchange rate conversions.

### Update exchange Rate
* **URL:** `/forex/{currency}`
* **Method:** `PUT`
* **Request Body:**
  ```json
  {
    "rate_to_inr": 11.85
  }
  ```
* **Success Response (200 OK):** Updated rate model.

---

## Purchase Orders (Procurement) Module

### List Purchase Orders
* **URL:** `/purchase-orders`
* **Method:** `GET`
* **Success Response (200 OK):** Array of purchase orders.

### Create Purchase Order
* **URL:** `/purchase-orders`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "po_number": "PO-2026-001",
    "supplier_id": "supplier-uuid",
    "expected_delivery": "2026-08-30",
    "freight_cost_inr": 15000.0,
    "customs_duty_inr": 22000.0,
    "insurance_cost_inr": 1800.0,
    "clearance_cost_inr": 4500.0,
    "local_shipping_inr": 3500.0,
    "items": [
      {
        "sku": "SKU-TOY-A",
        "quantity": 100,
        "unit_price_foreign": 12.5
      }
    ]
  }
  ```
* **Success Response (201 Created):** Created PO details with proportional landed cost allocations.

### Update PO Status (Inventory Transitions)
* **URL:** `/purchase-orders/{po_id}`
* **Method:** `PUT`
* **Request Body:**
  ```json
  {
    "status": "shipped" // or "delivered"
  }
  ```
* **Success Response (200 OK):** Updated PO. (Triggers: `shipped` increases `in_transit_qty` in inventory; `delivered` increases `warehouse_qty` and decreases `in_transit_qty`).

---

## Product Catalog Module

### List Products
* **URL:** `/products`
* **Method:** `GET`
* **Success Response (200 OK):** Array of products.

### Create Product (Initializes Inventory record)
* **URL:** `/products`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "sku": "SKU-TOY-A",
    "name": "Teddy Bear Medium",
    "supplier_id": "supplier-uuid",
    "brand": "ToyBrand",
    "category": "Plush",
    "variant": "Brown",
    "gst_percent": 18.0,
    "weight": 0.350
  }
  ```
* **Success Response (201 Created):** Created product. (Triggers: inserts a corresponding empty `inventory` record).

---

## Inventory Tracking Module

### List Inventory Levels
* **URL:** `/inventory`
* **Method:** `GET`
* **Success Response (200 OK):** Active physical, transit, allocated, and virtual stock levels.

### Adjust Stock Level (Warehouse Audit Log)
* **URL:** `/inventory/{product_id}`
* **Method:** `PUT`
* **Query Parameters:** `reference` (optional audit text)
* **Request Body:**
  ```json
  {
    "warehouse_qty": 120,
    "shelf": "Aisle-C",
    "bin": "Bin-12"
  }
  ```
* **Success Response (200 OK):** Updated stock level. (Triggers: appends an audit `stock_logs` record).

### Get Stock Movement Logs
* **URL:** `/inventory/logs`
* **Method:** `GET`
* **Success Response (200 OK):** Detailed audit logs of all manual and PO stock changes.

---

## Pricing Engine Module

### List Fee Templates
* **URL:** `/pricing/templates`
* **Method:** `GET`
* **Success Response (200 OK):** Array of templates (Amazon FBA, Easy Ship, Meesho, Flipkart).

### Update Fee Template
* **URL:** `/pricing/templates/{template_id}`
* **Method:** `PUT`
* **Request Body:**
  ```json
  {
    "referral_fee_percent": 11.5,
    "fixed_closing_fee": 35.0,
    "weight_handling_fee": 60.0
  }
  ```
* **Success Response (200 OK):** Updated template.

### Calculate Payout Margins
* **URL:** `/pricing/calculate`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "selling_price": 999.0,
    "landed_cost": 250.0,
    "gst_percent": 18.0,
    "template_id": "template-uuid" // optional
  }
  ```
* **Success Response (200 OK):** Net payout base, total fees, outward inclusive GST, and profit margins.

---

## Orders & Returns Syncing Module

### List Synced Orders
* **URL:** `/orders`
* **Method:** `GET`
* **Success Response (200 OK):** Array of synced orders.

### Create Synced Order (Reserves Stock)
* **URL:** `/orders`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "channel_order_id": "AZ-8837",
    "channel_name": "Amazon Easy Ship",
    "customer_name": "Deepak Roy",
    "selling_price": 499.0,
    "items": [
      {
        "product_id": "product-uuid",
        "sku": "SKU-TOY-A",
        "quantity": 2,
        "unit_price": 249.5
      }
    ]
  }
  ```
* **Success Response (201 Created):** Synced order details. (Triggers: increments `allocated_qty` in inventory to reserve stock).

### Update Order Status (Deducts Stock)
* **URL:** `/orders/{order_id}`
* **Method:** `PUT`
* **Request Body:**
  ```json
  {
    "status": "shipped"
  }
  ```
* **Success Response (200 OK):** (Triggers: `shipped` decrements `allocated_qty` and physical `warehouse_qty` by order item amounts and logs a `stock_out`).

### File Returns (Restocks Inventory)
* **URL:** `/returns`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "order_id": "order-uuid",
    "product_id": "product-uuid",
    "sku": "SKU-TOY-A",
    "quantity": 1,
    "reason": "customer_return",
    "status": "restocked",
    "refund_amount": 249.5
  }
  ```
* **Success Response (201 Created):** (Triggers: `restocked` increments `warehouse_qty` of product inventory).
