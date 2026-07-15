"use client";

import React, { useState, useEffect } from "react";
import {
  Percent,
  DollarSign,
  Settings,
  Save,
  RefreshCw,
  Calculator,
  ShoppingBag,
} from "lucide-react";
import { Product } from "@lumipuchi/shared";

interface ChannelTemplate {
  id: string;
  channel_name: string;
  referral_fee_percent: number;
  fixed_closing_fee: number;
  weight_handling_fee: number;
  other_fees: number;
  is_default: boolean;
}

interface PricingResult {
  selling_price: number;
  landed_cost: number;
  gst_percent: number;
  referral_fee: number;
  fixed_closing_fee: number;
  weight_handling_fee: number;
  other_fees: number;
  total_fees: number;
  gst_amount: number;
  net_payout: number;
  net_margin_amount: number;
  net_margin_percent: number;
}

interface PricingViewProps {
  token: string;
}

export default function PricingView({ token }: PricingViewProps) {
  const [templates, setTemplates] = useState<ChannelTemplate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);

  // Selector states
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Input fields for calculation
  const [sellingPrice, setSellingPrice] = useState<number>(999);
  const [landedCost, setLandedCost] = useState<number>(250);
  const [gstPercent, setGstPercent] = useState<number>(18.0);

  // Custom manual fee overrides
  const [useCustomFees, setUseCustomFees] = useState<boolean>(false);
  const [referralFeePercent, setReferralFeePercent] = useState<number>(12.0);
  const [fixedClosingFee, setFixedClosingFee] = useState<number>(30.0);
  const [weightHandlingFee, setWeightHandlingFee] = useState<number>(65.0);
  const [otherFees, setOtherFees] = useState<number>(0.0);

  // Result state
  const [calcResult, setCalcResult] = useState<PricingResult | null>(null);

  // Template editor state (allows editing of commissions in the ERP)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [editReferral, setEditReferral] = useState<number>(0);
  const [editClosing, setEditClosing] = useState<number>(0);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editOther, setEditOther] = useState<number>(0);
  const [savingTemplate, setSavingTemplate] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    try {
      // Fetch templates
      const tempRes = await fetch(`${API_URL}/pricing/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tempRes.ok) {
        const tempData = await tempRes.json();
        setTemplates(tempData);
        // Find default template
        const def = tempData.find((t: ChannelTemplate) => t.is_default);
        if (def) {
          setSelectedTemplateId(def.id);
        } else if (tempData.length > 0) {
          setSelectedTemplateId(tempData[0].id);
        }
      }

      // Fetch products
      const prodRes = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (err) {
      console.error("Error fetching pricing metadata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle product selection (pre-fills landed cost guess or GST)
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setGstPercent(prod.gst_percent);
      // Pre-fill landed cost if available or default
      setLandedCost(150); // placeholder or let manual adjust
    }
  };

  // Run margins calculation
  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const payload: any = {
        selling_price: sellingPrice,
        landed_cost: landedCost,
        gst_percent: gstPercent,
      };

      if (useCustomFees) {
        payload.referral_fee_percent = referralFeePercent;
        payload.fixed_closing_fee = fixedClosingFee;
        payload.weight_handling_fee = weightHandlingFee;
        payload.other_fees = otherFees;
      } else if (selectedTemplateId) {
        payload.template_id = selectedTemplateId;
      }

      const res = await fetch(`${API_URL}/pricing/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setCalcResult(result);
      }
    } catch (err) {
      console.error("Error running calculation:", err);
    } finally {
      setCalculating(false);
    }
  };

  // Re-run calculation when basic inputs change
  useEffect(() => {
    if (token && !loading) {
      handleCalculate();
    }
  }, [
    sellingPrice,
    landedCost,
    gstPercent,
    selectedTemplateId,
    useCustomFees,
    referralFeePercent,
    fixedClosingFee,
    weightHandlingFee,
    otherFees,
    templates,
  ]);

  const handleEditTemplate = (t: ChannelTemplate) => {
    setEditingTemplateId(t.id);
    setEditReferral(t.referral_fee_percent);
    setEditClosing(t.fixed_closing_fee);
    setEditWeight(t.weight_handling_fee);
    setEditOther(t.other_fees);
  };

  const handleSaveTemplate = async (tId: string) => {
    setSavingTemplate(true);
    try {
      const res = await fetch(`${API_URL}/pricing/templates/${tId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referral_fee_percent: editReferral,
          fixed_closing_fee: editClosing,
          weight_handling_fee: editWeight,
          other_fees: editOther,
        }),
      });

      if (res.ok) {
        setEditingTemplateId(null);
        fetchData();
      }
    } catch (err) {
      console.error("Error saving template:", err);
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-primary font-outfit">
          Outward Pricing & Margin Engine
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Verify channels payouts and listing profit margins after marketplace
          fees and GST
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">
          Loading pricing channels...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Calculator Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-5">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calculator size={16} /> listing Calculator
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-450 mb-1">
                    Select Product SKU
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm appearance-none"
                  >
                    <option value="" className="bg-slate-950">
                      Manual Input (No SKU)
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-950">
                        {p.sku} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-450 mb-1">
                    Select Commission Template
                  </label>
                  <select
                    disabled={useCustomFees}
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm appearance-none disabled:opacity-40"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-950">
                        {t.channel_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-450 mb-1">
                    Target Selling Price (INR inclusive) *
                  </label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-450 mb-1">
                    Landed Import Cost (INR) *
                  </label>
                  <input
                    type="number"
                    value={landedCost}
                    onChange={(e) =>
                      setLandedCost(parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-450 mb-1">
                    Outward GST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={gstPercent}
                    onChange={(e) =>
                      setGstPercent(parseFloat(e.target.value) || 18.0)
                    }
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Custom Overrides toggle */}
              <div className="border-t border-white/5 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomFees}
                    onChange={(e) => setUseCustomFees(e.target.checked)}
                    className="rounded bg-slate-900 border-white/10 text-indigo-650 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-slate-350">
                    Apply Manual Fee Overrides (Override templates)
                  </span>
                </label>

                {useCustomFees && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-slate-950/20 p-4 rounded-xl border border-white/5">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-450 mb-1">
                        Referral Fee %
                      </label>
                      <input
                        type="number"
                        value={referralFeePercent}
                        onChange={(e) =>
                          setReferralFeePercent(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-450 mb-1">
                        Closing Fee (INR)
                      </label>
                      <input
                        type="number"
                        value={fixedClosingFee}
                        onChange={(e) =>
                          setFixedClosingFee(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-450 mb-1">
                        Weight Handling (INR)
                      </label>
                      <input
                        type="number"
                        value={weightHandlingFee}
                        onChange={(e) =>
                          setWeightHandlingFee(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-450 mb-1">
                        Other Fees (INR)
                      </label>
                      <input
                        type="number"
                        value={otherFees}
                        onChange={(e) =>
                          setOtherFees(parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Calculations results display */}
            {calcResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* payout card */}
                <div className="glass-panel p-5 rounded-2xl border border-indigo-500/10">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                    Net Payout (Base)
                  </span>
                  <h4 className="text-2xl font-extrabold text-white mt-1">
                    ₹{calcResult.net_payout.toFixed(2)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Payout after GST and commissions
                  </p>
                </div>

                {/* margin amount card */}
                <div className="glass-panel p-5 rounded-2xl border border-indigo-500/10">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                    Profit Margin (INR)
                  </span>
                  <h4
                    className={`text-2xl font-extrabold mt-1 ${calcResult.net_margin_amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    ₹{calcResult.net_margin_amount.toFixed(2)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Net profit per unit sold
                  </p>
                </div>

                {/* margin percent card */}
                <div
                  className={`glass-panel p-5 rounded-2xl border ${calcResult.net_margin_percent >= 15 ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10"}`}
                >
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                    Margin Percent
                  </span>
                  <h4
                    className={`text-2xl font-extrabold mt-1 ${calcResult.net_margin_percent >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {calcResult.net_margin_percent.toFixed(1)}%
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-2">
                    {calcResult.net_margin_percent >= 15
                      ? "Healthy profitability"
                      : "Low margin alert"}
                  </p>
                </div>

                {/* Details Breakdown */}
                <div className="glass-panel p-6 rounded-2xl md:col-span-3 space-y-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Fee & Tax Breakdown (INR)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5">
                      <span className="text-slate-500 block">
                        Referral Fee (
                        {useCustomFees
                          ? referralFeePercent
                          : templates.find((t) => t.id === selectedTemplateId)
                              ?.referral_fee_percent || 0}
                        %)
                      </span>
                      <span className="font-bold text-white mt-0.5 block">
                        ₹{calcResult.referral_fee.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5">
                      <span className="text-slate-500 block">
                        Fixed Closing Fee
                      </span>
                      <span className="font-bold text-white mt-0.5 block">
                        ₹{calcResult.fixed_closing_fee.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5">
                      <span className="text-slate-500 block">
                        Weight Handling Fee
                      </span>
                      <span className="font-bold text-white mt-0.5 block">
                        ₹{calcResult.weight_handling_fee.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950/20 rounded-xl border border-white/5">
                      <span className="text-slate-550 block">
                        Outward GST ({gstPercent}%)
                      </span>
                      <span className="font-bold text-white mt-0.5 block">
                        ₹{calcResult.gst_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Template Configurations */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={14} /> Channel Rules Configuration
            </h4>

            <div className="space-y-4">
              {templates.map((t) => {
                const isEditing = editingTemplateId === t.id;
                return (
                  <div
                    key={t.id}
                    className="glass-card p-5 rounded-2xl space-y-3 relative"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-slate-200">
                          {t.channel_name}
                        </h5>
                        {t.is_default && (
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-extrabold mt-1 inline-block">
                            Default
                          </span>
                        )}
                      </div>

                      {!isEditing && (
                        <button
                          onClick={() => handleEditTemplate(t)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                          Edit Rules
                        </button>
                      )}
                    </div>

                    <div className="border-t border-white/5 pt-3.5 space-y-2 text-xs text-slate-350">
                      <div className="flex justify-between items-center">
                        <span>Referral Fee</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editReferral}
                            onChange={(e) =>
                              setEditReferral(parseFloat(e.target.value) || 0)
                            }
                            className="w-16 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                          />
                        ) : (
                          <strong className="text-slate-200">
                            {t.referral_fee_percent}%
                          </strong>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Fixed Closing Fee</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editClosing}
                            onChange={(e) =>
                              setEditClosing(parseFloat(e.target.value) || 0)
                            }
                            className="w-16 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                          />
                        ) : (
                          <strong className="text-slate-200">
                            ₹{t.fixed_closing_fee}
                          </strong>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span>Weight Handling Fee</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editWeight}
                            onChange={(e) =>
                              setEditWeight(parseFloat(e.target.value) || 0)
                            }
                            className="w-16 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                          />
                        ) : (
                          <strong className="text-slate-200">
                            ₹{t.weight_handling_fee}
                          </strong>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex gap-2 pt-2 justify-end">
                          <button
                            onClick={() => handleSaveTemplate(t.id)}
                            disabled={savingTemplate}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <Save size={10} /> Save
                          </button>
                          <button
                            onClick={() => setEditingTemplateId(null)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded text-[10px] transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
