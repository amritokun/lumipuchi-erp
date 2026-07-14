# Database Schema & Models

Lumipuchi ERP uses a PostgreSQL relational database. Below are the schema definitions for the implemented modules.

## Modules

### Users & Authentication

#### `users` Table
Stores user account credentials, profile details, and role permissions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Unique user ID (UUID) |
| `email` | `VARCHAR` | Unique, Index, Nullable=False | User email address used for login |
| `hashed_password` | `VARCHAR` | Nullable=False | Cryptographically hashed password (bcrypt) |
| `name` | `VARCHAR` | Nullable=False | Display name of the user |
| `role` | `ENUM` | Default: `'viewer'`, Nullable=False | Access level (Owner, Manager, Warehouse, Finance, Viewer) |
| `is_active` | `BOOLEAN` | Default: `True`, Nullable=False | User status flag |

##### Role Enumeration (`userrole`)
- `owner`: Full system settings, database management, and administrative control.
- `manager`: Access to Inventory, Suppliers, Purchase Orders, and Reports.
- `warehouse`: Access to warehouse physical stock movements, printing product labels.
- `finance`: Access to Purchase Orders, import costs, foreign exchange rates, and financial reports.
- `viewer`: Read-only access to basic dashboards.

---

### Procurement & Supplier Management

#### `suppliers` Table
Stores international supplier details and their billing details.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Unique supplier ID |
| `name` | `VARCHAR` | Nullable=False | Name of supplier |
| `contact_email` | `VARCHAR` | Nullable=True | Main contact email |
| `address` | `VARCHAR` | Nullable=True | Factory address |
| `country` | `VARCHAR` | Default: `'China'`, Nullable=False | Origin country |
| `currency` | `VARCHAR` | Default: `'USD'`, Nullable=False | Settlement currency |
| `is_active` | `BOOLEAN` | Default: `True`, Nullable=False | Active flag |

#### `forex_rates` Table
Stores foreign exchange rates relative to INR.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `currency` | `VARCHAR` | Primary Key, Unique, Index | Currency symbol (e.g. 'USD', 'CNY') |
| `rate_to_inr` | `DOUBLE PRECISION` | Nullable=False | Rate (e.g. 1 CNY = 11.5 INR) |
| `updated_at` | `TIMESTAMP` | Default: `now()` | Timestamp of last rate check |

#### `purchase_orders` Table
Tracks global procurement orders from international factories.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Unique purchase order ID |
| `po_number` | `VARCHAR` | Unique, Index, Nullable=False | PO invoice reference (e.g. PO-2026-001) |
| `supplier_id` | `VARCHAR` | ForeignKey(`suppliers.id`), Nullable=False | Associated supplier |
| `status` | `VARCHAR` | Default: `'draft'`, Nullable=False | Status (draft, ordered, shipped, delivered, cancelled) |
| `issue_date` | `DATE` | Default: `today()` | Creation/Issue date |
| `expected_delivery` | `DATE` | Nullable=True | Estimated arrival |
| `currency` | `VARCHAR` | Nullable=False | FX currency used |
| `exchange_rate` | `DOUBLE PRECISION` | Default: `1.0` | Exchange rate applied |
| `freight_cost_inr` | `DOUBLE PRECISION` | Default: `0.0` | Landed cost: freight charge |
| `customs_duty_inr` | `DOUBLE PRECISION` | Default: `0.0` | Landed cost: government custom duty |
| `insurance_cost_inr` | `DOUBLE PRECISION` | Default: `0.0` | Landed cost: cargo transit insurance |
| `clearance_cost_inr` | `DOUBLE PRECISION` | Default: `0.0` | Landed cost: port clearance fee |
| `local_shipping_inr` | `DOUBLE PRECISION` | Default: `0.0` | Landed cost: local warehouse freight |
| `total_amount_foreign` | `DOUBLE PRECISION` | Default: `0.0` | PO ex-factory sum in foreign FX |
| `total_amount_inr` | `DOUBLE PRECISION` | Default: `0.0` | Calculated base cost in INR |

#### `purchase_order_items` Table
Line items inside a purchase order.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Item ID |
| `po_id` | `VARCHAR` | ForeignKey(`purchase_orders.id`), Nullable=False | Associated PO |
| `sku` | `VARCHAR` | Nullable=False, Index | Product SKU |
| `quantity` | `INTEGER` | Nullable=False | Units ordered |
| `unit_price_foreign` | `DOUBLE PRECISION` | Nullable=False | Cost per unit in foreign currency |
| `landed_cost_inr_per_unit` | `DOUBLE PRECISION` | Default: `0.0` | Allocated landed cost per unit in INR |

---

### Product Catalog & Inventory Tracking

