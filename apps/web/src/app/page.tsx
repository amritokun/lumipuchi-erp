"use client";

import React, { useState } from "react";
import { calculateChannelPayout, ChannelFees } from "@lumipuchi/pricing-engine";
import { calculateLandedCost } from "@lumipuchi/forex";
import { calculateVirtualQty } from "@lumipuchi/inventory";
import { useAuth } from "@/context/AuthContext";

// Import newly created sub-views
import SuppliersView from "@/components/SuppliersView";
import ForexView from "@/components/ForexView";
import POsView from "@/components/POsView";
import ProductsView from "@/components/ProductsView";
import InventoryView from "@/components/InventoryView";
import PricingView from "@/components/PricingView";
import OrdersView from "@/components/OrdersView";

import {
  TrendingUp,
  Package,
  DollarSign,
  Percent,
  Layers,
  Settings,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Shield,
  Mail,
  Lock,
  Loader2,
  FolderTree,
  Users,
  ShoppingCart,
} from "lucide-react";

export default function Home() {
  const {
    user,
    token,
    loading,
    error: authError,
    login,
    signup,
    logout,
  } = useAuth();

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Auth Form State
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("viewer");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Dashboard Calculator State
  const [costCny, setCostCny] = useState<number>(50);
  const [exchangeRate, setExchangeRate] = useState<number>(11.5);
  const [dutyPercent, setDutyPercent] = useState<number>(20);
  const [shippingCost, setShippingCost] = useState<number>(50);
  const [sellingPrice, setSellingPrice] = useState<number>(1499);
  const [gstPercent, setGstPercent] = useState<number>(18);

  const defaultFees: ChannelFees = {
    referralFeePercent: 12,
    fixedClosingFee: 40,
    weightHandlingFee: 65,
    otherFees: 0,
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (isLogin) {
      await login(email, password);
    } else {
      await signup(email, password, name, role);
    }
    setSubmitting(false);
  };

  // Landed Cost calculations using our forex package
  const landedCost = calculateLandedCost(
    costCny,
    exchangeRate,
    dutyPercent,
    shippingCost,
  );

  // Pricing payout calculations using our pricing engine
  const pricingResult = calculateChannelPayout(
    sellingPrice,
    landedCost,
    gstPercent,
    defaultFees,
  );

  // Inventory virtual calculation
  const virtualStock = calculateVirtualQty(120, 500, 30);

  // 1. Loading Screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-slate-400 mt-4 text-sm font-medium">
          Securing session...
        </p>
      </div>
    );
  }

  // 2. Auth Screen (Login / Signup)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 font-outfit">
              Lumipuchi ERP
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              {isLogin
                ? "Sign in to access your dashboard"
                : "Create an account to get started"}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs font-semibold">
                {authError}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <UserIcon size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Amrita Das"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Organization Role
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Shield size={16} />
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm appearance-none"
                  >
                    <option value="owner" className="bg-slate-950">
                      Owner (Full Access)
                    </option>
                    <option value="manager" className="bg-slate-950">
                      Manager (Inventory, Pricing)
                    </option>
                    <option value="warehouse" className="bg-slate-950">
                      Warehouse (Stock Actions)
                    </option>
                    <option value="finance" className="bg-slate-950">
                      Finance (Costs, GST)
                    </option>
                    <option value="viewer" className="bg-slate-950">
                      Viewer (Read Only)
                    </option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-650/20 text-sm flex justify-center items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Dashboard Container (Authenticated)
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-white/10 p-6 flex flex-col justify-between bg-slate-950/20 shrink-0">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 font-outfit">
              Lumipuchi ERP
            </h1>
            <p className="text-[10px] text-slate-450 mt-1 uppercase tracking-widest font-semibold">
              Central Command
            </p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <TrendingUp size={16} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("suppliers")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "suppliers"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Users size={16} />
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "products"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Package size={16} />
              Products
            </button>
            <button
              onClick={() => setActiveTab("forex")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "forex"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <DollarSign size={16} />
              Forex Rates
            </button>
            <button
              onClick={() => setActiveTab("pos")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "pos"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <FolderTree size={16} />
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "inventory"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Layers size={16} />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab("pricing-engine")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "pricing-engine"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Percent size={16} />
              Pricing Engine
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "orders"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <ShoppingCart size={16} />
              Orders & Returns
            </button>
          </nav>
        </div>

        {/* User profile summary / Logout */}
        <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-white block truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold transition"
          >
            <LogOut size={14} />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl overflow-y-auto">
        {/* Render Tab Contents */}
        {activeTab === "dashboard" && (
          <div className="space-y-10">
            <div>
              <h2 className="text-3xl font-extrabold text-white font-outfit">
                Seller Command Center
              </h2>
              <p className="text-slate-400 mt-1">
                Live metrics and channels margin calculators
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-indigo-400">
                  <Package size={80} />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  China Sourced Catalog
                </span>
                <h3 className="text-3xl font-bold font-outfit mt-1">2,408</h3>
                <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1.5 font-medium">
                  <TrendingUp size={14} /> Active SKU count
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-purple-400">
                  <Layers size={80} />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Inventory (Virtual)
                </span>
                <h3 className="text-3xl font-bold font-outfit mt-1">
                  {virtualStock} Units
                </h3>
                <p className="text-xs text-purple-600 mt-2 font-medium">
                  Warehouse (120) + In Transit (500) - Reserved (30)
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-pink-400">
                  <DollarSign size={80} />
                </div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Forex Standard
                </span>
                <h3 className="text-3xl font-bold font-outfit mt-1">
                  ₹{exchangeRate} / CNY
                </h3>
                <p className="text-xs text-primary mt-2 flex items-center gap-1.5 font-medium">
                  <RefreshCw size={12} className="animate-spin" /> Live update
                  synced
                </p>
              </div>
            </div>

            {/* Calculator Playground */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Landed Cost Inputs & Output */}
              <div className="glass-panel p-8 rounded-2xl">
                <h2 className="text-2xl font-bold font-outfit mb-6 text-indigo-600 flex items-center gap-2">
                  <Settings size={20} /> Landed Cost Calculator
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Ex-Factory Cost (CNY)
                    </label>
                    <input
                      type="number"
                      value={costCny}
                      onChange={(e) => setCostCny(Number(e.target.value))}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Exchange Rate (CNY to INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={exchangeRate}
                        onChange={(e) =>
                          setExchangeRate(Number(e.target.value))
                        }
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Customs Duty (%)
                      </label>
                      <input
                        type="number"
                        value={dutyPercent}
                        onChange={(e) => setDutyPercent(Number(e.target.value))}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Shipping & Landing Cost Per Unit (INR)
                    </label>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(Number(e.target.value))}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="mt-8 p-5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider block">
                    Calculated Landed Cost (INR)
                  </span>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    ₹{landedCost.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Includes customs duty of ₹
                    {(costCny * exchangeRate * (dutyPercent / 100)).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Pricing Payout Outputs */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-outfit mb-6 text-purple-600 flex items-center gap-2">
                    <Percent size={20} /> Listing Price & Profitability
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Target Selling Price (INR)
                      </label>
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) =>
                          setSellingPrice(Number(e.target.value))
                        }
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        GST Rate (%)
                      </label>
                      <input
                        type="number"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(Number(e.target.value))}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block">
                        Total Channel Fees
                      </span>
                      <span className="text-lg font-bold">
                        ₹{pricingResult.totalFees.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-400 block">
                        GST Paid (Outward)
                      </span>
                      <span className="text-lg font-bold">
                        ₹{pricingResult.gstAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider block">
                        Net Profit Margin
                      </span>
                      <div className="text-3xl font-extrabold text-white mt-1">
                        ₹{pricingResult.netMarginAmount.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">
                        Margin %
                      </span>
                      <span className="text-2xl font-bold text-emerald-600 mt-1">
                        {pricingResult.netMarginPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Suppliers */}
        {activeTab === "suppliers" && token && <SuppliersView token={token} />}

        {/* Tab 3: Products */}
        {activeTab === "products" && token && <ProductsView token={token} />}

        {/* Tab 4: Forex */}
        {activeTab === "forex" && token && <ForexView token={token} />}

        {/* Tab 5: POs */}
        {activeTab === "pos" && token && <POsView token={token} />}

        {/* Tab 6: Inventory */}
        {activeTab === "inventory" && token && <InventoryView token={token} />}

        {/* Tab 7: Pricing Engine */}
        {activeTab === "pricing-engine" && token && (
          <PricingView token={token} />
        )}

        {/* Tab 8: Orders & Returns */}
        {activeTab === "orders" && token && <OrdersView token={token} />}
      </main>
    </div>
  );
}
