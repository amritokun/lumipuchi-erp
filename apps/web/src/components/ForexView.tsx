"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Lock,
  Unlock,
  Edit3,
  Save,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface ForexRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  is_locked: boolean;
  manual_override_rate: number | null;
  updated_at: string;
}

interface ForexViewProps {
  token: string;
}

export default function ForexView({ token }: ForexViewProps) {
  const [rates, setRates] = useState<ForexRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<string>("");
  const [updating, setUpdating] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchRates = async () => {
    try {
      const res = await fetch(`${API_URL}/forex`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRates(data);
      }
    } catch (err) {
      console.error("Error fetching forex rates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [token]);

  const handleToggleLock = async (rateObj: ForexRate) => {
    try {
      const res = await fetch(`${API_URL}/forex/${rateObj.from_currency}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_locked: !rateObj.is_locked,
        }),
      });
      if (res.ok) {
        fetchRates();
      }
    } catch (err) {
      console.error("Error locking rate:", err);
    }
  };

  const handleSaveRate = async (rateObj: ForexRate) => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/forex/${rateObj.from_currency}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rate: parseFloat(editRate),
          manual_override_rate: parseFloat(editRate),
        }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchRates();
      }
    } catch (err) {
      console.error("Error saving rate:", err);
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = (rateObj: ForexRate) => {
    setEditingId(rateObj.id);
    setEditRate(rateObj.rate.toString());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary font-outfit">
            Forex Command Center
          </h2>
          <p className="text-xs text-slate-400">
            Track and lock exchange rates for importing goods
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchRates();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition border border-white/5"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Rates
        </button>
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-2xl text-xs flex gap-2.5 items-start">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold block mb-0.5">
            Understanding Rate Locking:
          </span>
          Locking a rate prevents background sync jobs from overwriting it. Any
          manual overrides automatically lock the rate to keep landed cost
          calculations consistent.
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">
          Loading exchange rates...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rates.map((rateObj) => (
            <div
              key={rateObj.id}
              className="glass-card p-6 rounded-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-primary">
                    {rateObj.from_currency}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">
                      Base Currency Pair
                    </span>
                    <h4 className="text-md font-bold text-white uppercase">
                      {rateObj.from_currency} → {rateObj.to_currency}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleLock(rateObj)}
                  className={`p-2 rounded-xl border transition ${
                    rateObj.is_locked
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-slate-800/60 text-slate-450 border-white/5 hover:text-white"
                  }`}
                  title={rateObj.is_locked ? "Unlock Rate" : "Lock Rate"}
                >
                  {rateObj.is_locked ? (
                    <Lock size={16} />
                  ) : (
                    <Unlock size={16} />
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center py-2 border-y border-white/5">
                <div>
                  <span className="text-[10px] uppercase text-slate-450 block">
                    Current Exchange Rate
                  </span>
                  {editingId === rateObj.id ? (
                    <input
                      type="number"
                      step="0.001"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      className="bg-slate-900 border border-indigo-500/50 rounded px-2 py-1 text-white font-bold text-xl w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-1"
                    />
                  ) : (
                    <div className="text-2xl font-extrabold text-white mt-1">
                      ₹{rateObj.rate.toFixed(3)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {editingId === rateObj.id ? (
                    <button
                      onClick={() => handleSaveRate(rateObj)}
                      disabled={updating}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center justify-center"
                    >
                      <Save size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => startEditing(rateObj)}
                      className="p-2 bg-slate-800/60 text-slate-300 border border-white/5 hover:bg-slate-700/60 rounded-xl transition flex items-center justify-center"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>
                  Last Updated: {new Date(rateObj.updated_at).toLocaleString()}
                </span>
                {rateObj.manual_override_rate && (
                  <span className="text-amber-600 font-medium">
                    Manual Override Applied
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
