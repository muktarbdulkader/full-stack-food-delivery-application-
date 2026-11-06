import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface KDSOrderItem {
  food: { _id: string; name: string; image?: string; category?: string };
  quantity: number;
  price: number;
  selectedPortion?: string;
  selectedExtras?: { name: string; price: number }[];
  instructions?: string;
  station?: string;
  isKitchenReady?: boolean;
}

interface KDSOrder {
  _id: string;
  orderNumber?: string;
  orderType: 'delivery' | 'dine_in' | 'takeaway';
  tableNumber?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  items: KDSOrderItem[];
  notes?: string;
  createdAt: string;
  preparationStartedAt?: string;
}

interface KDSStats {
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  served: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

const apiCall = async (path: string, method = 'GET', body?: object) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).message ?? 'Request failed');
  return res.json();
};

const elapsedMinutes = (dateStr: string) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);

const statusColor: Record<string, string> = {
  pending:   'bg-yellow-500',
  confirmed: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready:     'bg-green-500',
  served:    'bg-gray-400',
  cancelled: 'bg-red-400',
};

const statusLabel: Record<string, string> = {
  pending:   '⏳ Pending',
  confirmed: '✅ Confirmed',
  preparing: '🔥 Preparing',
  ready:     '🍽️ Ready',
  served:    '✔ Served',
  cancelled: '✖ Cancelled',
};

const orderTypeBadge: Record<string, string> = {
  dine_in:  'bg-purple-700 text-white',
  takeaway: 'bg-blue-700 text-white',
  delivery: 'bg-green-700 text-white',
};

const orderTypeLabel: Record<string, string> = {
  dine_in:  '🍽 Dine-In',
  takeaway: '🛍 Takeaway',
  delivery: '🛵 Delivery',
};

