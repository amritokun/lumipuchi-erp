'use client';

import React, { useState } from 'react';
import { calculateChannelPayout, ChannelFees } from '@lumipuchi/pricing-engine';
import { calculateLandedCost } from '@lumipuchi/forex';
import { calculateVirtualQty } from '@lumipuchi/inventory';
import { useAuth } from '@/context/AuthContext';
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
  Loader2
} from 'lucide-react';

export default function Home() {
  const { user, loading, error: authError, login, signup, logout } = useAuth();

  // Auth Form State
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('viewer');
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
    otherFees: 0
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
  const landedCost = calculateLandedCost(costCny, exchangeRate, dutyPercent, shippingCost);
  
  // Pricing payout calculations using our pricing engine
  const pricingResult = calculateChannelPayout(sellingPrice, landedCost, gstPercent, defaultFees);

  // Inventory virtual calculation
  const virtualStock = calculateVirtualQty(120, 500, 30);

  // 1. Loading Screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f19]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 mt-4 text-sm font-medium">Securing session...</p>
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
              {isLogin ? 'Sign in to access your dashboard' : 'Create an account to get started'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
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
                    <option value="owner" className="bg-slate-950">Owner (Full Access)</option>
                    <option value="manager" className="bg-slate-950">Manager (Inventory, Pricing)</option>
                    <option value="warehouse" className="bg-slate-950">Warehouse (Stock Actions)</option>
                    <option value="finance" className="bg-slate-950">Finance (Costs, GST)</option>
                    <option value="viewer" className="bg-slate-950">Viewer (Read Only)</option>
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
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Dashboard Screen (Authenticated)
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 font-outfit">
            Lumipuchi ERP
          </h1>
          <p className="text-slate-400 mt-2">
            Integrated command center for China imports & multi-channel e-commerce operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass-panel text-xs text-indigo-300 font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Authenticated as <span className="text-white capitalize">{user.role}</span>
          </div>
          <div className="glass-panel text-xs text-slate-350 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="font-semibold text-white">{user.name}</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-full border border-rose-500/20 transition"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-indigo-400">
            <Package size={80} />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            China Sourced Catalog
          </span>
          <h3 className="text-3xl font-bold font-outfit mt-1">1,248 Units</h3>
          <p className="text-xs text-indigo-300 mt-2 flex items-center gap-1">
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
          <h3 className="text-3xl font-bold font-outfit mt-1">{virtualStock} Units</h3>
          <p className="text-xs text-purple-300 mt-2">
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
          <h3 className="text-3xl font-bold font-outfit mt-1">₹{exchangeRate} / CNY</h3>
          <p className="text-xs text-pink-300 mt-2 flex items-center gap-1.5">
            <RefreshCw size={12} className="animate-spin" /> Live update synced
          </p>
        </div>
      </div>

      {/* Calculator Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Landed Cost Inputs & Output */}
        <div className="glass-panel p-8 rounded-2xl">
          <h2 className="text-2xl font-bold font-outfit mb-6 text-indigo-200 flex items-center gap-2">
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
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
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
            <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider block">
              Calculated Landed Cost (INR)
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">
              ₹{landedCost.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Includes customs duty of ₹{(costCny * exchangeRate * (dutyPercent / 100)).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Pricing Payout Outputs */}
        <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold font-outfit mb-6 text-purple-200 flex items-center gap-2">
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
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
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
                <span className="text-xs text-slate-400 block">Total Channel Fees</span>
                <span className="text-lg font-bold">₹{pricingResult.totalFees.toFixed(2)}</span>
              </div>
              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5">
                <span className="text-xs text-slate-400 block">GST Paid (Outward)</span>
                <span className="text-lg font-bold">₹{pricingResult.gstAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block">
                  Net Profit Margin
                </span>
                <div className="text-3xl font-extrabold text-white mt-1">
                  ₹{pricingResult.netMarginAmount.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Margin %</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1">
                  {pricingResult.netMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
