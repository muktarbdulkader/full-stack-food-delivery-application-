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
const getToken = () =>
  localStorage.getItem('staffToken') ||
  localStorage.getItem('adminToken') ||
  localStorage.getItem('token') ||
  '';

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
  pending: 'bg-amber-500',
  confirmed: 'bg-blue-600',
  preparing: 'bg-orange-500',
  ready: 'bg-emerald-600',
  served: 'bg-slate-700',
  cancelled: 'bg-rose-600',
};

const statusLabel: Record<string, string> = {
  pending: '⏳ Pending',
  confirmed: '📥 Confirmed',
  preparing: '🔥 Cooking',
  ready: '✅ Ready',
  served: '✔ Dispatched',
  cancelled: '✖ Cancelled',
};

const orderTypeBadge: Record<string, string> = {
  dine_in: 'bg-purple-900/80 text-purple-200 border border-purple-500/40',
  takeaway: 'bg-blue-900/80 text-blue-200 border border-blue-500/40',
  delivery: 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/40',
};

const orderTypeLabel: Record<string, string> = {
  dine_in: '🍽 Dine-In',
  takeaway: '🛍 Takeaway',
  delivery: '🛵 Delivery',
};

// ─── Timer Badge ──────────────────────────────────────────────────────────────
const TimerBadge = ({ startedAt, createdAt }: { startedAt?: string; createdAt: string }) => {
  const [elapsed, setElapsed] = useState(0);
  const start = startedAt ?? createdAt;

  useEffect(() => {
    setElapsed(elapsedMinutes(start));
    const id = setInterval(() => setElapsed(elapsedMinutes(start)), 15000);
    return () => clearInterval(id);
  }, [start]);

  const isUrgent = elapsed >= 20;
  const isWarning = elapsed >= 10 && elapsed < 20;

  return (
    <div
      className={`inline-flex items-center gap-1 font-mono font-black text-sm px-2 py-0.5 rounded-lg ${
        isUrgent
          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
          : isWarning
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
      }`}
    >
      <span>⏱</span>
      <span>{elapsed}m</span>
    </div>
  );
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
  const isOverdue = urgency >= 20;
  const isUrgent = urgency >= 12;

  const cardBorder = isOverdue
    ? 'border-rose-500/80 shadow-rose-950/40'
    : isUrgent
    ? 'border-amber-500/70 shadow-amber-950/30'
    : 'border-slate-800 shadow-black/40';

  const readyItemsCount = order.items.filter((i) => i.isKitchenReady).length;
  const totalItemsCount = order.items.length;
  const isAllItemsReady = readyItemsCount === totalItemsCount && totalItemsCount > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.25 }}
      className={`bg-slate-900 border-2 ${cardBorder} rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-200`}
    >
      {/* Ticket Header */}
      <div className={`${statusColor[order.status]} p-3.5 sm:p-4 text-white flex items-center justify-between`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-xl sm:text-2xl tracking-wider">
              #{order.orderNumber ?? order._id.slice(-5).toUpperCase()}
            </span>
            <span className="text-[11px] font-bold bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full uppercase tracking-wider">
              {statusLabel[order.status] ?? order.status}
            </span>
          </div>

          {order.tableNumber ? (
            <div className="inline-flex items-center gap-1.5 mt-1 bg-black/40 px-2.5 py-0.5 rounded-lg border border-white/20">
              <span className="text-xs">🪑</span>
              <span className="font-extrabold text-xs tracking-wider uppercase text-amber-300">
                TABLE {order.tableNumber}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-white/80 font-medium mt-0.5 block">
              Direct Order
            </span>
          )}
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${orderTypeBadge[order.orderType] ?? 'bg-slate-800 text-white'}`}>
            {orderTypeLabel[order.orderType]}
          </span>
          <TimerBadge startedAt={order.preparationStartedAt} createdAt={order.createdAt} />
        </div>
      </div>

      {/* Item Progress Bar */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium">
          Prep Progress ({readyItemsCount}/{totalItemsCount})
        </span>
        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden ml-2">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(readyItemsCount / Math.max(totalItemsCount, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Items Scroll Area (optimized for mobile touch) */}
      <div className="flex-1 p-3 sm:p-4 space-y-2.5 overflow-y-auto max-h-72 sm:max-h-80 touch-pan-y">
        {order.items.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
              item.isKitchenReady
                ? 'border-emerald-700/50 bg-emerald-950/20 opacity-70'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            }`}
          >
            {/* Food Thumbnail */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700/50">
              {item.food?.image ? (
                <img src={item.food.image} alt={item.food.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🍲</div>
              )}
            </div>

            {/* Food Info & Check-off */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <p className={`text-sm font-bold text-white leading-tight ${item.isKitchenReady ? 'line-through text-slate-400' : ''}`}>
                  <span className="text-amber-400 font-black mr-1 text-base">{item.quantity}×</span>
                  {item.food?.name}
                </p>

                {/* 1-Tap Item Done Checkoff Button */}
                {order.status === 'preparing' && !item.isKitchenReady && (
                  <button
                    type="button"
                    onClick={() => onItemReady(order._id, idx)}
                    className="flex-shrink-0 px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] rounded-lg transition shadow-sm"
                  >
                    ✓ Done
                  </button>
                )}

                {item.isKitchenReady && (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 flex-shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <span>✓</span> Ready
                  </span>
                )}
              </div>

              {item.selectedPortion && (
                <p className="text-[11px] text-slate-400 mt-0.5">Portion: {item.selectedPortion}</p>
              )}

              {item.selectedExtras && item.selectedExtras.length > 0 && (
                <p className="text-[11px] text-cyan-400 mt-0.5 font-medium">
                  + {item.selectedExtras.map((e) => e.name).join(', ')}
                </p>
              )}

              {item.instructions && (
                <div className="mt-1 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-1">
                  <span>💬</span>
                  <span>{item.instructions}</span>
                </div>
              )}

              {item.station && item.station !== 'Main Kitchen' && (
                <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                  {item.station}
                </span>
              )}
            </div>
          </div>
        ))}

        {order.notes && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 text-xs text-amber-200">
            <span className="font-bold text-amber-400 block mb-0.5">Special Order Notes:</span>
            <span>{order.notes}</span>
          </div>
        )}
      </div>

      {/* Action Buttons (Large Touch Targets for kitchen staff) */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex flex-col gap-2">
        {order.status === 'pending' || order.status === 'confirmed' ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onStart(order._id)}
              className="col-span-2 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-slate-950 font-black rounded-2xl transition shadow-lg shadow-orange-500/20 text-sm flex items-center justify-center gap-1.5"
            >
              <span>🔥</span>
              <span>Start Cooking</span>
            </button>
            <button
              type="button"
              onClick={() => onCancel(order._id)}
              className="py-3.5 bg-slate-800/80 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 font-bold rounded-2xl transition text-xs flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        ) : order.status === 'preparing' ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onReady(order._id)}
              className={`col-span-2 py-3.5 text-slate-950 font-black rounded-2xl transition shadow-lg text-sm flex items-center justify-center gap-1.5 active:scale-95 ${
                isAllItemsReady
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'
              }`}
            >
              <span>✅</span>
              <span>Mark Order Ready</span>
            </button>
            <button
              type="button"
              onClick={() => onCancel(order._id)}
              className="py-3.5 bg-slate-800/80 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 font-bold rounded-2xl transition text-xs flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        ) : order.status === 'ready' ? (
          <button
            type="button"
            onClick={() => onServed(order._id)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl transition shadow-lg shadow-blue-500/20 text-sm active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🍽️</span>
            <span>Picked Up / Dispatched</span>
          </button>
        ) : null}
      </div>
    </motion.div>
  );
};

