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

interface SupplierItem {
  _id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  category: string;
  paymentTerms?: string;
  rating?: number;
}

interface POItem {
  _id: string;
  poNumber: string;
  supplier: { _id: string; name: string; phone: string };
  status: 'draft' | 'submitted' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  items: {
    ingredient: { _id: string; name: string; unit: string };
    orderedQty: number;
    receivedQty?: number;
    unitCost: number;
    totalCost: number;
  }[];
  totalAmount: number;
  createdAt: string;
}

const Procurement = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [orders, setOrders] = useState<POItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPOs: 0, pendingPOs: 0, totalSpend: 0, supplierCount: 0 });
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<{ ingredientId: string; orderedQty: number; unitCost: number; unit: string }[]>([]);

  // New Supplier Modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Meat Supplier',
    paymentTerms: 'Cash on Delivery',
  });

  // GRN (Goods Received Note) Modal
  const [receivingPO, setReceivingPO] = useState<POItem | null>(null);
  const [receivedInputs, setReceivedInputs] = useState<Record<string, number>>({});
  const [deliveryNote, setDeliveryNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, statsRes, ingRes] = await Promise.all([
        apiReq('/procurement/orders'),
        apiReq('/procurement/suppliers'),
        apiReq('/procurement/stats'),
        apiReq('/inventory/ingredients'),
      ]);
      setOrders(poRes.data.orders || []);
      setSuppliers(supRes.data.suppliers || []);
      setStats(statsRes.data.stats || { totalPOs: 0, pendingPOs: 0, totalSpend: 0, supplierCount: 0 });
      setIngredients(ingRes.data?.ingredients || []);
    } catch (err: any) {
      console.error('Failed to load procurement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addPOItemRow = () => {
    if (ingredients.length === 0) return;
    const first = ingredients[0];
    setPoItems([
      ...poItems,
      { ingredientId: first._id, orderedQty: 10, unitCost: first.unitCost, unit: first.unit },
    ]);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) {
      alert('Please choose a supplier and add items to purchase');
      return;
    }
    try {
      await apiReq('/procurement/orders', 'POST', {
        supplier: selectedSupplierId,
        items: poItems.map((p) => ({
          ingredient: p.ingredientId,
          orderedQty: Number(p.orderedQty),
          unitCost: Number(p.unitCost),
          unit: p.unit,
        })),
      });
      setShowPOModal(false);
      setSelectedSupplierId('');
      setPoItems([]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create purchase order');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiReq('/procurement/suppliers', 'POST', newSupplier);
      setShowSupplierModal(false);
      setNewSupplier({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        category: 'Meat Supplier',
        paymentTerms: 'Cash on Delivery',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to register supplier');
    }
  };

  const handleStatusChange = async (poId: string, status: string) => {
    try {
      await apiReq(`/procurement/orders/${poId}/status`, 'PATCH', { status });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    }
  };

  const handleReceiveGoods = async () => {
    if (!receivingPO) return;
    try {
      const payload = receivingPO.items.map((item) => ({
        ingredientId: item.ingredient._id,
        receivedQty: Number(receivedInputs[item.ingredient._id] || item.orderedQty),
        unitCost: item.unitCost,
      }));
      await apiReq(`/procurement/orders/${receivingPO._id}/receive`, 'POST', {
        receivedItems: payload,
        deliveryNote,
      });
      setReceivingPO(null);
      setReceivedInputs({});
      setDeliveryNote('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'GRN processing failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚛</span>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Procurement &amp; Suppliers
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Vendor lifecycle, purchase orders (POs), and Goods Received Notes (GRN)</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'orders' ? (
            <button
              onClick={() => {
                setShowPOModal(true);
                if (poItems.length === 0) addPOItemRow();
              }}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-950/50"
            >
              <span>+</span> Issue Purchase Order
            </button>
          ) : (
            <button
              onClick={() => setShowSupplierModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-950/50"
            >
              <span>+</span> Register Supplier
            </button>
          )}
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-semibold uppercase">Total Purchase Orders</p>
          <p className="text-2xl font-black text-white mt-1">{stats.totalPOs}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-semibold uppercase">Pending Deliveries</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.pendingPOs}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-emerald-400 text-xs font-semibold uppercase">Procurement Spend</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">ETB {Number(stats.totalSpend || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-cyan-400 text-xs font-semibold uppercase">Active Vendors</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{stats.supplierCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'orders'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📜 Purchase Orders (POs)
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'suppliers'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🏢 Supplier Directory ({suppliers.length})
        </button>
      </div>

      {/* Tab: POs */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">PO Number</th>
                  <th className="py-4 px-4">Supplier</th>
                  <th className="py-4 px-4">Items Count</th>
                  <th className="py-4 px-4">Total Amount</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Created Date</th>
                  <th className="py-4 px-6 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No purchase orders issued yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => (
                    <tr key={po._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-cyan-400">{po.poNumber}</td>
                      <td className="py-4 px-4 font-semibold text-white">{po.supplier?.name || 'Vendor'}</td>
                      <td className="py-4 px-4 text-slate-300">{po.items?.length || 0} line items</td>
                      <td className="py-4 px-4 font-bold text-white">ETB {Number(po.totalAmount).toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs uppercase font-extrabold px-2.5 py-1 rounded-full ${
                            po.status === 'received'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : po.status === 'ordered'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : po.status === 'approved'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : po.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {po.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(po._id, 'submitted')}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 font-semibold"
                            >
                              Submit
                            </button>
                          )}
                          {po.status === 'submitted' && (
                            <button
                              onClick={() => handleStatusChange(po._id, 'approved')}
                              className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {po.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(po._id, 'ordered')}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-semibold"
                            >
                              Mark Dispatched
                            </button>
                          )}
                          {(po.status === 'ordered' || po.status === 'partially_received') && (
                            <button
                              onClick={() => {
                                setReceivingPO(po);
                                const initMap: Record<string, number> = {};
                                po.items.forEach((item) => {
                                  initMap[item.ingredient._id] = item.orderedQty - (item.receivedQty || 0);
                                });
                                setReceivedInputs(initMap);
                              }}
                              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold shadow-md shadow-emerald-950/40"
                            >
                              📥 Receive Goods (GRN)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((s) => (
            <div key={s._id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-lg font-bold text-white">{s.name}</h3>
                <span className="text-xs bg-slate-800 text-cyan-400 font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                  {s.category}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400 my-4">
                <p>📞 Phone: <span className="text-slate-200 font-mono">{s.phone}</span></p>
                {s.email && <p>✉️ Email: <span className="text-slate-200">{s.email}</span></p>}
                {s.contactPerson && <p>👤 Contact: <span className="text-slate-200">{s.contactPerson}</span></p>}
                <p>💳 Terms: <span className="text-slate-200">{s.paymentTerms || 'Cash'}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue PO Modal */}
      <AnimatePresence>
        {showPOModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Issue New Purchase Order</h3>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Vendor</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Choose Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Line Items</label>
                    <button
                      type="button"
                      onClick={addPOItemRow}
                      className="text-xs bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white px-3 py-1 rounded-lg border border-cyan-500/30 font-semibold"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {poItems.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <select
                          value={row.ingredientId}
                          onChange={(e) => {
                            const ing = ingredients.find((i) => i._id === e.target.value);
                            const updated = [...poItems];
                            updated[idx].ingredientId = e.target.value;
                            if (ing) {
                              updated[idx].unit = ing.unit;
                              updated[idx].unitCost = ing.unitCost;
                            }
                            setPoItems(updated);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing._id} value={ing._id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={row.orderedQty}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].orderedQty = parseFloat(e.target.value) || 0;
                            setPoItems(updated);
                          }}
                          className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                        <span className="text-xs text-slate-400 font-mono w-10">{row.unit}</span>
                        <input
                          type="number"
                          placeholder="Cost"
                          value={row.unitCost}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].unitCost = parseFloat(e.target.value) || 0;
                            setPoItems(updated);
                          }}
                          className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 px-2 py-1 font-bold text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPOModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                  >
                    Issue Purchase Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receive Goods GRN Modal */}
      <AnimatePresence>
        {receivingPO && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">📥 Receive Materials (GRN)</h3>
              <p className="text-slate-400 text-sm mb-4">
                PO: <span className="text-cyan-400 font-mono font-bold">{receivingPO.poNumber}</span> | Vendor: {receivingPO.supplier?.name}
              </p>

              <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
                {receivingPO.items.map((item) => (
                  <div key={item.ingredient._id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-white">{item.ingredient.name}</p>
                      <p className="text-xs text-slate-400">
                        Ordered: {item.orderedQty} {item.ingredient.unit} | Received so far: {item.receivedQty || 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        value={receivedInputs[item.ingredient._id] || 0}
                        onChange={(e) =>
                          setReceivedInputs({
                            ...receivedInputs,
                            [item.ingredient._id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-xs text-slate-400">{item.ingredient.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Delivery / Waybill Reference Note</label>
                <input
                  type="text"
                  placeholder="e.g. Waybill #88392 delivered in good condition"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setReceivingPO(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReceiveGoods}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Accept Delivery &amp; Restock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supplier Registration Modal */}
      <AnimatePresence>
        {showSupplierModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Register New Supplier</h3>
              <form onSubmit={handleCreateSupplier} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Vendor Name</label>
                  <input
                    required
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Phone</label>
                  <input
                    required
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                    <input
                      required
                      type="text"
                      value={newSupplier.category}
                      onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={newSupplier.contactPerson}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                  >
                    Register Vendor
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

export default Procurement;
