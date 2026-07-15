"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
} from "lucide-react";
import { Supplier } from "@lumipuchi/shared";

interface SuppliersViewProps {
  token: string;
}

export default function SuppliersView({ token }: SuppliersViewProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [contactName, setContactName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [country, setCountry] = useState<string>("China");
  const [currency, setCurrency] = useState<string>("CNY");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_URL}/suppliers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_URL}/suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          contact_name: contactName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          country,
          currency,
        }),
      });

      if (res.ok) {
        setName("");
        setContactName("");
        setEmail("");
        setPhone("");
        setAddress("");
        setCountry("China");
        setCurrency("CNY");
        setShowAddForm(false);
        fetchSuppliers();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to create supplier.");
      }
    } catch (err) {
      setError("Network error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary font-outfit">
            Suppliers Directory
          </h2>
          <p className="text-xs text-slate-400">
            Manage Chinese and international suppliers
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-650/20"
        >
          <Plus size={16} />
          {showAddForm ? "Cancel" : "Add Supplier"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="glass-panel p-6 rounded-2xl space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            New Supplier Details
          </h3>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Yiwu Exports Co."
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Lee Wei"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@yiwuexports.cn"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+86 139 5849 xxxx"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="China"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Primary Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm appearance-none"
              >
                <option value="CNY" className="bg-slate-950">
                  CNY (Chinese Yuan)
                </option>
                <option value="USD" className="bg-slate-950">
                  USD (US Dollar)
                </option>
                <option value="EUR" className="bg-slate-950">
                  EUR (Euro)
                </option>
                <option value="INR" className="bg-slate-950">
                  INR (Indian Rupee)
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-450 mb-1">
              Company Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Yiwu International Trade City, Zhejiang, China"
              rows={2}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition"
          >
            Save Supplier
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-400">
          Loading suppliers...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="glass-panel text-center py-12 rounded-2xl text-slate-400">
          No suppliers configured. Click "Add Supplier" to register one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="glass-card p-6 rounded-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold text-white font-outfit">
                    {supplier.name}
                  </h4>
                  {supplier.contact_name && (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <User size={12} /> Contact: {supplier.contact_name}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-700 text-[10px] font-bold rounded border border-indigo-500/20 uppercase">
                    {supplier.currency}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${
                      supplier.is_active
                        ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}
                  >
                    {supplier.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 space-y-1.5 text-xs text-slate-350">
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-slate-500" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-slate-500" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-slate-500" />
                  <span>Country: {supplier.country}</span>
                </div>
                {supplier.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={12} className="text-slate-500 mt-0.5" />
                    <span className="line-clamp-2">{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