// ─── Main KDS Component ───────────────────────────────────────────────────────
const KDS = () => {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [stats, setStats] = useState<KDSStats>({
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    served: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [filterStation, setFilterStation] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  const prevOrderCount = useRef(0);
  const audioCtx = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High A
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // D
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio chime fallback:', e);
    }
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiCall('/kds/orders');
      const fetched: KDSOrder[] = res.data?.orders || [];
      if (fetched.length > prevOrderCount.current && prevOrderCount.current > 0) {
        playChime();
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 4000);
      }
      prevOrderCount.current = fetched.length;
      setOrders(fetched);
    } catch {
      // Keep displaying existing state gracefully
    } finally {
      setLoading(false);
    }
  }, [playChime]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiCall('/kds/stats');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchStats]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleStart = async (id: string) => {
    await apiCall(`/kds/orders/${id}/start`, 'PATCH');
    fetchOrders();
    fetchStats();
  };

  const handleReady = async (id: string) => {
    await apiCall(`/kds/orders/${id}/ready`, 'PATCH');
    fetchOrders();
    fetchStats();
  };

  const handleServed = async (id: string) => {
    await apiCall(`/kds/orders/${id}/served`, 'PATCH');
    fetchOrders();
    fetchStats();
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this kitchen order ticket?')) return;
    await apiCall(`/kds/orders/${id}/cancel`, 'PATCH', { reason: 'Cancelled from KDS station' });
    fetchOrders();
    fetchStats();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Station Title */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
                🍳
              </div>
              <div>
                <h1 className="text-white font-extrabold text-lg sm:text-xl tracking-tight leading-none">
                  Kitchen Display System (KDS)
                </h1>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Live Order Dispatch &amp; Expediting
                </p>
              </div>
            </div>

            {/* Mobile Sound & Fullscreen controls */}
            <div className="flex sm:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl text-xs font-bold border transition ${
                  soundEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              >
                {soundEnabled ? '🔔' : '🔕'}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300"
                title="Fullscreen Toggle"
              >
                {isFullscreen ? '✕' : '⛶'}
              </button>
            </div>
          </div>

          {/* Quick Stats Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { label: 'Pending', count: stats.pending, color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
              { label: 'Confirmed', count: stats.confirmed, color: 'border-blue-500/40 text-blue-300 bg-blue-500/10' },
              { label: 'Cooking', count: stats.preparing, color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
              { label: 'Ready', count: stats.ready, color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' },
            ].map((s) => (
              <div
                key={s.label}
                className={`flex-shrink-0 px-3 py-1 rounded-xl border ${s.color} text-center min-w-[62px]`}
              >
                <span className="block font-black text-sm leading-tight">{s.count}</span>
                <span className="block text-[10px] uppercase font-bold opacity-80">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <span>{soundEnabled ? '🔔' : '🔕'}</span>
              <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            >
              {isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen'}
            </button>
            <button
              type="button"
              onClick={() => {
                fetchOrders();
                fetchStats();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar (Mobilized Touch Bar) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
          {/* Status Tabs */}
          <div className="grid grid-cols-3 sm:flex gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            {[
              { id: 'active', label: '🔥 Active Cooking', count: stats.pending + stats.confirmed + stats.preparing },
              { id: 'ready', label: '✅ Ready to Serve', count: stats.ready },
              { id: 'all', label: '📋 All Tickets', count: orders.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  filterStatus === tab.id
                    ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  filterStatus === tab.id ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Station Filters Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {stations.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStation(st)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterStation === st
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'all' ? '🏠 All Stations' : st}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Real-time Order Alert Banner */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white font-extrabold text-sm py-2 px-4 text-center shadow-lg flex items-center justify-center gap-2 tracking-wider"
          >
            <span className="text-lg">🔔</span>
            <span>NEW TICKET RECEIVED! KITCHEN EXPEDITE REQUIRED</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Ticket Grid (Mobilized from 1 col on mobile to 4 cols on desktop) */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Syncing kitchen line tickets…</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center p-6">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center text-4xl mb-3 shadow-xl">
              👨‍🍳
            </div>
            <h2 className="text-xl font-bold text-white">Prep Line Is All Clear!</h2>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              There are no pending tickets in {filterStation === 'all' ? 'any station' : filterStation}. New dining table &amp; delivery orders will appear instantly with real-time audio chime.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5"
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
      </main>
    </div>
  );
};

export default KDS;