#### `products` Table
Stores specifications of the items catalog.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Product UUID |
| `sku` | `VARCHAR` | Unique, Index, Nullable=False | Stock Keeping Unit |
| `catalogue_id` | `VARCHAR` | Nullable=True | Shared catalog catalog reference |
| `brand` | `VARCHAR` | Nullable=True | Brand name |
| `name` | `VARCHAR` | Nullable=False | Item name |
| `description` | `VARCHAR` | Nullable=True | Description |
| `category` | `VARCHAR` | Nullable=True | Product category |
| `variant` | `VARCHAR` | Nullable=True | Variant specification |
| `color` | `VARCHAR` | Nullable=True | Product color |
| `supplier_id` | `VARCHAR` | ForeignKey(`suppliers.id`), Nullable=False | Primary supplier |
| `supplier_sku` | `VARCHAR` | Nullable=True | Supplier specification SKU code |
| `hsn` | `VARCHAR` | Nullable=True | HSN code |
| `gst_percent` | `DOUBLE PRECISION` | Default: `18.0` | Outward GST percentage |
| `weight` | `DOUBLE PRECISION` | Default: `0.0` | Item weight in Kg |
| `dimensions` | `VARCHAR` | Nullable=True | Size (LxWxH) |
| `barcode` | `VARCHAR` | Nullable=True | EAN/UPC Barcode |
| `qrcode` | `VARCHAR` | Nullable=True | QR identifier |
| `is_active` | `BOOLEAN` | Default: `True` | Catalog status |

#### `inventory` Table
Tracks real-time stock levels.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Inventory UUID |
| `product_id` | `VARCHAR` | ForeignKey(`products.id`), Unique, Nullable=False | Associated product |
| `warehouse_qty` | `INTEGER` | Default: `0` | Physical stock in warehouse |
| `in_transit_qty` | `INTEGER` | Default: `0` | Stock currently on shipped POs |
| `allocated_qty` | `INTEGER` | Default: `0` | Reserved stock for pending orders |
| `shelf` | `VARCHAR` | Nullable=True | Warehouse aisle/shelf |
| `bin` | `VARCHAR` | Nullable=True | Storage bin label |
| `reorder_point` | `INTEGER` | Default: `10` | Low-stock alert threshold |

#### `stock_logs` Table
Audit movements log.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Log UUID |
| `product_id` | `VARCHAR` | ForeignKey(`products.id`), Nullable=False | Associated product |
| `log_type` | `VARCHAR` | Nullable=False | Movement type (stock_in, stock_out, adjustment) |
| `quantity` | `INTEGER` | Nullable=False | Stock difference |
| `reference` | `VARCHAR` | Nullable=True | Document reference (e.g. PO received, Order shipped) |
| `timestamp` | `TIMESTAMP` | Default: `now()` | Log time |

---

### Outward Pricing & Channel Commissions

#### `channel_fee_templates` Table
Stores marketplace commission rules.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Template UUID |
| `channel_name` | `VARCHAR` | Unique, Index, Nullable=False | Marketplace channel name |
| `referral_fee_percent` | `DOUBLE PRECISION` | Default: `0.0` | Referral commission rate |
| `fixed_closing_fee` | `DOUBLE PRECISION` | Default: `0.0` | Fixed marketplace closure charge |
| `weight_handling_fee` | `DOUBLE PRECISION` | Default: `0.0` | Weight logistics fee |
| `other_fees` | `DOUBLE PRECISION` | Default: `0.0` | Miscellaneous charges |
| `is_default` | `BOOLEAN` | Default: `False` | Default calculation template |

---

### Orders & Returns Syncing

#### `orders` Table
E-commerce orders synced from channels.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Order UUID |
| `channel_order_id` | `VARCHAR` | Unique, Index, Nullable=False | Channel identifier (e.g. AZ-9923) |
| `channel_name` | `VARCHAR` | Index, Nullable=False | Marketplace name |
| `customer_name` | `VARCHAR` | Nullable=True | Shipping customer |
| `status` | `VARCHAR` | Default: `'pending'` | Status (pending, shipped, delivered, returned, cancelled) |
| `selling_price` | `DOUBLE PRECISION` | Nullable=False | Total sold price (inclusive of taxes) |
| `payout_amount` | `DOUBLE PRECISION` | Default: `0.0` | Calculated payout receivable |
| `profit_margin` | `DOUBLE PRECISION` | Default: `0.0` | Calculated profit margin in INR |
| `created_at` | `TIMESTAMP` | Default: `now()` | Order time |

#### `order_items` Table
Line items inside a synced order.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Item ID |
| `order_id` | `VARCHAR` | ForeignKey(`orders.id`), Nullable=False | Parent Order |
| `product_id` | `VARCHAR` | ForeignKey(`products.id`), Nullable=False | Purchased product |
| `sku` | `VARCHAR` | Index, Nullable=False | Product SKU |
| `quantity` | `INTEGER` | Nullable=False | Quantity ordered |
| `unit_price` | `DOUBLE PRECISION` | Nullable=False | Unit selling price |

#### `order_returns` Table
Customer return transactions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR` | Primary Key, Index | Return ID |
| `order_id` | `VARCHAR` | ForeignKey(`orders.id`), Nullable=False | Associated Order |
| `product_id` | `VARCHAR` | ForeignKey(`products.id`), Nullable=False | Returned product |
| `sku` | `VARCHAR` | Index, Nullable=False | SKU |
| `quantity` | `INTEGER` | Nullable=False | Returned quantity |
| `reason` | `VARCHAR` | Nullable=True | Return reason |
| `status` | `VARCHAR` | Default: `'initiated'` | Return status (initiated, received, restocked, lost) |
| `refund_amount` | `DOUBLE PRECISION` | Default: `0.0` | Refunded amount |
| `created_at` | `TIMESTAMP` | Default: `now()` | Return filed date |
