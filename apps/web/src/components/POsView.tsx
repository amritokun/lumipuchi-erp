"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  DollarSign,
  ShieldAlert,
  CheckCircle,
  Package,
} from "lucide-react";
import { Supplier } from "@lumipuchi/shared";

interface POItem {
  id?: string;
  sku: string;
  name: string;
  quantity: number;
  unit_cost_foreign: number;
  landed_cost_inr_per_unit?: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: string;
  issue_date: string;
  currency: string;
  exchange_rate: number;
  china_domestic_shipping: number;
  international_freight: number;
  customs_duty_percent: number;
  clearing_charges: number;
  insurance: number;
  other_charges: number;
  total_landed_cost_inr: number;
  items: POItem[];
  supplier: Supplier;
}

interface POsViewProps {
  token: string;
}

export default function POsView({ token }: POsViewProps) {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // New PO State
  const [poNumber, setPoNumber] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [currency, setCurrency] = useState<string>("CNY");
  const [exchangeRate, setExchangeRate] = useState<number>(11.5);

  const [domesticShipping, setDomesticShipping] = useState<number>(0);
  const [internationalFreight, setInternationalFreight] = useState<number>(0);
  const [customsDuty, setCustomsDuty] = useState<number>(20);
  const [clearingCharges, setClearingCharges] = useState<number>(0);
  const [insurance, setInsurance] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);

  const [items, setItems] = useState<POItem[]>([
    { sku: "", name: "", quantity: 100, unit_cost_foreign: 10 },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchPOs = async () => {
    try {
      const res = await fetch(`${API_URL}/purchase-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPos(data);
      }
    } catch (err) {
      console.error("Error fetching POs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.filter((s: Supplier) => s.is_active));
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  useEffect(() => {
    fetchPOs();
    fetchSuppliers();
  }, [token]);

  // Adjust currency and default exchange rate when supplier changes
  const handleSupplierChange = async (sId: string) => {
    setSupplierId(sId);
    const selectedSupplier = suppliers.find((s) => s.id === sId);
    if (selectedSupplier) {
      setCurrency(selectedSupplier.currency);
      // Fetch current rate
      try {
        const res = await fetch(
          `${API_URL}/forex/${selectedSupplier.currency}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setExchangeRate(data.rate);
        }
      } catch (err) {
        console.error("Error fetching rate:", err);
      }
    }
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { sku: "", name: "", quantity: 100, unit_cost_foreign: 10 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof POItem,
    value: any,
  ) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Validate items
    const invalidItem = items.some(
      (item) =>
        !item.sku ||
        !item.name ||
        item.quantity <= 0 ||
        item.unit_cost_foreign <= 0,
    );
    if (invalidItem) {
      setError("Please fill in all item fields with positive values.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/purchase-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          po_number: poNumber,
          supplier_id: supplierId,
          currency,
          exchange_rate: exchangeRate,
          china_domestic_shipping: domesticShipping,
          international_freight: internationalFreight,
          customs_duty_percent: customsDuty,
          clearing_charges: clearingCharges,
          insurance,
          other_charges: otherCharges,
          items: items.map((i) => ({
            sku: i.sku,
            name: i.name,
            quantity: i.quantity,
            unit_cost_foreign: i.unit_cost_foreign,
          })),
        }),
      });

      if (res.ok) {
        setPoNumber("");
        setSupplierId("");
        setDomesticShipping(0);
        setInternationalFreight(0);
        setClearingCharges(0);
        setInsurance(0);
        setOtherCharges(0);
        setItems([{ sku: "", name: "", quantity: 100, unit_cost_foreign: 10 }]);
        setShowAddForm(false);
        fetchPOs();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to create Purchase Order.");
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPoId(expandedPoId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "ordered":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "shipped":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "customs":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "delivered":
        return "bg-emerald-500/10 text-emerald-450 border-emerald-500/20";
      default:
        return "bg-rose-500/10 text-rose-450 border-rose-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary font-outfit">
            Purchase Orders (POs)
          </h2>
          <p className="text-xs text-slate-400">
            Calculate accurate landed cost and track foreign purchases
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-650/20"
        >
          <Plus size={16} />
          {showAddForm ? "Cancel" : "New PO"}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="glass-panel p-6 rounded-2xl space-y-6"
        >
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Initialize Purchase Shipment
          </h3>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Primary Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                PO Number *
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO-2026-001"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Supplier *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm appearance-none"
              >
                <option value="" className="bg-slate-950">
                  Select Supplier
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-950">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Currency
              </label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full bg-slate-900/40 border border-white/5 rounded-xl px-4 py-2.5 text-slate-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">
                Exchange Rate (Locked) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          {/* Shared Expenses */}
          <div className="border-t border-white/5 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Landed Cost Shared Expenses (INR)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-slate-450 mb-1">
                  China Domestic Shipping
                </label>
                <input
                  type="number"
                  value={domesticShipping}
                  onChange={(e) =>
                    setDomesticShipping(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-450 mb-1">
                  Int'l Freight
                </label>
                <input
                  type="number"
                  value={internationalFreight}
                  onChange={(e) =>
                    setInternationalFreight(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-450 mb-1">
                  Customs Duty (%)
                </label>
                <input
                  type="number"
                  value={customsDuty}
                  onChange={(e) =>
                    setCustomsDuty(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-450 mb-1">
                  Clearing Charges
                </label>
                <input
                  type="number"
                  value={clearingCharges}
                  onChange={(e) =>
                    setClearingCharges(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-450 mb-1">
                  Insurance
                </label>
                <input
                  type="number"
                  value={insurance}
                  onChange={(e) =>
                    setInsurance(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-450 mb-1">
                  Other Charges
                </label>
                <input
                  type="number"
                  value={otherCharges}
                  onChange={(e) =>
                    setOtherCharges(parseFloat(e.target.value) || 0)
                  }
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Item Rows */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Line Items
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <Plus size={14} /> Add Item Row
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row gap-3 items-end"
                >
                  <div className="w-full md:w-1/4">
                    {idx === 0 && (
                      <label className="block text-[10px] font-medium text-slate-450 mb-1">
                        SKU *
                      </label>
                    )}
                    <input
                      type="text"
                      required
                      placeholder="SKU-XYZ"
                      value={item.sku}
                      onChange={(e) =>
                        handleItemFieldChange(idx, "sku", e.target.value)
                      }
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div className="w-full md:w-2/5">
                    {idx === 0 && (
                      <label className="block text-[10px] font-medium text-slate-450 mb-1">
                        Product Description *
                      </label>
                    )}
                    <input
                      type="text"
                      required
                      placeholder="Waterproof Sports Backpack"
                      value={item.name}
                      onChange={(e) =>
                        handleItemFieldChange(idx, "name", e.target.value)
                      }
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div className="w-full md:w-1/6">
                    {idx === 0 && (
                      <label className="block text-[10px] font-medium text-slate-450 mb-1">
                        Qty *
                      </label>
                    )}
                    <input
                      type="number"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemFieldChange(
                          idx,
                          "quantity",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div className="w-full md:w-1/6">
                    {idx === 0 && (
                      <label className="block text-[10px] font-medium text-slate-450 mb-1">
                        Unit Cost ({currency}) *
                      </label>
                    )}
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={item.unit_cost_foreign}
                      onChange={(e) =>
                        handleItemFieldChange(
                          idx,
                          "unit_cost_foreign",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={items.length === 1}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 disabled:opacity-40 rounded-xl border border-rose-500/20 transition h-9 shrink-0 flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl text-xs transition"
          >
            {submitting
              ? "Calculating Landed Costs..."
              : "Save & Calculate Landed Costs"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-400">
          Loading purchase orders...
        </div>
      ) : pos.length === 0 ? (
        <div className="glass-panel text-center py-12 rounded-2xl text-slate-400">
          No Purchase Orders found. Click "New PO" to start.
        </div>
      ) : (
        <div className="space-y-4">
          {pos.map((po) => (
            <div
              key={po.id}
              className="glass-card rounded-2xl overflow-hidden border border-white/5"
            >
              {/* Summary Bar */}
              <div
                onClick={() => toggleExpand(po.id)}
                className="p-5 flex flex-wrap justify-between items-center gap-4 cursor-pointer hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-md font-bold text-white font-outfit">
                      {po.po_number}
                    </h4>
                    <span className="text-[10px] text-slate-450 block">
                      Supplier: {po.supplier.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block">
                      Issue Date
                    </span>
                    <span className="text-slate-300 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} />{" "}
                      {new Date(po.issue_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block">
                      Raw Cost
                    </span>
                    <span className="text-slate-300 mt-0.5">
                      {po.currency}{" "}
                      {po.items
                        .reduce(
                          (sum, item) =>
                            sum + item.unit_cost_foreign * item.quantity,
                          0,
                        )
                        .toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block">
                      Total Landed Cost
                    </span>
                    <span className="text-indigo-700 font-bold mt-0.5">
                      ₹
                      {po.total_landed_cost_inr.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border uppercase ${getStatusColor(po.status)}`}
                    >
                      {po.status}
                    </span>
                  </div>
                </div>

                <div className="text-slate-450">
                  {expandedPoId === po.id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedPoId === po.id && (
                <div className="bg-slate-950/40 border-t border-white/5 p-6 space-y-6">
                  {/* Cost Allocation Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                      <span className="text-slate-500 block">
                        Forex Exchange Rate
                      </span>
                      <span className="font-bold text-white mt-1 block">
                        ₹{po.exchange_rate} / {po.currency}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                      <span className="text-slate-500 block">
                        Customs Duty Rate
                      </span>
                      <span className="font-bold text-white mt-1 block">
                        {po.customs_duty_percent}%
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                      <span className="text-slate-500 block">
                        Int'l Freight Charges
                      </span>
                      <span className="font-bold text-white mt-1 block">
                        ₹{po.international_freight.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                      <span className="text-slate-500 block">
                        Other Shared Charges
                      </span>
                      <span className="font-bold text-white mt-1 block">
                        ₹
                        {(
                          po.china_domestic_shipping +
                          po.clearing_charges +
                          po.insurance +
                          po.other_charges
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 col-span-2 md:col-span-1">
                      <span className="text-indigo-700 font-semibold block">
                        Landed Cost INR
                      </span>
                      <span className="font-extrabold text-white text-sm mt-1 block">
                        ₹{po.total_landed_cost_inr.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Items Landed Cost List */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={14} /> Item Landed Cost Calculations (INR)
                    </h5>
                    <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/20">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-semibold uppercase text-[10px]">
                            <th className="p-3">SKU</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Quantity</th>
                            <th className="p-3 text-right">
                              Unit Ex-Factory ({po.currency})
                            </th>
                            <th className="p-3 text-right">Unit Raw (INR)</th>
                            <th className="p-3 text-right bg-indigo-500/5 text-indigo-700">
                              Unit Landed Cost (INR)
                            </th>
                            <th className="p-3 text-right">
                              Total Landed (INR)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {po.items.map((item, idx) => {
                            const rawInr =
                              item.unit_cost_foreign * po.exchange_rate;
                            const landedCost =
                              item.landed_cost_inr_per_unit || 0;
                            return (
                              <tr key={idx} className="hover:bg-white/5">
                                <td className="p-3 font-semibold text-primary">
                                  {item.sku}
                                </td>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-right">
                                  {item.quantity}
                                </td>
                                <td className="p-3 text-right">
                                  {po.currency}{" "}
                                  {item.unit_cost_foreign.toFixed(2)}
                                </td>
                                <td className="p-3 text-right">
                                  ₹{rawInr.toFixed(2)}
                                </td>
                                <td className="p-3 text-right bg-indigo-500/5 text-indigo-700 font-bold">
                                  ₹{landedCost.toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-medium">
                                  ₹
                                  {(landedCost * item.quantity).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
