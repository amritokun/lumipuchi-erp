export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'warehouse' | 'finance' | 'viewer';
  is_active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  country: string; // e.g. "China"
  currency: string; // e.g. "USD" or "CNY"
  is_active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  supplier_id: string;
  supplier: Supplier;
  is_active: boolean;
  hsn?: string;
  gst_percent: number;
  weight: number;
  dimensions?: string;
  barcode?: string;
  qrcode?: string;
  brand?: string;
  catalogue_id?: string;
  category?: string;
  variant?: string;
  color?: string;
  supplier_sku?: string;
}

