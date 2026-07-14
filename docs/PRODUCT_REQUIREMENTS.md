# PRODUCT_REQUIREMENTS.md

# Lumipuchi ERP — Product Requirements Document (PRD)

## 1. Purpose

Lumipuchi ERP is an open-source, self-hostable ERP designed for Indian e-commerce businesses that import products (primarily from China) and sell on Amazon India, Flipkart, Meesho, and their own websites.

The system replaces spreadsheets by providing a single platform for inventory, purchasing, pricing, forex, analytics, and reporting.

Official deployment:

admin.lumipuchi.in

---

# 2. Objectives

- Centralize all business operations.
- Calculate accurate landed cost.
- Recommend profitable selling prices.
- Reduce spreadsheet usage.
- Track inventory in real time.
- Support multiple marketplaces.
- Handle returns and RTO.
- Be modular and extensible.
- Remain fully open source.

---

# 3. Target Users

## Owner
Full system access.

## Manager
Inventory, purchases, pricing, reports.

## Warehouse Staff
Stock movements and labels.

## Finance
Purchases, costs, GST, reports.

## Viewer
Read-only access.

---

# 4. Core Modules

- Authentication & RBAC
- Dashboard
- Product Master
- Supplier Management
- Purchase Orders
- Import Manager
- Forex
- Landed Cost
- Inventory
- Pricing Engine
- Marketplace Pricing
- Orders
- Returns & RTO
- Analytics
- Reports
- Label Generator
- Settings

---

# 5. Product Master

Each product stores:

- SKU
- Product ID
- Catalogue ID
- Brand
- Product Name
- Description
- Category
- Variant
- Color
- Images
- Supplier
- Supplier SKU
- HSN
- GST
- Weight
- Dimensions
- Barcode
- QR Code
- Status

---

# 6. Import & Purchasing

Track:

- Supplier
- Currency
- CNY Cost
- Exchange Rate (locked)
- Domestic China Shipping
- International Freight
- Customs Duty
- IGST
- Clearing Charges
- Insurance
- Landed Cost
- Cost Per Unit

---

# 7. Forex

Support:

- Live CNY→INR
- USD→INR
- HKD→INR
- EUR→INR
- JPY→INR

Features:

- Historical charts
- Rate alerts
- Rate locking
- Manual override
- Impact on product pricing

---

# 8. Pricing Engine

Inputs:

- Landed Cost
- Packaging
- Shipping
- Marketplace Fees
- Advertising
- GST
- Expected RTO
- Desired Profit

Outputs:

- Break-even Price
- Selling Price
- Marketplace Payout
- Net Profit
- Margin
- ROI
- RTO Compensation

---

# 9. Inventory

Track:

- Stock In
- Stock Out
- Reserved
- Returned
- Damaged
- Warehouse
- Shelf
- Bin
- Reorder Level
- Low Stock Alerts

---

# 10. Analytics

- Revenue
- Profit
- Inventory Value
- Dead Stock
- Fast Moving Products
- ABC Analysis
- Platform Comparison
- Monthly Reports

---

# 11. Integrations

- Amazon Seller Central
- Flipkart Seller Hub
- Meesho
- WooCommerce
- Shopify
- Razorpay
- Cashfree
- Shiprocket
- Delhivery

---

# 12. Non-Functional Requirements

- Production-ready
- Secure by default
- Responsive UI
- Dark mode
- Accessible
- Modular architecture
- Automated testing
- Docker support
- REST API with OpenAPI
- PostgreSQL
- Redis
- Comprehensive documentation

---

# 13. Success Criteria

- Accurate landed cost calculations.
- Marketplace-specific pricing.
- Reliable inventory tracking.
- Fast search across thousands of SKUs.
- Stable performance.
- Fully documented.
- Easy self-hosting.
- Clean, maintainable, open-source codebase.