// ─── Timer Badge ──────────────────────────────────────────────────────────────
const TimerBadge = ({ startedAt, createdAt }: { startedAt?: string; createdAt: string }) => {
  const [elapsed, setElapsed] = useState(0);
  const start = startedAt ?? createdAt;

  useEffect(() => {
    setElapsed(elapsedMinutes(start));
    const id = setInterval(() => setElapsed(elapsedMinutes(start)), 30000);
    return () => clearInterval(id);
  }, [start]);

  const color = elapsed < 10 ? 'text-green-400' : elapsed < 20 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-mono font-bold text-lg ${color}`}>{elapsed}m</span>;
};

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = ({
  order,
  onStart,
  onReady,
  onServed,
  onCancel,
  onItemReady,
}: {
  order: KDSOrder;
  onStart: (id: string) => void;
  onReady: (id: string) => void;
  onServed: (id: string) => void;
  onCancel: (id: string) => void;
  onItemReady: (id: string, idx: number) => void;
}) => {
  const urgency = elapsedMinutes(order.createdAt);
  const borderColor =
    urgency >= 20 ? 'border-red-500' :
    urgency >= 10 ? 'border-yellow-500' :
                    'border-gray-700';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`bg-gray-900 border-2 ${borderColor} rounded-2xl overflow-hidden flex flex-col shadow-xl`}
    >
      {/* Card Header */}
      <div className={`${statusColor[order.status]} px-4 py-3 flex items-center justify-between`}>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-black text-xl tracking-wide">
              #{order.orderNumber ?? order._id.slice(-5).toUpperCase()}
            </p>
            <span className="text-xs font-semibold bg-black/20 text-white px-2 py-0.5 rounded-full">
              {statusLabel[order.status] ?? order.status}
            </span>
          </div>
          {order.tableNumber && (
            <p className="text-white/90 text-sm font-semibold mt-0.5">
              TABLE {order.tableNumber}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${orderTypeBadge[order.orderType] ?? 'bg-gray-700 text-white'}`}>
            {orderTypeLabel[order.orderType]}
          </span>
          <div className="mt-1 text-white/90 text-xs">
            <TimerBadge startedAt={order.preparationStartedAt} createdAt={order.createdAt} />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-72">
        {order.items.map((item, idx) => (
          <motion.div
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-xl border ${
              item.isKitchenReady
                ? 'border-green-700 bg-green-900/30 opacity-60'
                : 'border-gray-700 bg-gray-800/60'
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-700">
              {item.food?.image ? (
                <img src={item.food.image} alt={item.food.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🍴</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-white font-bold text-sm leading-tight">
                  <span className="text-orange-400 font-black">{item.quantity}×</span> {item.food?.name}
                </p>
                {order.status === 'preparing' && !item.isKitchenReady && (
                  <button
                    onClick={() => onItemReady(order._id, idx)}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-0.5 rounded-lg flex-shrink-0 transition-colors"
                  >
                    ✓ Done
                  </button>
                )}
                {item.isKitchenReady && (
                  <span className="text-xs text-green-400 font-bold flex-shrink-0">✓ Ready</span>
                )}
              </div>
              {item.selectedPortion && (
                <p className="text-gray-400 text-xs mt-0.5">📐 {item.selectedPortion}</p>
              )}
              {item.selectedExtras && item.selectedExtras.length > 0 && (
                <p className="text-blue-400 text-xs mt-0.5">
                  ➕ {item.selectedExtras.map((e) => e.name).join(', ')}
                </p>
              )}
              {item.instructions && (
                <p className="text-yellow-300 text-xs mt-0.5 italic">💬 {item.instructions}</p>
              )}
              {item.station && item.station !== 'Main Kitchen' && (
                <span className="inline-block mt-1 text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                  {item.station}
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {order.notes && (
          <div className="bg-yellow-900/40 border border-yellow-700 rounded-xl px-3 py-2">
            <p className="text-yellow-300 text-xs font-semibold">📋 Notes</p>
            <p className="text-yellow-200 text-sm mt-0.5">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-t border-gray-800 grid grid-cols-2 gap-2">
        {order.status === 'pending' || order.status === 'confirmed' ? (
          <>
            <button
              onClick={() => onStart(order._id)}
              className="col-span-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm"
            >
              🔥 Start Preparing
            </button>
            <button
              onClick={() => onCancel(order._id)}
              className="col-span-2 bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300 font-medium py-2 rounded-xl transition-all text-xs"
            >
              Cancel Order
            </button>
          </>
        ) : order.status === 'preparing' ? (
          <>
            <button
              onClick={() => onReady(order._id)}
              className="col-span-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm"
            >
              ✅ Mark All Ready
            </button>
            <button
              onClick={() => onCancel(order._id)}
              className="col-span-2 bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300 font-medium py-2 rounded-xl transition-all text-xs"
            >
              Cancel
            </button>
          </>
        ) : order.status === 'ready' ? (
          <button
            onClick={() => onServed(order._id)}
            className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm"
          >
            🍽️ Mark Served
          </button>
        ) : null}
      </div>
    </motion.div>
  );
};

// ─── KDS Page ─────────────────────────────────────────────────────────────────
const KDS = () => {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [stats, setStats] = useState<KDSStats>({ pending: 0, confirmed: 0, preparing: 0, ready: 0, served: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [filterStation, setFilterStation] = useState<string>('all');
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevOrderCount = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.4);
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiCall('/kds/orders');
      const fetched: KDSOrder[] = res.data.orders;
      if (fetched.length > prevOrderCount.current) {
        playBeep();
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 3000);
      }
      prevOrderCount.current = fetched.length;
      setOrders(fetched);
    } catch {
      // silent — keep showing old data
    } finally {
      setLoading(false);
    }
  }, [playBeep]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiCall('/kds/stats');
      setStats(res.data.stats);
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    const interval = setInterval(() => { fetchOrders(); fetchStats(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchStats]);

  const handleStart = async (id: string) => {
    await apiCall(`/kds/orders/${id}/start`, 'PATCH');
    fetchOrders(); fetchStats();
  };
  const handleReady = async (id: string) => {
    await apiCall(`/kds/orders/${id}/ready`, 'PATCH');
    fetchOrders(); fetchStats();
  };
  const handleServed = async (id: string) => {
    await apiCall(`/kds/orders/${id}/served`, 'PATCH');
    fetchOrders(); fetchStats();
  };
  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this order?')) return;
    await apiCall(`/kds/orders/${id}/cancel`, 'PATCH', { reason: 'Cancelled from KDS' });
    fetchOrders(); fetchStats();
  };
  const handleItemReady = async (id: string, idx: number) => {
    await apiCall(`/kds/orders/${id}/items/${idx}/ready`, 'PATCH');
    fetchOrders();
  };

  const stations = ['all', 'Main Kitchen', 'Grill', 'Stew', 'Oven', 'Beverage', 'Salad'];

  const displayedOrders = orders.filter((o) => {
    const matchStatus =
      filterStatus === 'active'
        ? ['pending', 'confirmed', 'preparing'].includes(o.status)
        : filterStatus === 'ready'
        ? o.status === 'ready'
        : true;
    const matchStation =
      filterStation === 'all' ||
      o.items.some((i) => (i.station ?? 'Main Kitchen') === filterStation);
    return matchStatus && matchStation;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-xl">
              🍳
            </div>
            <div>
              <h1 className="text-white font-black text-xl">Kitchen Display System</h1>
              <p className="text-gray-400 text-xs">Live order management</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Pending', value: stats.pending, color: 'bg-yellow-600' },
              { label: 'Confirmed', value: stats.confirmed, color: 'bg-blue-600' },
              { label: 'Preparing', value: stats.preparing, color: 'bg-orange-600' },
              { label: 'Ready', value: stats.ready, color: 'bg-green-600' },
              { label: 'Served', value: stats.served, color: 'bg-gray-600' },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl px-3 py-1.5 text-center min-w-[64px]`}>
                <p className="text-white font-black text-xl leading-none">{s.value}</p>
                <p className="text-white/80 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => { fetchOrders(); fetchStats(); }}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex gap-2">
            {['active', 'ready', 'all'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  filterStatus === s
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {s === 'active' ? '🔥 Active' : s === 'ready' ? '✅ Ready' : '📋 All'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {stations.map((st) => (
              <button
                key={st}
                onClick={() => setFilterStation(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStation === st
                    ? 'bg-purple-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {st === 'all' ? '🏠 All Stations' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Order Alert */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-orange-600 text-white text-center py-2 font-bold text-sm"
          >
            🔔 NEW ORDER RECEIVED!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders Grid */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading kitchen orders…</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 gap-3"
          >
            <div className="text-6xl">👨‍🍳</div>
            <p className="text-gray-400 text-lg font-semibold">Kitchen is clear!</p>
            <p className="text-gray-600 text-sm">No active orders right now</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {displayedOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStart={handleStart}
                  onReady={handleReady}
                  onServed={handleServed}
                  onCancel={handleCancel}
                  onItemReady={handleItemReady}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default KDS;

