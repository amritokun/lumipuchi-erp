'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, ShieldAlert, CheckCircle, Package, History, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_qty: number;
  in_transit_qty: number;
  allocated_qty: number;
  virtual_qty: number;
  reorder_level: number;
  shelf: string | null;
  bin: string | null;
  product: {
    id: string;
    sku: string;
    name: string;
  };
}

interface StockLog {
  id: string;
  product_id: string;
  log_type: string;
  quantity: number;
  reference: string | null;
  created_at: string;
  product: {
    id: string;
    sku: string;
    name: string;
  };
}

interface InventoryViewProps {
  token: string;
}

export default function InventoryView({ token }: InventoryViewProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Adjustment Form state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newQty, setNewQty] = useState<number>(0);
  const [refReason, setRefReason] = useState<string>('Stock Audit');
  const [adjusting, setAdjusting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = async () => {
    try {
      // Fetch Inventory
      const invRes = await fetch(`${API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData);
      }

      // Fetch Logs
      const logsRes = await fetch(`${API_URL}/inventory/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setAdjusting(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/inventory/${editingItem.product_id}?reference=${encodeURIComponent(refReason)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          warehouse_qty: newQty
        })
      });

      if (res.ok) {
        setEditingItem(null);
        setRefReason('Stock Audit');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to adjust stock levels.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setAdjusting(false);
    }
  };

  const startAdjusting = (item: InventoryItem) => {
    setEditingItem(item);
    setNewQty(item.warehouse_qty);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-indigo-200 font-outfit">Virtual Stock & Warehouse Inventory</h2>
        <p className="text-xs text-slate-400">Physical levels, in-transit shipping reserves, and stock adjustments logs</p>
      </div>

      {/* Adjust Stock Modal/Section */}
      {editingItem && (
        <form onSubmit={handleAdjust} className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-350 uppercase tracking-wider flex items-center gap-2">
            <Edit2 size={14} /> Adjust Stock for {editingItem.product.sku}
          </h3>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">New Physical Quantity</label>
              <input
                type="number"
                required
                value={newQty}
                onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-450 mb-1">Adjustment Reason / Reference</label>
              <input
                type="text"
                required
                value={refReason}
                onChange={(e) => setRefReason(e.target.value)}
                placeholder="E.g., Warehouse Stocktake Audit"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adjusting}
              className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-800 text-white rounded-xl text-xs font-bold transition"
            >
              {adjusting ? 'Saving...' : 'Apply Adjustment'}
            </button>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition border border-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading inventory master...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inventory Table List */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={14} /> Warehouse Stock Summary
            </h4>
            
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-900/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-white/5 text-slate-450 font-semibold uppercase text-[10px]">
                    <th className="p-3.5">SKU / Item</th>
                    <th className="p-3.5 text-center">Warehouse</th>
                    <th className="p-3.5 text-center">In Transit</th>
                    <th className="p-3.5 text-center">Allocated</th>
                    <th className="p-3.5 text-center bg-indigo-500/5 text-indigo-300">Virtual Qty</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {inventory.map((item) => {
                    const isLowStock = item.warehouse_qty <= item.reorder_level;
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="p-3.5 max-w-[200px]">
                          <span className="font-bold text-indigo-300 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-550/15">{item.product.sku}</span>
                          <span className="block text-slate-350 mt-1 truncate font-medium">{item.product.name}</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-slate-200">{item.warehouse_qty}</span>
                            {isLowStock && (
                              <span title="Low Stock Warning">
                                <ShieldAlert size={14} className="text-amber-450" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-medium text-slate-350">{item.in_transit_qty}</td>
                        <td className="p-3.5 text-center font-medium text-slate-450">{item.allocated_qty}</td>
                        <td className="p-3.5 text-center bg-indigo-500/5 font-extrabold text-white">{item.virtual_qty}</td>
                        <td className="p-3.5 text-slate-400 font-medium">
                          {item.shelf || item.bin ? (
                            <span>{item.shelf || '-'}{item.bin ? ` / ${item.bin}` : ''}</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => startAdjusting(item)}
                            className="p-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded border border-white/5 transition inline-flex items-center justify-center"
                            title="Adjust Qty"
                          >
                            <Edit2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Audit Logs */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History size={14} /> Stock Movement Logs
            </h4>

            {logs.length === 0 ? (
              <div className="glass-card text-center py-8 rounded-2xl text-xs text-slate-500">
                No inventory logs recorded.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {logs.map((log) => {
                  const isStockIn = log.log_type === 'stock_in';
                  return (
                    <div key={log.id} className="p-3.5 bg-slate-900/40 border border-white/5 rounded-xl flex gap-3 items-start text-xs">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isStockIn ? 'bg-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 text-rose-450'}`}>
                        {isStockIn ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div className="truncate flex-1 space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-200">{log.product.sku}</span>
                          <span className={`font-bold ${isStockIn ? 'text-emerald-450' : 'text-rose-455'}`}>
                            {isStockIn ? '+' : ''}{log.quantity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-450 truncate">{log.reference || 'Stock Adjustment'}</p>
                        <span className="text-[9px] text-slate-550 block pt-1">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
