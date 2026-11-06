import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../services/admin.service';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('staffToken') || localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

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

const WaiterStation = () => {
  const [activeTab, setActiveTab] = useState<'buzzers' | 'readyOrders' | 'tables'>('buzzers');
  const [buzzers, setBuzzers] = useState<WaiterCall[]>([]);
  const [readyOrders, setReadyOrders] = useState<KitchenReadyOrder[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Bill Settlement Modal
  const [selectedTableForBill, setSelectedTableForBill] = useState<TableItem | null>(null);
  const [billDetails, setBillDetails] = useState<any>(null);
  const [billLoading, setBillLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [waitersRes, ordersRes, tablesRes] = await Promise.all([
        adminService.getWaiterRequests(),
        apiReq('/kds/orders'),
        adminService.getAllTables(),
      ]);

      setBuzzers(waitersRes.data?.requests || []);
      
      // Filter for orders that kitchen marked as 'ready'
      const allOrders = ordersRes.data?.orders || [];
      setReadyOrders(allOrders.filter((o: any) => o.status === 'ready'));

      setTables(tablesRes.data?.tables || []);
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
      // Find orders for this table
      const res = await apiReq(`/orders/all?status=pending`);
      setBillDetails(res.data?.orders?.filter((o: any) => o.tableNumber === table.tableNumber) || []);
    } catch {
      setBillDetails([]);
    } finally {
      setBillLoading(false);
    }
  };

  const pendingBuzzers = buzzers.filter((b) => b.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛎️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Waiter Service Station
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time table calls, food dispatch from kitchen, and dining floor controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {autoRefresh ? '🟢 Live Auto-Sync: ON' : '⚪ Auto-Sync: OFF'}
          </button>
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

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
      <div className="flex gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('buzzers')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
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
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
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
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'tables'
              ? 'border-blue-400 text-blue-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🪑 Floor Plan &amp; Tables ({tables.length})</span>
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
                      <p className="text-xs text-slate-400 font-semibold uppercase">Request Type</p>
                      <p className="text-sm font-bold text-white mt-0.5 capitalize flex items-center gap-2">
                        <span>
                          {call.requestType === 'water' ? '💧 Water Refill' :
                           call.requestType === 'bill' ? '🧾 Request Bill' :
                           call.requestType === 'assistance' ? '🙋 Need Help' : '🛎️ Call Waiter'}
                        </span>
                      </p>
                      {call.customerNote && (
                        <p className="text-xs text-slate-300 mt-2 italic bg-slate-900/80 p-2 rounded-xl">
                          "{call.customerNote}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(call.createdAt).toLocaleTimeString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {call.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateBuzzer(call._id, 'in_progress')}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-blue-950/40"
                        >
                          Attending 🏃
                        </button>
                      )}
                      {call.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateBuzzer(call._id, 'resolved')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40"
                        >
                          Resolve ✓
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

                <button
                  onClick={() => handleFetchTableBill(table)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 rounded-xl text-xs transition-all border border-slate-700"
                >
                  🧾 View Table Tab
                </button>
              </div>
            );
          })}
        </div>
      )}

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
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {billLoading ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  Fetching running orders...
                </div>
              ) : billDetails && billDetails.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {billDetails.map((ord: any) => (
                    <div key={ord._id} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Order #{ord.orderNumber}</span>
                        <span>{ord.status}</span>
                      </div>
                      <div className="text-sm font-bold text-white flex justify-between">
                        <span>Total</span>
                        <span className="text-amber-400">ETB {ord.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-slate-400 text-sm">
                  No active orders on this table right now.
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedTableForBill(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaiterStation;

