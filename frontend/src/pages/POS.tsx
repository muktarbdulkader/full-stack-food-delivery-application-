import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface POSFood {
  _id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  portions?: { name: string; price: number; isDefault?: boolean }[];
  extras?: { name: string; price: number }[];
  preparationTimeMinutes?: number;
  kitchenStation?: string;
}

interface POSTable {
  _id: string;
  tableNumber: string;
  area?: string;
  capacity?: number;
  status?: string;
}

interface CartItem {
  food: POSFood;
  quantity: number;
  selectedPortion?: string;
  selectedExtras: { name: string; price: number }[];
  instructions: string;
  unitPrice: number;
  lineTotal: number;
}

interface DayStat {
  totalOrders: number;
  totalRevenue: number;
  byType: { _id: string; count: number; revenue: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

const apiCall = async (path: string, method = 'GET', body?: object) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2 }).format(n);

const categoryIcons: Record<string, string> = {
  all: '🍽️',
  breakfast: '🌅',
  lunch: '🌞',
  dinner: '🌙',
  drinks: '🥤',
  desserts: '🍰',
  snacks: '🍟',
  traditional: '🥘',
  salads: '🥗',
  grill: '🔥',
};

const getCatIcon = (cat: string) =>
  categoryIcons[cat.toLowerCase()] ?? '🍴';

