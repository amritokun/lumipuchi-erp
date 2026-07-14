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
  moq: number; // Minimum Order Quantity
  cost_cny: number; // Cost in Chinese Yuan
  cost_usd: number; // Cost in USD
  landed_cost_inr?: number; // Calculated Landed Cost in INR
}

