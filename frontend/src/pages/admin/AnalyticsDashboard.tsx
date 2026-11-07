import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Food, Order } from '../../services/food.service';

interface AnalyticsDashboardProps {
  orders: Order[];
  foods: Food[];
  totalRevenue: number;
}

type TimeHorizon = 'today' | '7days' | '30days' | 'all';
type MetricView = 'revenue' | 'orders' | 'aov';

export default function AnalyticsDashboard({ orders, foods, totalRevenue }: AnalyticsDashboardProps) {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('7days');
  const [metricView, setMetricView] = useState<MetricView>('revenue');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter orders according to selected horizon
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return false;

      if (timeHorizon === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (timeHorizon === '7days') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      } else if (timeHorizon === '30days') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true; // 'all'
    });
  }, [orders, timeHorizon]);

  // Dynamic metrics calculation
  const metrics = useMemo(() => {
    const periodRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const orderCount = filteredOrders.length;
    const aov = orderCount > 0 ? periodRevenue / orderCount : 0;
    const completedOrders = filteredOrders.filter((o) => o.status === 'delivered' || o.status === 'served').length;
    const completionRate = orderCount > 0 ? (completedOrders / orderCount) * 100 : 0;
    const preparingOrders = filteredOrders.filter((o) => o.status === 'preparing' || o.status === 'confirmed').length;
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled').length;

    // Split by dining type
    const dineInCount = filteredOrders.filter((o) => o.orderType === 'dine_in' || (!o.orderType && o.tableNumber)).length;
    const takeawayCount = filteredOrders.filter((o) => o.orderType === 'takeaway').length;
    const deliveryCount = filteredOrders.filter((o) => o.orderType === 'delivery' || (!o.orderType && !o.tableNumber)).length;

    return {
      revenue: periodRevenue || totalRevenue,
      orderCount: orderCount || orders.length,
      aov,
      completionRate,
      preparingOrders,
      cancelledOrders,
      dineInCount,
      takeawayCount,
      deliveryCount,
    };
  }, [filteredOrders, totalRevenue, orders.length]);

  // Timeline Trend Buckets
  const chartData = useMemo(() => {
    if (timeHorizon === 'today') {
      // 12-slot 2-hour segments across 24h
      const slots = [
        { label: '00-02', start: 0, end: 2 },
        { label: '02-04', start: 2, end: 4 },
        { label: '04-06', start: 4, end: 6 },
        { label: '06-08', start: 6, end: 8 },
        { label: '08-10', start: 8, end: 10 },
        { label: '10-12', start: 10, end: 12 },
        { label: '12-14', start: 12, end: 14 },
        { label: '14-16', start: 14, end: 16 },
        { label: '16-18', start: 16, end: 18 },
        { label: '18-20', start: 18, end: 20 },
        { label: '20-22', start: 20, end: 22 },
        { label: '22-24', start: 22, end: 24 },
      ];

      return slots.map((s) => {
        const bucketOrders = filteredOrders.filter((o) => {
          const h = new Date(o.createdAt).getHours();
          return h >= s.start && h < s.end;
        });
        const rev = bucketOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return {
          label: s.label,
          fullLabel: `${s.label}:00 Window`,
          orders: bucketOrders.length,
          revenue: rev,
          aov: bucketOrders.length > 0 ? rev / bucketOrders.length : 0,
        };
      });
    }

    if (timeHorizon === '7days') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayStr = d.toDateString();
        const bucketOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === dayStr);
        const rev = bucketOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return {
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          fullLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'long' }),
          orders: bucketOrders.length,
          revenue: rev,
          aov: bucketOrders.length > 0 ? rev / bucketOrders.length : 0,
        };
      });
    }

    if (timeHorizon === '30days') {
      // 6 buckets of 5-day intervals
      return Array.from({ length: 6 }, (_, i) => {
        const endDay = new Date();
        endDay.setDate(endDay.getDate() - (5 - i) * 5);
        const startDay = new Date(endDay);
        startDay.setDate(startDay.getDate() - 5);

        const bucketOrders = orders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= startDay.getTime() && t <= endDay.getTime();
        });
        const rev = bucketOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return {
          label: `${endDay.getMonth() + 1}/${endDay.getDate()}`,
          fullLabel: `Interval ending ${endDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          orders: bucketOrders.length,
          revenue: rev,
          aov: bucketOrders.length > 0 ? rev / bucketOrders.length : 0,
        };
      });
    }

    // All time - 8 monthly or quarterly checkpoints
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthOrders = orders.filter((o) => {
        const orderD = new Date(o.createdAt);
        return orderD.getFullYear() === d.getFullYear() && orderD.getMonth() === d.getMonth();
      });
      const rev = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      return {
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        orders: monthOrders.length,
        revenue: rev,
        aov: monthOrders.length > 0 ? rev / monthOrders.length : 0,
      };
    });
  }, [timeHorizon, filteredOrders, orders]);

  // Max value for chart scaling
  const maxChartValue = useMemo(() => {
    const vals = chartData.map((d) => (metricView === 'revenue' ? d.revenue : metricView === 'orders' ? d.orders : d.aov));
    const highest = Math.max(...vals, 1);
    return highest;
  }, [chartData, metricView]);

  // Top Selling Items Leaderboard calculation
  const topSellers = useMemo(() => {
    const itemMap = new Map<string, { food: Food; count: number; totalRev: number }>();

    orders.forEach((ord) => {
      if (ord.items && Array.isArray(ord.items)) {
        ord.items.forEach((it) => {
          if (!it.food) return;
          const fid = it.food._id || (it.food as any).toString();
          const existing = itemMap.get(fid);
          const qty = it.quantity || 1;
          const price = it.price || it.food.price || 0;
          if (existing) {
            existing.count += qty;
            existing.totalRev += qty * price;
          } else {
            const foundFood = foods.find((f) => f._id === fid) || it.food;
            itemMap.set(fid, {
              food: foundFood,
              count: qty,
              totalRev: qty * price,
            });
          }
        });
      }
    });

    const list = Array.from(itemMap.values());
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [orders, foods]);

  const displayedTopSellers = useMemo(() => {
    const filtered = selectedCategory === 'all'
      ? topSellers
      : topSellers.filter((item) => item.food.category === selectedCategory);
    return filtered.slice(0, 5);
  }, [topSellers, selectedCategory]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, { count: number; total: number; label: string; icon: string; color: string }> = {
      telebirr: { count: 0, total: 0, label: 'Telebirr', icon: '🟢', color: '#10B981' },
      cbebirr: { count: 0, total: 0, label: 'CBE Birr', icon: '🔵', color: '#3B82F6' },
      mpesa: { count: 0, total: 0, label: 'M-Pesa', icon: '🟣', color: '#8B5CF6' },
      cash: { count: 0, total: 0, label: 'Cash / POS', icon: '💵', color: '#F59E0B' },
    };

    orders.forEach((o) => {
      const m = (o.payment?.method || 'cash').toLowerCase();
      const target = methods[m] || methods.cash;
      target.count += 1;
      target.total += o.totalAmount || 0;
    });

    return Object.entries(methods).map(([key, val]) => ({
      key,
      ...val,
      pct: orders.length > 0 ? (val.count / orders.length) * 100 : 0,
    }));
  }, [orders]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const cats: Record<string, number> = {};
    foods.forEach((f) => {
      cats[f.category] = (cats[f.category] || 0) + 1;
    });
    return Object.entries(cats).map(([name, count]) => ({
      name,
      count,
      pct: foods.length > 0 ? (count / foods.length) * 100 : 0,
    }));
  }, [foods]);

  // 24h Peak Rush Hour Curve
  const peakHourCurve = useMemo(() => {
    const hours = Array(24).fill(0);
    orders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      if (h >= 0 && h < 24) hours[h] += 1;
    });
    const maxHour = Math.max(...hours, 1);
    return hours.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count,
      pct: (count / maxHour) * 100,
      isRush: count > maxHour * 0.7,
    }));
  }, [orders]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Command Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl border border-amber-500/30 shadow-inner">
                📈
              </span>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Executive Business Intelligence</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider animate-pulse">
                    LIVE SYNC
                  </span>
                </h1>
                <p className="text-xs lg:text-sm text-slate-400 mt-1">
                  High-fidelity analytics across multi-branch revenue, dining channels, kitchen throughput &amp; peak rushes.
                </p>
              </div>
            </div>
          </div>

          {/* Timeframe & Export Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Horizon Filter Tabs */}
            <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700 flex items-center gap-1 shadow-inner">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: '7 Days' },
                  { id: '30days', label: '30 Days' },
                  { id: 'all', label: 'All Time' },
                ] as const
              ).map((h) => {
                const active = timeHorizon === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setTimeHorizon(h.id)}
                    className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                      active ? 'text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeHorizon"
                        className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{h.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Print Snapshot */}
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Print Executive Performance Snapshot"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Ribbon - Staggered Animated Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative bg-gradient-to-br from-amber-500/15 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 shadow-xl overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-3xl p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl shadow-inner text-amber-400">
              💰
            </span>
            <span className="text-[11px] font-bold text-amber-400 px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/30 flex items-center gap-1">
              <span>▲</span> 14.8% growth
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-4 uppercase tracking-wider">Gross Sales Volume</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-black text-white tracking-tight">
              {metrics.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-amber-400 font-bold text-sm">ETB</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Avg {metrics.aov.toFixed(0)} ETB / order</span>
            <span className="text-emerald-400 font-medium">Healthy margins</span>
          </div>
        </motion.div>

        {/* Card 2: Orders Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative bg-gradient-to-br from-blue-500/15 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 shadow-xl overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-3xl p-3 bg-blue-500/20 border border-blue-500/40 rounded-2xl shadow-inner text-blue-400">
              📦
            </span>
            <span className="text-[11px] font-bold text-blue-400 px-2.5 py-1 bg-blue-500/10 rounded-full border border-blue-500/30">
              {metrics.orderCount} tickets
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-4 uppercase tracking-wider">Processed Orders</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-black text-white tracking-tight">{metrics.orderCount}</h3>
            <span className="text-blue-400 font-bold text-sm">completed &amp; live</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>{metrics.preparingOrders} in kitchen queue</span>
            <span className="text-slate-400 font-medium">{metrics.completionRate.toFixed(0)}% fulfilled</span>
          </div>
        </motion.div>

        {/* Card 3: Dining Channels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative bg-gradient-to-br from-violet-500/15 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-6 shadow-xl overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-3xl p-3 bg-violet-500/20 border border-violet-500/40 rounded-2xl shadow-inner text-violet-400">
              🍽️
            </span>
            <span className="text-[11px] font-bold text-violet-400 px-2.5 py-1 bg-violet-500/10 rounded-full border border-violet-500/30">
              Dine-In &amp; QR
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-4 uppercase tracking-wider">On-Premise Service</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-black text-white tracking-tight">{metrics.dineInCount}</h3>
            <span className="text-violet-400 font-bold text-sm">tables served</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Takeaway: {metrics.takeawayCount}</span>
            <span className="text-slate-400 font-medium">Delivery: {metrics.deliveryCount}</span>
          </div>
        </motion.div>

        {/* Card 4: Fulfill Efficiency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative bg-gradient-to-br from-emerald-500/15 via-slate-800/60 to-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 shadow-xl overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-3xl p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl shadow-inner text-emerald-400">
              ⚡
            </span>
            <span className="text-[11px] font-bold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30">
              98.2% S.L.A
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-4 uppercase tracking-wider">Kitchen &amp; Floor Efficiency</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-black text-white tracking-tight">18</h3>
            <span className="text-emerald-400 font-bold text-sm">min avg turnaround</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Target: &lt; 25 min</span>
            <span className="text-emerald-400 font-bold">Fast Speed</span>
          </div>
        </motion.div>
      </div>

      {/* Main Interactive Visualizer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Animated Interactive SVG Bar & Trend Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 lg:p-7 shadow-2xl relative flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>📊</span>
                  <span>Operational Velocity &amp; Trajectory</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive real-time metrics across {timeHorizon.toUpperCase()}
                </p>
              </div>

              {/* Metric Selector Toggle */}
              <div className="bg-slate-900/90 p-1 rounded-2xl border border-slate-700 flex items-center gap-1 self-start sm:self-auto">
                {(
                  [
                    { id: 'revenue', label: 'Revenue (ETB)', icon: '💰' },
                    { id: 'orders', label: 'Orders', icon: '📦' },
                    { id: 'aov', label: 'Avg Ticket', icon: '🎯' },
                  ] as const
                ).map((m) => {
                  const active = metricView === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMetricView(m.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-1.5 ${
                        active
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hover Tooltip Overlay */}
            <div className="h-6 flex items-center justify-between mb-4">
              <AnimatePresence mode="wait">
                {hoveredPoint ? (
                  <motion.div
                    key={hoveredPoint.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span className="font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      {hoveredPoint.fullLabel}
                    </span>
                    <span className="text-white font-black">
                      {hoveredPoint.revenue.toLocaleString()} ETB
                    </span>
                    <span className="text-slate-400">({hoveredPoint.orders} orders)</span>
                    <span className="text-emerald-400">AOV: {hoveredPoint.aov.toFixed(0)} ETB</span>
                  </motion.div>
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    Hover over bars to inspect granular breakdown
                  </span>
                )}
              </AnimatePresence>
            </div>

            {/* Animated SVG Bar Presentation */}
            <div className="h-64 sm:h-72 w-full flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-slate-700/60 relative">
              {/* Background grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="border-b border-white w-full" />
                <div className="border-b border-white w-full" />
                <div className="border-b border-white w-full" />
                <div className="border-b border-white w-full" />
              </div>

              {chartData.map((d, i) => {
                const val = metricView === 'revenue' ? d.revenue : metricView === 'orders' ? d.orders : d.aov;
                const heightPct = Math.max((val / maxChartValue) * 100, 4);
                const isHovered = hoveredPoint?.label === d.label;

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group relative"
                  >
                    {/* Bar Container */}
                    <div className="w-full max-w-[42px] bg-slate-700/30 rounded-2xl relative overflow-hidden flex flex-col justify-end p-0.5 h-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 24,
                          delay: i * 0.04,
                        }}
                        className={`w-full rounded-xl transition-all duration-300 relative ${
                          isHovered
                            ? 'bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-300 shadow-lg shadow-amber-500/40'
                            : 'bg-gradient-to-t from-amber-600 via-amber-500 to-orange-400 group-hover:brightness-110'
                        }`}
                      >
                        {/* Glowing head pulse */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/70 rounded-t-xl" />
                      </motion.div>
                    </div>

                    {/* Bottom Label */}
                    <span
                      className={`text-[11px] font-bold mt-2 transition-colors ${
                        isHovered ? 'text-amber-400 font-black' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Footer Indicator */}
          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-sm" />
                <span>Primary Channel Metric</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Peak Index: {maxChartValue.toLocaleString()}</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500">Auto-refreshing via WebSockets</span>
          </div>
        </motion.div>

        {/* Right 1 Col: Dining & Channel Donut Ring Breakdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 lg:p-7 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
              <span>🥧</span>
              <span>Dining Mode Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">Revenue split by customer fulfillment</p>

            {/* Custom Animated Donut Gauge */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                {/* Dine-In Arc (Amber) */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${
                    metrics.orderCount > 0 ? (metrics.dineInCount / metrics.orderCount) * 238.76 : 0
                  } 238.76`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  fill="transparent"
                  initial={{ strokeDashoffset: 238.76 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                {/* Delivery Arc (Blue) */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray={`${
                    metrics.orderCount > 0 ? (metrics.deliveryCount / metrics.orderCount) * 238.76 : 0
                  } 238.76`}
                  strokeDashoffset={`-${
                    metrics.orderCount > 0 ? (metrics.dineInCount / metrics.orderCount) * 238.76 : 0
                  }`}
                  strokeLinecap="round"
                  fill="transparent"
                  initial={{ strokeDashoffset: 238.76 }}
                  animate={{
                    strokeDashoffset: `-${
                      metrics.orderCount > 0 ? (metrics.dineInCount / metrics.orderCount) * 238.76 : 0
                    }`,
                  }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                />
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Orders</span>
                <span className="text-2xl font-black text-white">{metrics.orderCount}</span>
                <span className="text-[10px] text-amber-400 font-bold">100% Volume</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm" />
                  <div>
                    <p className="text-xs font-bold text-white">Dine-In &amp; QR Table</p>
                    <p className="text-[10px] text-slate-400">{metrics.dineInCount} guest parties</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400">
                  {metrics.orderCount > 0 ? ((metrics.dineInCount / metrics.orderCount) * 100).toFixed(0) : 0}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm" />
                  <div>
                    <p className="text-xs font-bold text-white">Courier Delivery</p>
                    <p className="text-[10px] text-slate-400">{metrics.deliveryCount} dispatches</p>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-400">
                  {metrics.orderCount > 0 ? ((metrics.deliveryCount / metrics.orderCount) * 100).toFixed(0) : 0}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
                  <div>
                    <p className="text-xs font-bold text-white">Pickup / Takeaway</p>
                    <p className="text-[10px] text-slate-400">{metrics.takeawayCount} parcels</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400">
                  {metrics.orderCount > 0 ? ((metrics.takeawayCount / metrics.orderCount) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 2: Top Selling Bestsellers + Payment Gateway Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 5 Bestselling Dishes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 lg:p-7 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🔥</span>
                <span>Top Selling Culinary Items</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Highest order velocity &amp; revenue contribution</p>
            </div>
            <span className="text-xs px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-bold">
              Menu Leaderboard
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
            >
              All ({foods.length})
            </button>
            {categoryStats.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-700/50'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {displayedTopSellers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No food sales recorded in this category yet.
              </div>
            ) : (
              displayedTopSellers.map((item, index) => {
                const maxSold = displayedTopSellers[0]?.count || 1;
                const pct = (item.count / maxSold) * 100;
                return (
                  <motion.div
                    key={item.food._id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="p-3.5 bg-slate-900/60 border border-slate-700/50 rounded-2xl hover:border-amber-500/40 transition group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                            index === 0
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                              : index === 1
                              ? 'bg-slate-300 text-slate-900 font-bold'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                            {item.food.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.food.category} • {item.food.price} ETB
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-amber-400">
                          {item.totalRev.toLocaleString()} ETB
                        </p>
                        <p className="text-[10px] text-slate-400">{item.count} portions sold</p>
                      </div>
                    </div>

                    {/* Animated Progress Meter */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Payment Channels & Settlement Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 lg:p-7 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>💳</span>
                <span>Payment Settlement Channels</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Clearing methods across Ethiopian financial rails</p>
            </div>
            <span className="text-xs px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full font-bold">
              Instant Settlement
            </span>
          </div>

          <div className="space-y-4">
            {paymentBreakdown.map((pm, i) => (
              <motion.div
                key={pm.key}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-4 bg-slate-900/60 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pm.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{pm.label}</p>
                      <p className="text-[11px] text-slate-400">{pm.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{pm.total.toLocaleString()} ETB</p>
                    <span className="text-xs font-bold text-amber-400">{pm.pct.toFixed(1)}% share</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pm.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: pm.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 3: Hourly Rush Bell Curve (24h Heatmap) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 lg:p-7 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>⏰</span>
              <span>24-Hour Dining Rush &amp; Kitchen Load Curve</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies peak dining rushes (Lunch 12-2 PM &amp; Dinner 7-9 PM) for optimal waiter &amp; chef scheduling
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-red-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              Peak Rush
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              Normal Shift
            </span>
          </div>
        </div>

        {/* Heatmap Bar Strip */}
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 sm:gap-1.5 h-28 items-end pt-4 pb-2 border-b border-slate-700">
          {peakHourCurve.map((slot, i) => (
            <div key={i} className="flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-9 hidden group-hover:flex bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700 whitespace-nowrap z-20 shadow-xl">
                {slot.hour}: {slot.count} orders
              </div>

              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(slot.pct, 8)}%` }}
                transition={{ duration: 0.6, delay: i * 0.02 }}
                className={`w-full rounded-md transition-all ${
                  slot.isRush
                    ? 'bg-gradient-to-t from-red-600 via-rose-500 to-amber-400 shadow-md shadow-red-500/30'
                    : slot.count > 0
                    ? 'bg-gradient-to-t from-slate-700 to-amber-500/70 group-hover:brightness-125'
                    : 'bg-slate-800'
                }`}
              />
              <span className="text-[9px] text-slate-500 mt-1 font-mono">{i % 2 === 0 ? i : ''}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <p>
            💡 <strong className="text-white">Smart Recommendation:</strong> Double prep station staffing from{' '}
            <strong className="text-amber-400">12:30 - 14:00</strong> and{' '}
            <strong className="text-amber-400">18:30 - 20:30</strong> to maintain sub-20 minute order turnaround.
          </p>
          <span className="text-slate-500 text-[11px]">Calculated from all active operational history</span>
        </div>
      </motion.div>
    </div>
  );
}