// ─── Item Customization Modal ─────────────────────────────────────────────────
const CustomizeModal = ({
  food,
  onAdd,
  onClose,
}: {
  food: POSFood;
  onAdd: (item: Omit<CartItem, 'lineTotal'>) => void;
  onClose: () => void;
}) => {
  const defaultPortion = food.portions?.find((p) => p.isDefault) ?? food.portions?.[0];
  const [portion, setPortion] = useState(defaultPortion?.name ?? '');
  const [extras, setExtras] = useState<{ name: string; price: number }[]>([]);
  const [instructions, setInstructions] = useState('');
  const [qty, setQty] = useState(1);

  const portionPrice =
    food.portions?.find((p) => p.name === portion)?.price ?? food.price;
  const extrasTotal = extras.reduce((s, e) => s + e.price, 0);
  const unitPrice = portionPrice + extrasTotal;

  const toggleExtra = (extra: { name: string; price: number }) => {
    setExtras((prev) =>
      prev.some((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Food Header */}
        <div className="relative h-40 overflow-hidden rounded-t-2xl">
          {food.image ? (
            <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-5xl">
              🍴
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            ✕
          </button>
          <div className="absolute bottom-3 left-4">
            <h3 className="text-white font-black text-lg">{food.name}</h3>
            <p className="text-orange-300 font-bold">ETB {fmt(food.price)}</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Portions */}
          {food.portions && food.portions.length > 0 && (
            <div>
              <p className="text-gray-300 font-semibold text-sm mb-2">Size / Portion</p>
              <div className="grid grid-cols-3 gap-2">
                {food.portions.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setPortion(p.name)}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                      portion === p.name
                        ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div>{p.name}</div>
                    <div className="text-xs font-normal">ETB {fmt(p.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          {food.extras && food.extras.length > 0 && (
            <div>
              <p className="text-gray-300 font-semibold text-sm mb-2">Extras</p>
              <div className="space-y-2">
                {food.extras.map((ex) => {
                  const checked = extras.some((e) => e.name === ex.name);
                  return (
                    <label
                      key={ex.name}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            checked ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                          }`}
                        >
                          {checked && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <span className="text-gray-300 text-sm">{ex.name}</span>
                      </div>
                      <span className="text-blue-400 text-sm font-semibold">
                        +ETB {fmt(ex.price)}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExtra(ex)}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div>
            <p className="text-gray-300 font-semibold text-sm mb-2">Special Instructions</p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. No onions, less spicy…"
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Quantity + Add */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="text-orange-400 font-black text-xl w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded-lg"
              >
                −
              </button>
              <span className="text-white font-bold text-lg w-6 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="text-orange-400 font-black text-xl w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded-lg"
              >
                +
              </button>
            </div>
            <button
              onClick={() => {
                onAdd({ food, quantity: qty, selectedPortion: portion, selectedExtras: extras, instructions, unitPrice });
                onClose();
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm"
            >
              Add to Order • ETB {fmt(unitPrice * qty)}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Receipt Modal ────────────────────────────────────────────────────────────
const ReceiptModal = ({
  order,
  onClose,
}: {
  order: any;
  onClose: () => void;
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const printReceipt = () => {
    const content = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Receipt</title><style>
      body{font-family:monospace;font-size:12px;width:280px;margin:auto}
      h2,h3{text-align:center;margin:4px 0} .line{border-top:1px dashed #000;margin:6px 0}
      .row{display:flex;justify-content:space-between} .total{font-weight:bold;font-size:14px}
    </style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div ref={printRef} className="p-6 font-mono text-sm text-gray-900">
          <h2 className="text-center font-black text-lg">🍽️ FoodHub</h2>
          <h3 className="text-center text-gray-600">POS Receipt</h3>
          <div className="border-t border-dashed border-gray-400 my-3" />
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Order: #{order.orderNumber}</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          {order.tableNumber && (
            <div className="text-xs text-gray-500">Table: {order.tableNumber}</div>
          )}
          <div className="text-xs text-gray-500 mb-3">
            Type: {order.orderType?.replace('_', ' ').toUpperCase()}
          </div>
          <div className="border-t border-dashed border-gray-400 my-2" />
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between py-0.5">
              <span className="flex-1">
                {item.quantity}× {item.food?.name ?? 'Item'}
                {item.selectedPortion ? ` (${item.selectedPortion})` : ''}
              </span>
              <span>ETB {fmt(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="flex justify-between text-xs"><span>Subtotal</span><span>ETB {fmt(order.subtotal ?? 0)}</span></div>
          <div className="flex justify-between text-xs"><span>Tax (15%)</span><span>ETB {fmt(order.tax ?? 0)}</span></div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-xs text-green-700"><span>Discount</span><span>-ETB {fmt(order.discount)}</span></div>
          )}
          <div className="border-t border-dashed border-gray-400 my-2" />
          <div className="flex justify-between font-black text-base">
            <span>TOTAL</span><span>ETB {fmt(order.totalAmount ?? 0)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Payment</span><span className="capitalize">{order.payment?.method}</span>
          </div>
          <div className="border-t border-dashed border-gray-400 my-3" />
          <p className="text-center text-xs text-gray-500">Thank you for dining with us!</p>
        </div>

        <div className="flex gap-3 p-4 bg-gray-50 border-t">
          <button
            onClick={printReceipt}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
          >
            🖨️ Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
          >
            New Sale ✓
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── POS Page ─────────────────────────────────────────────────────────────────
const POS = () => {
  const [foods, setFoods] = useState<POSFood[]>([]);
  const [tables, setTables] = useState<POSTable[]>([]);
  const [stats, setStats] = useState<DayStat | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const categories = ['all', ...Array.from(new Set(foods.map((f) => f.category.toLowerCase())))];

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizeFood, setCustomizeFood] = useState<POSFood | null>(null);

  // Order options
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('takeaway');
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'telebirr' | 'mpesa' | 'cbebirr'>('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  // Checkout
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [foodRes, tableRes, statsRes] = await Promise.all([
        apiCall('/foods?limit=200'),
        apiCall('/pos/tables'),
        apiCall(`/pos/stats?date=${new Date().toISOString().slice(0, 10)}`),
      ]);
      setFoods(foodRes.data?.foods ?? foodRes.data ?? []);
      setTables(tableRes.data?.tables ?? []);
      setStats(statsRes.data?.stats ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { searchRef.current?.focus(); }, []);

  // Cart helpers
  const addToCart = (item: Omit<CartItem, 'lineTotal'>) => {
    setCart((prev) => {
      const existing = prev.findIndex(
        (c) =>
          c.food._id === item.food._id &&
          c.selectedPortion === item.selectedPortion &&
          c.instructions === item.instructions
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + item.quantity,
          lineTotal: (updated[existing].quantity + item.quantity) * updated[existing].unitPrice,
        };
        return updated;
      }
      return [...prev, { ...item, lineTotal: item.unitPrice * item.quantity }];
    });
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setCart((prev) =>
        prev.map((item, i) =>
          i === idx ? { ...item, quantity: qty, lineTotal: item.unitPrice * qty } : item
        )
      );
    }
  };

  const subtotal = cart.reduce((s, c) => s + c.lineTotal, 0);
  const tax = subtotal * 0.15;
  const discountAmt = Math.min(discount, subtotal);
  const total = subtotal + tax - discountAmt;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (orderType === 'dine_in' && !selectedTable) {
      alert('Please select a table for dine-in orders');
      return;
    }

    setCheckingOut(true);
    try {
      const table = tables.find((t) => t._id === selectedTable);
      const res = await apiCall('/pos/sale', 'POST', {
        items: cart.map((c) => ({
          foodId: c.food._id,
          quantity: c.quantity,
          selectedPortion: c.selectedPortion,
          selectedExtras: c.selectedExtras,
          instructions: c.instructions,
        })),
        orderType,
        tableId: selectedTable || undefined,
        tableNumber: table?.tableNumber,
        customerName: customerName || undefined,
        discount: discountAmt,
        paymentMethod,
        notes,
      });

      setLastOrder(res.data.order);
      setShowReceipt(true);
      setCart([]);
      setDiscount(0);
      setNotes('');
      setCustomerName('');
      setSelectedTable('');
      fetchData();
    } catch (err: any) {
      alert(err.message ?? 'Sale failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredFoods = foods.filter((f) => {
    const matchCat = category === 'all' || f.category.toLowerCase() === category;
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && f.isAvailable;
  });

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg">🏪</div>
          <div>
            <h1 className="text-white font-black text-lg">Point of Sale</h1>
            <p className="text-gray-400 text-xs">FoodHub — Cashier Station</p>
          </div>
        </div>

        {/* Today's Stats */}
        {stats && (
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-white font-black text-xl">{stats.totalOrders}</p>
              <p className="text-gray-500 text-xs">Today's Orders</p>
            </div>
            <div className="border-l border-gray-700" />
            <div>
              <p className="text-green-400 font-black text-xl">ETB {fmt(stats.totalRevenue)}</p>
              <p className="text-gray-500 text-xs">Today's Revenue</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Menu ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + Categories */}
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 space-y-3">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search food… (type to filter)"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 text-sm"
            />
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    category === cat
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span>{getCatIcon(cat)}</span>
                  <span className="capitalize">{cat === 'all' ? 'All Items' : cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Food Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <span className="text-4xl">🍽️</span>
                <p className="text-gray-500">No items found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredFoods.map((food) => (
                  <motion.button
                    key={food._id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCustomizeFood(food)}
                    className="bg-gray-900 border border-gray-800 hover:border-orange-500 rounded-2xl overflow-hidden text-left transition-all group"
                  >
                    <div className="relative h-28 overflow-hidden bg-gray-800">
                      {food.image ? (
                        <img
                          src={food.image}
                          alt={food.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-orange-900 to-red-900">
                          🍴
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="bg-orange-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">
                          +
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-white text-xs font-bold leading-tight line-clamp-2">
                        {food.name}
                      </p>
                      <p className="text-orange-400 text-xs font-black mt-1">
                        ETB {fmt(food.price)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Order Panel ──────────────────────────────────────────── */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Order Type */}
          <div className="p-4 border-b border-gray-800">
            <p className="text-gray-400 text-xs font-semibold mb-2">ORDER TYPE</p>
            <div className="grid grid-cols-3 gap-2">
              {(['dine_in', 'takeaway', 'delivery'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => { setOrderType(type); setSelectedTable(''); }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    orderType === type
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {type === 'dine_in' ? '🍽 Dine-In' : type === 'takeaway' ? '🛍 Takeaway' : '🛵 Delivery'}
                </button>
              ))}
            </div>

            {/* Table Selector */}
            {orderType === 'dine_in' && (
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="">Select Table…</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Table {t.tableNumber}{t.area ? ` — ${t.area}` : ''}
                  </option>
                ))}
              </select>
            )}

            {/* Customer Name */}
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 p-4">
                <span className="text-4xl opacity-30">🛒</span>
                <p className="text-gray-600 text-sm">Order is empty</p>
                <p className="text-gray-700 text-xs">Click menu items to add</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <AnimatePresence>
                  {cart.map((item, idx) => (
                    <motion.div
                      key={`${item.food._id}-${item.selectedPortion}-${idx}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-gray-800 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold leading-tight truncate">
                          {item.food.name}
                        </p>
                        {item.selectedPortion && (
                          <p className="text-gray-500 text-xs">{item.selectedPortion}</p>
                        )}
                        {item.selectedExtras.length > 0 && (
                          <p className="text-blue-400 text-xs truncate">
                            +{item.selectedExtras.map((e) => e.name).join(', ')}
                          </p>
                        )}
                        <p className="text-orange-400 text-xs font-black mt-0.5">
                          ETB {fmt(item.lineTotal)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => updateQty(idx, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-orange-400 font-black hover:bg-gray-600 rounded"
                        >
                          −
                        </button>
                        <span className="text-white font-bold text-sm w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(idx, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-orange-400 font-black hover:bg-gray-600 rounded"
                        >
                          +
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Totals + Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-gray-800 p-4 space-y-3">
              {/* Discount */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-xs font-semibold w-20">Discount</label>
                <input
                  type="number"
                  min={0}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="ETB 0"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Notes */}
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />

              {/* Totals */}
              <div className="bg-gray-800 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>ETB {fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (15%)</span>
                  <span>ETB {fmt(tax)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>−ETB {fmt(discountAmt)}</span>
                  </div>
                )}
                <div className="border-t border-gray-700 pt-1.5 flex justify-between text-white font-black text-base">
                  <span>TOTAL</span>
                  <span>ETB {fmt(total)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-gray-400 text-xs font-semibold mb-2">PAYMENT</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['cash', 'telebirr', 'mpesa', 'cbebirr'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        paymentMethod === method
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {method === 'cash' ? '💵 Cash' :
                       method === 'telebirr' ? '📱 Telebirr' :
                       method === 'mpesa' ? '📲 M-Pesa' : '🏦 CBE Birr'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charge Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all text-base shadow-lg"
              >
                {checkingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : (
                  `💳 Charge ETB ${fmt(total)}`
                )}
              </motion.button>

              <button
                onClick={() => { setCart([]); setDiscount(0); setNotes(''); }}
                className="w-full bg-gray-800 hover:bg-red-900/50 text-gray-500 hover:text-red-400 font-semibold py-2 rounded-xl transition-all text-sm"
              >
                🗑 Clear Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {customizeFood && (
          <CustomizeModal
            food={customizeFood}
            onAdd={addToCart}
            onClose={() => setCustomizeFood(null)}
          />
        )}
        {showReceipt && lastOrder && (
          <ReceiptModal
            order={lastOrder}
            onClose={() => { setShowReceipt(false); setLastOrder(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;

