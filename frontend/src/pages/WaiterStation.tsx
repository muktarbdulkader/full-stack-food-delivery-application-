import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/admin.service';
import { foodService, type Food } from '../services/food.service';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const getToken = () =>
  localStorage.getItem('staffToken') ||
  localStorage.getItem('adminToken') ||
  localStorage.getItem('token') ||
  '';

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

interface WaiterCall {
  _id: string;
  tableNumber: string;
  requestType: 'waiter' | 'water' | 'bill' | 'assistance' | 'other';
  status: 'pending' | 'in_progress' | 'resolved';
  customerNote?: string;
  createdAt: string;
}

interface TableItem {
  _id: string;
  tableNumber: string;
  area: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'out_of_service';
  branchId?: string | { _id: string; name?: string };
}

interface KitchenReadyOrder {
  _id: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: string;
  items: {
    food: { name: string };
    quantity: number;
    selectedPortion?: string;
  }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface OrderCartItem {
  food: Food;
  quantity: number;
  instructions: string;
}

const WaiterStation = () => {
  const [activeTab, setActiveTab] = useState<'buzzers' | 'readyOrders' | 'tables' | 'orderMenu'>('buzzers');
  const [buzzers, setBuzzers] = useState<WaiterCall[]>([]);
  const [readyOrders, setReadyOrders] = useState<KitchenReadyOrder[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Bill Settlement Modal
  const [selectedTableForBill, setSelectedTableForBill] = useState<TableItem | null>(null);
  const [billDetails, setBillDetails] = useState<any>(null);
  const [billLoading, setBillLoading] = useState(false);

  // Order Creation & Menu States
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderTableNumber, setOrderTableNumber] = useState('01');
  const [orderCart, setOrderCart] = useState<OrderCartItem[]>([]);
  const [orderCategory, setOrderCategory] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [waitersRes, ordersRes, tablesRes, foodsRes] = await Promise.all([
        adminService.getWaiterRequests(),
        apiReq('/kds/orders'),
        adminService.getAllTables(),
        foodService.getAllFoods().catch(() => ({ data: { foods: [] } })),
      ]);

      setBuzzers(waitersRes.data?.requests || []);

      // Filter for orders that kitchen marked as 'ready'
      const allOrders = ordersRes.data?.orders || [];
      setReadyOrders(allOrders.filter((o: any) => o.status === 'ready'));

      setTables(tablesRes.data?.tables || []);
      setFoods(foodsRes.data?.foods || []);
    } catch (err: any) {
      console.error('Waiter station load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadData();
      }, 10000); // 10 second polling
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleUpdateBuzzer = async (id: string, status: string) => {
    try {
      await adminService.updateWaiterRequest(id, status);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update request');
    }
  };

  const handleMarkServed = async (orderId: string) => {
    try {
      await apiReq(`/kds/orders/${orderId}/served`, 'PATCH', {});
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to mark served');
    }
  };

  const handleUpdateTableStatus = async (tableId: string, status: string) => {
    try {
      await adminService.updateTable(tableId, { status });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update table status');
    }
  };

  const handleFetchTableBill = async (table: TableItem) => {
    setSelectedTableForBill(table);
    setBillLoading(true);
    try {
      // Find orders for this table across all active kitchen orders
      const res = await apiReq('/kds/orders');
      const allOrders = res.data?.orders || [];
      const tableOrders = allOrders.filter(
        (o: any) =>
          o.tableNumber === table.tableNumber ||
          (o.tableId && o.tableId === table._id)
      );
      setBillDetails(tableOrders);
    } catch {
      setBillDetails([]);
    } finally {
      setBillLoading(false);
    }
  };

  // Cart Management for Waiter Table Orders
  const handleAddToCart = (food: Food) => {
    setOrderCart((prev) => {
      const idx = prev.findIndex((i) => i.food._id === food._id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { food, quantity: 1, instructions: '' }];
    });
  };

