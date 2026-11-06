import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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

interface DeliveryOrder {
  _id: string;
  orderNumber: string;
  orderType: string;
  customerName?: string;
  phone: string;
  deliveryAddress: string;
  totalAmount: number;
  status: string;
  tracking?: {
    assignedDriver?: string;
    driverPhone?: string;
    estimatedArrival?: string;
  };
  items: {
    food: { name: string };
    quantity: number;
  }[];
  createdAt: string;
}

const DeliveryStation = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'out' | 'delivered'>('active');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiReq('/orders/all');
      const all: DeliveryOrder[] = res.data?.orders || [];
      // Keep delivery orders
      setOrders(all.filter((o) => o.orderType === 'delivery'));
    } catch (err: any) {
      console.error('Delivery station load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatchOrder = async (orderId: string) => {
    try {
      await apiReq(`/orders/${orderId}/status`, 'PATCH', {
        status: 'out_for_delivery',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch order');
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await apiReq(`/orders/${orderId}/status`, 'PATCH', {
        status: 'delivered',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to mark delivered');
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === 'active') return ['confirmed', 'preparing', 'ready'].includes(o.status);
    if (filter === 'out') return o.status === 'out_for_delivery';
    if (filter === 'delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛵</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Driver &amp; Dispatch Hub
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time delivery assignments, driver routing, and delivery status tracking
          </p>
        </div>

        <button
          onClick={loadData}
          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
        >
          🔄 Refresh Orders
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-semibold uppercase">Pending Dispatch</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
            {orders.filter((o) => ['confirmed', 'preparing', 'ready'].includes(o.status)).length}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-blue-400 text-xs font-semibold uppercase">Out on the Road</p>
          <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">
            {orders.filter((o) => o.status === 'out_for_delivery').length}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-emerald-400 text-xs font-semibold uppercase">Completed Deliveries</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {orders.filter((o) => o.status === 'delivered').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setFilter('active')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            filter === 'active'
              ? 'border-blue-400 text-blue-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📦 Ready for Pickup
        </button>
        <button
          onClick={() => setFilter('out')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            filter === 'out'
              ? 'border-blue-400 text-blue-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🛵 In Transit (On Delivery)
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            filter === 'delivered'
              ? 'border-blue-400 text-blue-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ✅ Completed Deliveries
        </button>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Loading delivery dispatches...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            No delivery parcels in this category.
          </div>
        ) : (
          filtered.map((ord) => (
            <motion.div
              key={ord._id}
              layout
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {ord.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                      ord.status === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : ord.status === 'out_for_delivery'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-xs">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 font-semibold uppercase">📍 Drop-off Destination</p>
                    <p className="text-slate-200 text-sm font-bold mt-0.5">
                      {ord.deliveryAddress || 'Addis Ababa Area'}
                    </p>
                    {ord.phone && (
                      <p className="text-slate-400 mt-1">
                        📞 Recipient Phone: <span className="text-white font-mono">{ord.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 space-y-1">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Parcels in Box</p>
                    {ord.items?.map((it, idx) => (
                      <p key={idx} className="text-slate-300 font-medium">
                        {it.quantity}× {it.food?.name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="font-black text-white text-base">
                  ETB {Number(ord.totalAmount).toFixed(0)}
                </span>

                {ord.status !== 'out_for_delivery' && ord.status !== 'delivered' && (
                  <button
                    onClick={() => handleDispatchOrder(ord._id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-blue-950/40"
                  >
                    🛵 Take Order (Start Run)
                  </button>
                )}

                {ord.status === 'out_for_delivery' && (
                  <button
                    onClick={() => handleMarkDelivered(ord._id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40"
                  >
                    ✅ Mark Arrived &amp; Handed Over
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryStation;
