export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'accountant';
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  country: string; // e.g. "China"
  currency: string; // e.g. "USD" or "CNY"
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  supplierId: string;
  moq: number; // Minimum Order Quantity
  costCny: number; // Cost in Chinese Yuan
  costUsd: number; // Cost in USD
  landedCostInr?: number; // Calculated Landed Cost in INR
}