  const handleUpdateQty = (foodId: string, delta: number) => {
    setOrderCart((prev) =>
      prev
        .map((item) => {
          if (item.food._id === foodId) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderCartItem[]
    );
  };

  const handleUpdateInstructions = (foodId: string, text: string) => {
    setOrderCart((prev) =>
      prev.map((i) => (i.food._id === foodId ? { ...i, instructions: text } : i))
    );
  };

  const cartSubtotal = useMemo(() => {
    return orderCart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  }, [orderCart]);

  const handleFireOrderToKitchen = async () => {
    if (!orderTableNumber) {
      alert('Please select a target table number');
      return;
    }
    if (orderCart.length === 0) {
      alert('Please add at least one dish from the menu to create this order');
      return;
    }

    setOrderSubmitting(true);
    try {
      const targetTable = tables.find((t) => t.tableNumber === orderTableNumber);
      const branchVal = targetTable?.branchId;
      const resolvedBranch = typeof branchVal === 'object' && branchVal !== null ? (branchVal as any)._id : branchVal;
      const payload = {
        orderType: 'dine_in',
        tableId: targetTable?._id,
        tableNumber: orderTableNumber,
        branchId: resolvedBranch || (targetTable as any)?.branch?._id,
        items: orderCart.map((i) => ({
          foodId: i.food._id,
          quantity: i.quantity,
          instructions: i.instructions || undefined,
        })),
        notes: `Order taken by Waiter for Table ${orderTableNumber}`,
        paymentMethod: 'cash',
      };

      const res = await apiReq('/pos/sale', 'POST', payload);
      setOrderSuccessMsg(
        `🎉 Order for Table ${orderTableNumber} sent to Kitchen (KDS)! Order #${
          res.data?.orderNumber || 'OK'
        }`
      );
      setOrderCart([]);
      setShowOrderModal(false);
      await loadData();
      setTimeout(() => setOrderSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit order to kitchen');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    foods.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ['all', ...Array.from(set)];
  }, [foods]);

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchCat = orderCategory === 'all' || f.category === orderCategory;
      const matchSearch =
        f.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(orderSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [foods, orderCategory, orderSearch]);

  const pendingBuzzers = buzzers.filter((b) => b.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛎️</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Waiter Service Station
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Front-of-house table service, food ordering for guests, kitchen dispatch &amp; calls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Primary Action Button: Take Order on Behalf of Guest */}
          <button
            onClick={() => setShowOrderModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-950/40"
          >
            <span>➕</span> Take Table Order / Request Food
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-bold px-3 py-2.5 rounded-xl border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {autoRefresh ? '🟢 Live Sync' : '⚪ Paused'}
          </button>
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {orderSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl">
          <span>{orderSuccessMsg}</span>
          <button onClick={() => setOrderSuccessMsg(null)} className="text-emerald-400 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-semibold uppercase">Pending Customer Calls</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
            {pendingBuzzers.length}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-emerald-400 text-xs font-semibold uppercase">Dishes Ready for Pickup</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {readyOrders.length}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-blue-400 text-xs font-semibold uppercase">Occupied Tables</p>
          <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">
            {tables.filter((t) => t.status === 'occupied').length}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-purple-400 text-xs font-semibold uppercase">Available Tables</p>
          <p className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">
            {tables.filter((t) => t.status === 'available').length}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('buzzers')}
          className={`pb-3 px-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'buzzers'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔔 Table Calls</span>
          {pendingBuzzers.length > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
              {pendingBuzzers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('readyOrders')}
          className={`pb-3 px-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'readyOrders'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🍽️ Kitchen Pickup Ready</span>
          {readyOrders.length > 0 && (
            <span className="bg-emerald-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black">
              {readyOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`pb-3 px-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'tables'
              ? 'border-blue-400 text-blue-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🪑 Floor Plan &amp; Tables ({tables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orderMenu')}
          className={`pb-3 px-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'orderMenu'
              ? 'border-orange-400 text-orange-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📋 Take Table Order &amp; Food Menu</span>
        </button>
      </div>

      {/* TAB 1: BUZZERS / CALLS */}
      {activeTab === 'buzzers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && buzzers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              Loading table buzzers...
            </div>
          ) : buzzers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <span className="text-4xl block mb-2">🎉</span>
              No active customer requests. Everything is running smoothly!
            </div>
          ) : (
            buzzers.map((call) => {
              const isPending = call.status === 'pending';
              return (
                <motion.div
                  key={call._id}
                  layout
                  className={`border rounded-3xl p-5 flex flex-col justify-between transition-all shadow-xl ${
                    isPending
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-amber-950/20'
                      : call.status === 'in_progress'
                      ? 'bg-blue-950/20 border-blue-500/40'
                      : 'bg-slate-900/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-black text-white">
                        Table {call.tableNumber}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : call.status === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {call.status}
                      </span>
                    </div>

                    <div className="bg-slate-950/60 rounded-2xl p-3 mb-3 border border-slate-800/80">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">
                          {call.requestType === 'water'
                            ? '💧'
                            : call.requestType === 'bill'
                            ? '🧾'
                            : call.requestType === 'assistance'
                            ? '🆘'
                            : '🛎️'}
                        </span>
                        <span className="text-xs font-bold uppercase text-slate-300">
                          {call.requestType} Request
                        </span>
                      </div>
                      {call.customerNote && (
                        <p className="text-xs text-slate-400 italic mt-1">
                          &ldquo;{call.customerNote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 gap-2">
                    <span className="text-[10px] text-slate-500">
                      {new Date(call.createdAt).toLocaleTimeString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Quick Take Order for this Table */}
                      <button
                        onClick={() => {
                          setOrderTableNumber(call.tableNumber);
                          setShowOrderModal(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-slate-700"
                        title="Take order for this table"
                      >
                        ➕ Add Food
                      </button>

                      {call.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateBuzzer(call._id, 'in_progress')}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition"
                        >
                          Acknowledge
                        </button>
                      )}
                      {call.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateBuzzer(call._id, 'resolved')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: KITCHEN READY DISHES */}
      {activeTab === 'readyOrders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {readyOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <span className="text-4xl block mb-2">👨‍🍳</span>
              No plates waiting for pickup. Kitchen is preparing dishes!
            </div>
          ) : (
            readyOrders.map((order) => (
              <div
                key={order._id}
                className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {order.orderNumber}
                      </span>
                      <h3 className="text-xl font-black text-white mt-0.5">
                        Table {order.tableNumber || 'Walk-in'}
                      </h3>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black px-2.5 py-1 rounded-full uppercase">
                      Ready to Serve
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items?.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80"
                      >
                        <span className="text-slate-200 font-semibold">
                          <strong className="text-emerald-400 font-black mr-2">{it.quantity}×</strong>
                          {it.food?.name}
                        </span>
                        {it.selectedPortion && (
                          <span className="text-xs text-slate-400 font-mono">
                            {it.selectedPortion}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-200">
                    ETB {Number(order.totalAmount || 0).toFixed(0)}
                  </span>
                  <button
                    onClick={() => handleMarkServed(order._id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-emerald-950/40"
                  >
                    🍽️ Deliver to Table (Mark Served)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: TABLES & FLOOR PLAN */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => {
            const isOccupied = table.status === 'occupied';
            const isAvailable = table.status === 'available';
            return (
              <div
                key={table._id}
                className={`border rounded-3xl p-4 flex flex-col justify-between transition-all ${
                  isOccupied
                    ? 'bg-blue-950/30 border-blue-500/50'
                    : isAvailable
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-black text-white">
                      #{table.tableNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      👥 {table.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{table.area || 'Dining Area'}</p>

                  <select
                    value={table.status}
                    onChange={(e) => handleUpdateTableStatus(table._id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 mb-3"
                  >
                    <option value="available">🟢 Available</option>
                    <option value="occupied">🔵 Occupied</option>
                    <option value="reserved">🟡 Reserved</option>
                    <option value="cleaning">🧹 Cleaning</option>
                    <option value="out_of_service">🚫 Out of Service</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {/* Waiter Action 1: Take Order / Add More Food for this Table */}
                  <button
                    onClick={() => {
                      setOrderTableNumber(table.tableNumber);
                      setShowOrderModal(true);
                    }}
                    className={`w-full font-black py-2 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 ${
                      isOccupied
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-blue-900/30'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                    }`}
                  >
                    <span>{isOccupied ? '➕' : '🍽️'}</span>
                    <span>{isOccupied ? 'Add More Food (+)' : 'Take Order / Open Tab'}</span>
                  </button>

                  {/* Waiter Action 2: View Dining Tab / Bill */}
                  <button
                    onClick={() => handleFetchTableBill(table)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 rounded-xl text-xs transition border border-slate-700"
                  >
                    🧾 View Dining Tab
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: DIRECT TAKE ORDER / FOOD MENU EXPLORER */}
      {activeTab === 'orderMenu' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Full Menu &amp; Direct Ordering</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Answer guest questions about food, view prices, and fire food tickets directly to the kitchen
                </p>
              </div>

              {/* Quick Table Switcher */}
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
                <span className="text-xs text-slate-400">Target Table:</span>
                <select
                  value={orderTableNumber}
                  onChange={(e) => setOrderTableNumber(e.target.value)}
                  className="bg-transparent text-amber-400 font-black text-sm focus:outline-none cursor-pointer"
                >
                  {tables.map((t) => (
                    <option key={t._id} value={t.tableNumber} className="bg-slate-900 text-white">
                      Table #{t.tableNumber} ({t.status})
                    </option>
                  ))}
                  <option value="Walk-in" className="bg-slate-900 text-white">
                    Walk-in Customer
                  </option>
                </select>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <input
                type="text"
                placeholder="Search food by name, ingredient, description..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full sm:w-72 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setOrderCategory(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                      orderCategory === c
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFoods.map((food) => (
                <div
                  key={food._id}
                  className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    {food.image && (
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-full h-32 object-cover rounded-xl mb-3"
                      />
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-white text-sm leading-snug">{food.name}</h4>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md whitespace-nowrap">
                        {food.category}
                      </span>
                    </div>
                    {food.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {food.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2">
                    <span className="text-base font-black text-amber-400">
                      ETB {food.price}
                    </span>
                    <button
                      onClick={() => handleAddToCart(food)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1 shadow-md shadow-emerald-950/30"
                    >
                      <span>+</span> Add to Table
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULL ORDER CREATION MODAL / TICKET SHEET */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <span>{tables.find((t) => t.tableNumber === orderTableNumber)?.status === 'occupied' ? '➕' : '🍽️'}</span>
                    <span>
                      {tables.find((t) => t.tableNumber === orderTableNumber)?.status === 'occupied'
                        ? `Add More Food (Table #${orderTableNumber})`
                        : `Take Order & Fire to Kitchen`}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tables.find((t) => t.tableNumber === orderTableNumber)?.status === 'occupied'
                      ? 'Appends extra dishes directly to this active table session and sends ticket to Kitchen (KDS)'
                      : 'Select customer dishes and fire new dining order directly to Kitchen Display System (KDS)'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Table Selector */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                    <span className="text-xs text-slate-400">Table:</span>
                    <select
                      value={orderTableNumber}
                      onChange={(e) => setOrderTableNumber(e.target.value)}
                      className="bg-transparent text-amber-400 font-black text-sm focus:outline-none cursor-pointer"
                    >
                      {tables.map((t) => (
                        <option key={t._id} value={t.tableNumber} className="bg-slate-900 text-white">
                          Table #{t.tableNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-slate-400 hover:text-white text-lg p-2 rounded-xl hover:bg-slate-800 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body: Split into Menu Picker + Order Ticket */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                {/* Left side: Food Catalog (7 cols) */}
                <div className="md:col-span-7 p-4 border-r border-slate-800 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Quick search dishes..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setOrderCategory(c)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition whitespace-nowrap ${
                          orderCategory === c
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Food List Scrollable */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filteredFoods.map((f) => (
                      <div
                        key={f._id}
                        className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition"
                      >
                        <div>
                          <p className="font-bold text-white text-sm">{f.name}</p>
                          <p className="text-[11px] text-amber-400 font-mono font-bold">ETB {f.price}</p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(f)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side: Table Order Ticket (5 cols) */}
                <div className="md:col-span-5 p-4 flex flex-col justify-between bg-slate-950/60">
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                      <span className="font-bold text-white text-sm">
                        Table #{orderTableNumber} Ticket
                      </span>
                      <span className="text-xs text-slate-400">
                        {orderCart.length} item(s)
                      </span>
                    </div>

                    {orderCart.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 text-xs">
                        <span className="text-3xl block mb-2">🍽️</span>
                        No dishes added yet. Click &ldquo;+ Add&rdquo; from the menu on the left!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orderCart.map((item) => (
                          <div
                            key={item.food._id}
                            className="p-3 bg-slate-900 rounded-xl border border-slate-800"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div>
                                <p className="font-semibold text-white text-xs">{item.food.name}</p>
                                <p className="text-[11px] text-slate-400 font-mono">
                                  ETB {item.food.price} × {item.quantity} ={' '}
                                  <strong className="text-emerald-400">
                                    ETB {item.food.price * item.quantity}
                                  </strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 bg-slate-950 rounded-lg p-1 border border-slate-800">
                                <button
                                  onClick={() => handleUpdateQty(item.food._id, -1)}
                                  className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded text-xs font-bold text-white hover:bg-slate-700"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQty(item.food._id, 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded text-xs font-bold text-white hover:bg-slate-700"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <input
                              type="text"
                              placeholder="Kitchen instructions (e.g. no pepper, extra sauce)..."
                              value={item.instructions}
                              onChange={(e) =>
                                handleUpdateInstructions(item.food._id, e.target.value)
                              }
                              className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ticket Footer */}
                  <div className="pt-4 border-t border-slate-800 mt-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Estimated Order Total:</span>
                      <span className="text-xl font-black text-amber-400 font-mono">
                        ETB {cartSubtotal.toFixed(0)}
                      </span>
                    </div>

                    <button
                      onClick={handleFireOrderToKitchen}
                      disabled={orderSubmitting || orderCart.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-sm transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      {orderSubmitting ? (
                        <span>Firing to Kitchen...</span>
                      ) : (
                        <>
                          <span>🚀 Fire Order to Kitchen (KDS)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Table Tab / Bill Modal */}
      <AnimatePresence>
        {selectedTableForBill && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-white">
                  Table #{selectedTableForBill.tableNumber} Dining Tab
                </h3>
                <button
                  onClick={() => setSelectedTableForBill(null)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {billLoading ? (
                <p className="text-center text-slate-400 py-6 text-xs">Loading table tickets...</p>
              ) : billDetails && billDetails.length > 0 ? (
                <div className="space-y-4">
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {billDetails.map((order: any) => (
                      <div
                        key={order._id}
                        className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-emerald-400 font-bold">
                            {order.orderNumber}
                          </span>
                          <span className="font-bold text-white">ETB {order.totalAmount}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          {order.items?.length || 0} dishes • Status: {order.status}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-slate-300">Total Unbilled Balance:</span>
                    <span className="text-lg font-black text-amber-400">
                      ETB{' '}
                      {billDetails
                        .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setOrderTableNumber(selectedTableForBill.tableNumber);
                        setSelectedTableForBill(null);
                        setShowOrderModal(true);
                      }}
                      className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
                    >
                      ➕ Add More Food
                    </button>
                    <button
                      onClick={() => {
                        alert(
                          `Table #${selectedTableForBill.tableNumber} bill requested. Cashier desk has been notified for final payment settlement!`
                        );
                        setSelectedTableForBill(null);
                      }}
                      className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
                    >
                      🔔 Call Cashier for Bill
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-xs mb-4">No active dining orders for this table.</p>
                  <button
                    onClick={() => {
                      setOrderTableNumber(selectedTableForBill.tableNumber);
                      setSelectedTableForBill(null);
                      setShowOrderModal(true);
                    }}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Open Table &amp; Take Order
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaiterStation;
