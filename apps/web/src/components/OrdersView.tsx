'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, ShoppingCart, ArrowLeftRight, TrendingUp, DollarSign, Percent, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '@lumipuchi/shared';

interface OrderItem {
  id: string;
  product_id: string;
  sku: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  channel_order_id: string;
  channel_name: string;
  customer_name?: string;
  status: string; // pending, shipped, delivered, returned, cancelled
  selling_price: number;
  payout_amount: number;
  profit_margin: number;
  created_at: string;
  items: OrderItem[];
}

interface OrderReturn {
  id: string;
  order_id: string;
  product_id: string;
  sku: string;
  quantity: number;
  reason?: string;
  status: string; // initiated, received, restocked, lost
  refund_amount: number;
  created_at: string;
}

interface OrdersViewProps {
  token: string;
}

export default function OrdersView({ token }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = async () => {
    try {
      // Fetch orders
      const orderRes = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData);
      }

      // Fetch returns
      const returnRes = await fetch(`${API_URL}/returns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (returnRes.ok) {
        const returnData = await returnRes.json();
        setReturns(returnData);
      }

      // Fetch products to assist simulation
      const prodRes = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Simulate Channel Data Syncing (Celery Mockup)
  const handleSyncChannels = async () => {
    setSyncing(true);
    try {
      // Create a few mockup orders from Amazon/Flipkart/Meesho
      if (products.length === 0) {
        alert('Please create at least one product in the catalog first to sync orders!');
        setSyncing(false);
        return;
      }

      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const channels = ['Amazon Easy Ship', 'Amazon FBA', 'Flipkart', 'Meesho'];
      const customers = ['Aditya Verma', 'Priya Nair', 'Sneha Gupta', 'Vikram Sen'];
      const randomChannel = channels[Math.floor(Math.random() * channels.length)];
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      
      const qty = Math.floor(Math.random() * 3) + 1;
      const unitPrice = 499 + Math.floor(Math.random() * 500);
      const totalSP = qty * unitPrice;

      // Sync mock order
      const mockOrderNo = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderPayload = {
        channel_order_id: mockOrderNo,
        channel_name: randomChannel,
        customer_name: randomCustomer,
        status: 'pending',
        selling_price: totalSP,
        items: [
          {
            product_id: randomProduct.id,
            sku: randomProduct.sku,
            quantity: qty,
            unit_price: unitPrice
          }
        ]
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        // Maybe occasionally create a return
        if (Math.random() > 0.6) {
          const createdOrder = await res.json();
          const returnPayload = {
            order_id: createdOrder.id,
            product_id: randomProduct.id,
            sku: randomProduct.sku,
            quantity: 1,
            reason: 'wrong_item',
            status: 'initiated',
            refund_amount: unitPrice
          };

          await fetch(`${API_URL}/returns`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(returnPayload)
          });
        }
        await fetchData();
      }
    } catch (err) {
      console.error('Error syncing:', err);
    } finally {
      // Add fake animation delay for Celery job completion feel
      setTimeout(() => {
        setSyncing(false);
      }, 800);
    }
  };

  // Change order status (e.g. to shipped or delivered)
  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating order:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Process return restock
  const handleRestockReturn = async (returnId: string) => {
    try {
      const res = await fetch(`${API_URL}/returns/${returnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'restocked' })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error restocking return:', err);
    }
  };

  // Analytics helper calculations
  const totalSales = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.selling_price : sum, 0);
  const totalPayout = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.payout_amount : sum, 0);
  const totalProfit = orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.profit_margin : sum, 0);
  const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const returnRate = orders.length > 0 ? (returns.length / orders.length) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header with Sync Trigger */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-200 font-outfit">Orders & Returns Syncing</h2>
          <p className="text-xs text-slate-400 font-medium">Automatic marketplace channel API data pulling and stock allocation reservation</p>
        </div>

        <button
          onClick={handleSyncChannels}
          disabled={syncing}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-650 to-indigo-500 hover:from-indigo-600 hover:to-indigo-400 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition duration-300 shadow-lg shadow-indigo-950/40 disabled:opacity-50"
        >
          {syncing ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Syncing channels...
            </>
          ) : (
            <>
              <RefreshCw size={14} />
              Sync Marketplace Orders
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading channel records...</div>
      ) : (
        <>
          {/* Analytics Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Total Sales</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-white">₹{totalSales.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-1">Active listing gross value</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Estimated Payout</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-white">₹{totalPayout.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-1">Net receivable after commissions</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Net Profit</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-extrabold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                  ₹{totalProfit.toLocaleString('en-IN')}
                </span>
                <span className={`text-xs font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ({avgMargin.toFixed(1)}%)
                </span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-1">Profit after Landed cost & fees</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Returns Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-white">{returnRate.toFixed(1)}%</span>
                <span className="text-xs font-bold text-slate-400">({returns.length} returned)</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-1">Returned units ratio</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Center Column: Orders List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart size={16} /> Channel Orders list
              </h3>

              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                      <th className="p-3.5">Order Info</th>
                      <th className="p-3.5">Sale Value</th>
                      <th className="p-3.5 text-center">Commission / Payout</th>
                      <th className="p-3.5 text-center">Net Margin</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500">No synced orders found. Click Sync above to mock!</td>
                      </tr>
                    ) : (
                      orders.map(o => (
                        <tr key={o.id} className="hover:bg-white/5 transition">
                          <td className="p-3.5">
                            <span className="font-bold text-indigo-300 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-550/15">{o.channel_order_id}</span>
                            <span className="block text-slate-350 mt-1 truncate font-medium">{o.customer_name || 'Customer'}</span>
                            <span className="block text-[9px] text-slate-500 mt-0.5">{o.channel_name}</span>
                          </td>
                          <td className="p-3.5">
                            <strong className="text-slate-200">₹{o.selling_price.toFixed(2)}</strong>
                            <span className="block text-[9px] text-slate-500 mt-0.5">
                              {o.items.map(item => `${item.sku} (x${item.quantity})`).join(', ')}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <strong className="text-slate-300">₹{o.payout_amount.toFixed(2)}</strong>
                            <span className="block text-[9px] text-slate-500 mt-0.5">Fees: ₹{(o.selling_price - o.payout_amount).toFixed(0)}</span>
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span className={o.profit_margin >= 0 ? 'text-emerald-400' : 'text-rose-455'}>
                              ₹{o.profit_margin.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                              o.status === 'delivered' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' :
                              o.status === 'shipped' ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/10' :
                              o.status === 'cancelled' ? 'bg-slate-800 text-slate-500 border-white/5' :
                              'bg-amber-500/5 text-amber-400 border-amber-500/10'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {o.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'shipped')}
                                className="px-2 py-1 bg-indigo-650 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold transition"
                              >
                                Ship Order
                              </button>
                            )}
                            {o.status === 'shipped' && (
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'delivered')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold transition"
                              >
                                Deliver
                              </button>
                            )}
                            {o.status === 'delivered' && (
                              <span className="text-[10px] text-slate-500 font-medium">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Returns List */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ArrowLeftRight size={16} /> Returns Processing
              </h3>

              <div className="space-y-4">
                {returns.length === 0 ? (
                  <div className="glass-panel p-6 text-center text-slate-500 text-xs">No returns filed yet. Syncing can file random returns.</div>
                ) : (
                  returns.map(r => (
                    <div key={r.id} className="glass-card p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-bold block">{r.sku}</span>
                          <span className="text-[9px] text-slate-500">Qty: {r.quantity} | Reason: {r.reason || 'N/A'}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                          r.status === 'restocked' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' : 'bg-rose-500/5 text-rose-455 border-rose-500/10'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                        <span className="text-slate-450">Refund Amount: <strong className="text-slate-200">₹{r.refund_amount}</strong></span>
                        
                        {r.status !== 'restocked' && (
                          <button
                            onClick={() => handleRestockReturn(r.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold transition"
                          >
                            Restock Item
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
