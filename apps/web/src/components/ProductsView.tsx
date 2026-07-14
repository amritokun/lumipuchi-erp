'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Tag, Layers, Scale, Bookmark, ShoppingBag, Eye, Barcode } from 'lucide-react';
import { Supplier, Product } from '@lumipuchi/shared';

interface ProductsViewProps {
  token: string;
}

export default function ProductsView({ token }: ProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [sku, setSku] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [catalogueId, setCatalogueId] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [variant, setVariant] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierSku, setSupplierSku] = useState<string>('');
  const [hsn, setHsn] = useState<string>('');
  const [gstPercent, setGstPercent] = useState<number>(18.0);
  const [weight, setWeight] = useState<number>(0);
  const [dimensions, setDimensions] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [shelf, setShelf] = useState<string>('');
  const [bin, setBin] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.filter((s: Supplier) => s.is_active));
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sku,
          name,
          catalogue_id: catalogueId || undefined,
          brand: brand || undefined,
          description: description || undefined,
          category: category || undefined,
          variant: variant || undefined,
          color: color || undefined,
          supplier_id: supplierId,
          supplier_sku: supplierSku || undefined,
          hsn: hsn || undefined,
          gst_percent: gstPercent,
          weight,
          dimensions: dimensions || undefined,
          barcode: barcode || undefined,
          reorder_level: reorderLevel,
          shelf: shelf || undefined,
          bin: bin || undefined
        })
      });

      if (res.ok) {
        setSku('');
        setName('');
        setCatalogueId('');
        setBrand('');
        setDescription('');
        setCategory('');
        setVariant('');
        setColor('');
        setSupplierId('');
        setSupplierSku('');
        setHsn('');
        setGstPercent(18.0);
        setWeight(0);
        setDimensions('');
        setBarcode('');
        setReorderLevel(10);
        setShelf('');
        setBin('');
        setShowAddForm(false);
        fetchProducts();
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to create product.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-indigo-200 font-outfit">Product Master Catalog</h2>
          <p className="text-xs text-slate-400">Manage seller inventory catalog, SKUs, and specifications</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-650/20"
        >
          <Plus size={16} />
          {showAddForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">New Product Master SKU</h3>
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="LUMI-BAG-BLK-01"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-450 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Waterproof Anti-Theft Laptop Backpack"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Supplier *</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm appearance-none"
              >
                <option value="" className="bg-slate-950">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-950">{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Supplier SKU</label>
              <input
                type="text"
                value={supplierSku}
                onChange={(e) => setSupplierSku(e.target.value)}
                placeholder="CN-BAG-502"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="LumiSport"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Catalogue Link/ID</label>
              <input
                type="text"
                value={catalogueId}
                onChange={(e) => setCatalogueId(e.target.value)}
                placeholder="CAT-2026"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Bags & Travel"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Variant</label>
              <input
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="Large Size"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Matte Black"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Barcode Value</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="8901234567890"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">HSN Code</label>
              <input
                type="text"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                placeholder="42021290"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">GST Rate (%)</label>
              <input
                type="number"
                value={gstPercent}
                onChange={(e) => setGstPercent(parseFloat(e.target.value) || 18.0)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-450 mb-1">Dimensions (LxWxH cm)</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="45 x 32 x 18"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Inventory Storage Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-450 mb-1">Warehouse Reorder Level</label>
                <input
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-450 mb-1">Storage Shelf</label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="Row B"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-450 mb-1">Storage Bin</label>
                <input
                  type="text"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                  placeholder="Bin 24"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl text-xs transition"
          >
            {submitting ? 'Creating Product...' : 'Create SKU'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading catalog...</div>
      ) : products.length === 0 ? (
        <div className="glass-panel text-center py-12 rounded-2xl text-slate-400">
          No products configured. Click "Add Product" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-white/5 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    {product.sku}
                  </span>
                  <h4 className="text-lg font-bold text-white font-outfit mt-2">{product.name}</h4>
                  <span className="text-xs text-slate-400 mt-1 block">Supplier: {product.supplier.name}</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${
                  product.is_active 
                    ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-350">
                {product.brand && (
                  <div className="flex items-center gap-1.5">
                    <Bookmark size={12} className="text-slate-550" />
                    <span>Brand: <strong className="text-slate-200">{product.brand}</strong></span>
                  </div>
                )}
                {product.category && (
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} className="text-slate-550" />
                    <span>Category: <strong className="text-slate-200">{product.category}</strong></span>
                  </div>
                )}
                {product.variant && (
                  <div className="flex items-center gap-1.5">
                    <Layers size={12} className="text-slate-550" />
                    <span>Variant: <strong className="text-slate-200">{product.variant}</strong></span>
                  </div>
                )}
                {product.weight > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Scale size={12} className="text-slate-550" />
                    <span>Weight: <strong className="text-slate-200">{product.weight} kg</strong></span>
                  </div>
                )}
                {product.barcode && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Barcode size={12} className="text-slate-550" />
                    <span>Barcode: <code className="text-slate-300 font-mono font-bold bg-slate-900/60 px-1.5 py-0.5 rounded">{product.barcode}</code></span>
                  </div>
                )}
              </div>

              {product.description && (
                <p className="text-xs text-slate-450 line-clamp-2 italic border-t border-white/5 pt-2">
                  {product.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
