import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

const apiReq = async (endpoint: string, method = 'GET', body?: any) => {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API request failed');
  return data;
};

interface IngredientItem {
  _id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  isLowStock?: boolean;
  batchNumber?: string;
  storageLocation?: string;
}

const Inventory = () => {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, outOfStock: 0, totalValue: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Quick Action Modal (Stock In / Stock Out / Adjust)
  const [activeModal, setActiveModal] = useState<'in' | 'out' | 'adjust' | null>(null);
  const [selectedItem, setSelectedItem] = useState<IngredientItem | null>(null);
  const [qtyInput, setQtyInput] = useState<number>(0);
  const [costInput, setCostInput] = useState<number>(0);
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create Ingredient Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Vegetable',
    unit: 'kg',
    currentStock: 0,
    minimumStock: 5,
    unitCost: 0,
    storageLocation: 'Dry Store',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ingRes, statsRes] = await Promise.all([
        apiReq(`/inventory/ingredients?lowStock=${onlyLowStock}&search=${search}`),
        apiReq('/inventory/stats'),
      ]);
      setIngredients(ingRes.data.ingredients || []);
      setStats(statsRes.data.stats || { totalItems: 0, lowStock: 0, outOfStock: 0, totalValue: 0, expiringSoon: 0 });
    } catch (err: any) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [onlyLowStock]);

  const handleStockAction = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      if (activeModal === 'in') {
        await apiReq(`/inventory/ingredients/${selectedItem._id}/stock-in`, 'POST', {
          quantity: Number(qtyInput),
          unitCost: costInput > 0 ? Number(costInput) : undefined,
          note: noteInput || 'Stock-in from inventory manager',
        });
      } else if (activeModal === 'out') {
        await apiReq(`/inventory/ingredients/${selectedItem._id}/stock-out`, 'POST', {
          quantity: Number(qtyInput),
          note: noteInput || 'Stock-out consumption',
        });
      } else if (activeModal === 'adjust') {
        await apiReq(`/inventory/ingredients/${selectedItem._id}/adjust`, 'POST', {
          newQuantity: Number(qtyInput),
          note: noteInput || 'Inventory physical count adjustment',
        });
      }
      setActiveModal(null);
      setSelectedItem(null);
      setQtyInput(0);
      setCostInput(0);
      setNoteInput('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiReq('/inventory/ingredients', 'POST', newItem);
      setShowCreateModal(false);
      setNewItem({
        name: '',
        category: 'Vegetable',
        unit: 'kg',
        currentStock: 0,
        minimumStock: 5,
        unitCost: 0,
        storageLocation: 'Dry Store',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(ingredients.map((i) => i.category)))];

  const filtered = ingredients.filter((item) => {
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📦</span>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Inventory & Raw Materials
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Real-time stock control, batch valuation, and automatic recipe deduction</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/50"
          >
            <span>+</span> Add Ingredient
          </button>
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-semibold uppercase">Total Tracked Items</p>
          <p className="text-2xl font-black text-white mt-1">{stats.totalItems}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-semibold uppercase">⚠️ Low Stock Alerts</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.lowStock}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-rose-400 text-xs font-semibold uppercase">🚫 Out of Stock</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{stats.outOfStock}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-emerald-400 text-xs font-semibold uppercase">💰 Inventory Value</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">ETB {Number(stats.totalValue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-purple-400 text-xs font-semibold uppercase">⏰ Expiring (7 Days)</p>
          <p className="text-2xl font-black text-purple-400 mt-1">{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <input
            type="text"
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
              onlyLowStock
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {onlyLowStock ? 'Showing Low Stock Only' : 'Filter Low Stock'}
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Ingredient</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Location</th>
                <th className="py-4 px-4">Stock Level</th>
                <th className="py-4 px-4">Min. Required</th>
                <th className="py-4 px-4">Unit Cost</th>
                <th className="py-4 px-4">Total Value</th>
                <th className="py-4 px-6 text-right">Quick Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No matching ingredients found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.currentStock <= item.minimumStock;
                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          {item.name}
                          {isLow && (
                            <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{item.category}</td>
                      <td className="py-4 px-4 text-slate-400">{item.storageLocation || 'Dry Store'}</td>
                      <td className="py-4 px-4 font-bold">
                        <span className={isLow ? 'text-amber-400' : 'text-emerald-400'}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{item.minimumStock} {item.unit}</td>
                      <td className="py-4 px-4 text-slate-300">ETB {Number(item.unitCost).toFixed(2)}</td>
                      <td className="py-4 px-4 font-semibold text-slate-200">
                        ETB {(item.currentStock * item.unitCost).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedItem(item); setActiveModal('in'); }}
                            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/30 transition-all"
                            title="Stock In"
                          >
                            + In
                          </button>
                          <button
                            onClick={() => { setSelectedItem(item); setActiveModal('out'); }}
                            className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 transition-all"
                            title="Stock Out"
                          >
                            - Out
                          </button>
                          <button
                            onClick={() => { setSelectedItem(item); setQtyInput(item.currentStock); setActiveModal('adjust'); }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-all"
                            title="Adjust Exact Count"
                          >
                            ⚖️ Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock In / Out / Adjust Modal */}
      <AnimatePresence>
        {activeModal && selectedItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                {activeModal === 'in' && '📥 Stock In (Receive Material)'}
                {activeModal === 'out' && '📤 Stock Out (Consumption/Waste)'}
                {activeModal === 'adjust' && '⚖️ Adjust Physical Count'}
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Item: <span className="text-emerald-400 font-semibold">{selectedItem.name}</span> (Current: {selectedItem.currentStock} {selectedItem.unit})
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    {activeModal === 'adjust' ? `New Target Quantity (${selectedItem.unit})` : `Quantity to ${activeModal === 'in' ? 'Add' : 'Deduct'} (${selectedItem.unit})`}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={qtyInput}
                    onChange={(e) => setQtyInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                {activeModal === 'in' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Unit Cost in ETB (Optional override)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={`Current: ETB ${selectedItem.unitCost}`}
                      value={costInput || ''}
                      onChange={(e) => setCostInput(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Audit Note</label>
                  <input
                    type="text"
                    placeholder="Reason, invoice #, or supplier note..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleStockAction}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  {submitting ? 'Updating...' : 'Confirm Stock Action'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Ingredient Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Register New Ingredient</h3>
              <form onSubmit={handleCreateIngredient} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ingredient Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Teff Flour, Beef Sirloin, Olive Oil"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Meat, Grain, Dairy"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Unit of Measure</label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="kg">kg (Kilogram)</option>
                      <option value="g">g (Gram)</option>
                      <option value="L">L (Liter)</option>
                      <option value="ml">ml (Milliliter)</option>
                      <option value="piece">piece (Count)</option>
                      <option value="pack">pack</option>
                      <option value="bottle">bottle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      value={newItem.currentStock}
                      onChange={(e) => setNewItem({ ...newItem, currentStock: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Min. Alert Qty</label>
                    <input
                      type="number"
                      value={newItem.minimumStock}
                      onChange={(e) => setNewItem({ ...newItem, minimumStock: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Unit Cost (ETB)</label>
                    <input
                      type="number"
                      value={newItem.unitCost}
                      onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Storage Area</label>
                  <select
                    value={newItem.storageLocation}
                    onChange={(e) => setNewItem({ ...newItem, storageLocation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Dry Store">Dry Store</option>
                    <option value="Fridge">Fridge</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Bar">Bar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                  >
                    {submitting ? 'Saving...' : 'Register Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;

