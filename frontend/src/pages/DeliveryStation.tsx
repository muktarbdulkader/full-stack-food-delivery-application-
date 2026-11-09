import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface DeliveryOrder {
  _id: string;
  orderNumber: string;
  orderType: string;
  customerName?: string;
  phone: string;
  deliveryAddress: string;
  totalAmount: number;
  status: string;
  payment?: {
    method: string;
    status: string;
  };
  tracking?: {
    assignedDriver?: string;
    driverPhone?: string;
    estimatedArrival?: string;
  };
  items: {
    food: { name: string; image?: string };
    quantity: number;
    selectedPortion?: string;
  }[];
  notes?: string;
  createdAt: string;
}

const DeliveryStation = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'transit' | 'delivered'>('pending');
  const [isCourierMode, setIsCourierMode] = useState(true); // Default to Phone/Motorcycle Courier Mode

  // Delivery Failure / Issue Note modal
  const [issueModalOrder, setIssueModalOrder] = useState<DeliveryOrder | null>(null);
  const [issueNote, setIssueNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiReq('/orders/all').catch(() => ({ data: { orders: [] } }));
      const all: DeliveryOrder[] = res.data?.orders || [];
      setOrders(all.filter((o) => o.orderType === 'delivery'));
    } catch (err: any) {
      console.error('Delivery station load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleStartRun = async (orderId: string) => {
    try {
      await apiReq(`/orders/${orderId}/status`, 'PATCH', {
        status: 'out_for_delivery',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to start delivery transit');
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await apiReq(`/orders/${orderId}/status`, 'PATCH', {
        status: 'delivered',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete delivery');
    }
  };

  const handleReportIssue = async () => {
    if (!issueModalOrder) return;
    try {
      await apiReq(`/orders/${issueModalOrder._id}/status`, 'PATCH', {
        status: 'cancelled',
        note: issueNote || 'Customer unreachable / delivery aborted',
      });
      setIssueModalOrder(null);
      setIssueNote('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery issue');
    }
  };

  const pendingOrders = orders.filter((o) => ['confirmed', 'preparing', 'ready', 'pending'].includes(o.status));
  const inTransitOrders = orders.filter((o) => o.status === 'out_for_delivery');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const displayed =
    activeTab === 'pending' ? pendingOrders : activeTab === 'transit' ? inTransitOrders : deliveredOrders;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-20 sm:pb-8">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sm:px-6 sm:py-4 sticky top-0 z-30 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                🛵
              </div>
              <div>
                <h1 className="text-white font-extrabold text-lg sm:text-xl tracking-tight leading-none">
                  Delivery &amp; Courier Dispatch
                </h1>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                  Live GPS Route • 1-Tap Calling • Proof of Delivery
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="sm:hidden p-2 bg-slate-800 rounded-xl text-xs text-slate-300"
            >
              🔄
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Ready for Pickup</span>
              <span className="font-mono font-black text-amber-400 text-base">{pendingOrders.length}</span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">On the Road</span>
              <span className="font-mono font-black text-blue-400 text-base">{inTransitOrders.length}</span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Delivered</span>
              <span className="font-mono font-black text-emerald-400 text-base">{deliveredOrders.length}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCourierMode(!isCourierMode)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                isCourierMode
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {isCourierMode ? '📱 Courier Touch Mode' : '🖥️ Dispatcher View'}
            </button>
            <button
              type="button"
              onClick={loadData}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation (Segmented Pill Bar) */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800/80">
          {[
            { id: 'pending', label: '📦 Ready for Pickup', count: pendingOrders.length },
            { id: 'transit', label: '🛵 On the Road (Active)', count: inTransitOrders.length },
            { id: 'delivered', label: '✅ Delivered Today', count: deliveredOrders.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === tab.id ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Scanning active deliveries...</div>
        ) : displayed.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto">
            <span className="text-4xl block mb-2">🛵</span>
            <h3 className="text-lg font-bold text-white">No Parcels in this Queue</h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'pending'
                ? 'No orders are waiting for pickup from the kitchen.'
                : activeTab === 'transit'
                ? 'No drivers are currently out on the road.'
                : 'No deliveries completed yet today.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((ord) => {
              const isPaid = ord.payment?.status === 'paid';
              return (
                <div
                  key={ord._id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                      <div>
                        <span className="font-mono font-black text-blue-400 text-base">
                          #{ord.orderNumber || ord._id.slice(-5).toUpperCase()}
                        </span>
                        <p className="text-xs font-bold text-white mt-0.5">
                          {ord.customerName || 'Customer Delivery'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : ord.status === 'out_for_delivery'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                        <span className={`block text-[10px] font-bold mt-1 ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isPaid ? '✓ Paid Online' : '⚠️ Cash on Delivery'}
                        </span>
                      </div>
                    </div>

                    {/* Destination Address & Fast GPS Navigation */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">📍 Drop-off Destination</span>
                          <p className="text-white text-xs font-bold mt-0.5 leading-snug">
                            {ord.deliveryAddress || 'Addis Ababa Area'}
                          </p>
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            ord.deliveryAddress || 'Addis Ababa'
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-bold border border-blue-500/30 transition flex items-center gap-1 flex-shrink-0"
                        >
                          <span>🗺️</span>
                          <span>Maps</span>
                        </a>
                      </div>

                      {/* Recipient Contact Phone & 1-Tap Dial */}
                      {ord.phone && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-mono">📞 {ord.phone}</span>
                          <a
                            href={`tel:${ord.phone}`}
                            className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/30 transition flex items-center gap-1"
                          >
                            <span>Call</span>
                            <span>📞</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Parcels in bag */}
                    <div className="space-y-1.5 py-2 border-t border-b border-slate-800/80 my-2 max-h-32 overflow-y-auto">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Items to Deliver</span>
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-slate-300">
                            <span className="text-amber-400 font-bold">{it.quantity}×</span> {it.food?.name}
                          </span>
                          {it.selectedPortion && (
                            <span className="text-slate-500 text-[11px]">{it.selectedPortion}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {ord.notes && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 mb-2">
                        💬 Note: {ord.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400 font-medium">Order Total to Collect</span>
                      <span className="font-mono font-black text-lg text-white">
                        ETB {Number(ord.totalAmount).toFixed(0)}
                      </span>
                    </div>

                    {ord.status !== 'out_for_delivery' && ord.status !== 'delivered' && (
                      <button
                        type="button"
                        onClick={() => handleStartRun(ord._id)}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-black rounded-xl text-sm transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                      >
                        <span>🛵</span>
                        <span>Pick Up &amp; Start Delivery Run</span>
                      </button>
                    )}

                    {ord.status === 'out_for_delivery' && (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleMarkDelivered(ord._id)}
                          className="col-span-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
                        >
                          <span>✅</span>
                          <span>Delivered &amp; Handed Over</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIssueModalOrder(ord)}
                          className="py-3.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 font-bold rounded-xl text-xs transition flex items-center justify-center"
                        >
                          Issue / Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: REPORT DELIVERY ISSUE */}
      <AnimatePresence>
        {issueModalOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">Report Delivery Issue</h3>
              <p className="text-xs text-slate-400 mb-4">
                Order <strong className="text-white font-mono">#{issueModalOrder.orderNumber}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Select Issue Reason
                  </label>
                  <select
                    value={issueNote}
                    onChange={(e) => setIssueNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
                  >
                    <option value="Customer unreachable by phone">Customer unreachable by phone</option>
                    <option value="Wrong delivery address provided">Wrong delivery address provided</option>
                    <option value="Customer refused parcel">Customer refused parcel</option>
                    <option value="Severe weather / impassable road">Severe weather / impassable road</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIssueModalOrder(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleReportIssue}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Abort Delivery
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeliveryStation;
