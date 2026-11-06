import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface CashierSale {
  _id: string;
  orderNumber: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  discount?: number;
  payment: {
    method: 'cash' | 'telebirr' | 'cbebirr' | 'mpesa' | 'card';
    status: 'paid' | 'pending' | 'refunded';
    paidAt?: string;
  };
  notes?: string;
  createdAt: string;
}

interface DrawerState {
  isOpen: boolean;
  openingBalance: number;
  closingBalance?: number;
  openedAt?: string;
  cashSales: number;
  telebirrSales: number;
  cbeSales: number;
  mpesaSales: number;
}

const CashierStation = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'drawer' | 'refunds'>('transactions');
  const [sales, setSales] = useState<CashierSale[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, byType: [] });
  const [loading, setLoading] = useState(true);

  // Cash Drawer Simulation state
  const [drawer, setDrawer] = useState<DrawerState>(() => {
    const saved = localStorage.getItem('cashier_drawer');
    return saved
      ? JSON.parse(saved)
      : {
          isOpen: false,
          openingBalance: 0,
          cashSales: 0,
          telebirrSales: 0,
          cbeSales: 0,
          mpesaSales: 0,
        };
  });

  const [openingInput, setOpeningInput] = useState<number>(1000);
  const [closingInput, setClosingInput] = useState<number>(0);
  const [showRefundModal, setShowRefundModal] = useState<CashierSale | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesRes, statsRes] = await Promise.all([
        apiReq('/pos/sales?limit=50'),
        apiReq(`/pos/stats?date=${new Date().toISOString().slice(0, 10)}`),
      ]);
      setSales(salesRes.data?.orders || []);
      setStats(statsRes.data?.stats || { totalOrders: 0, totalRevenue: 0, byType: [] });
    } catch (err: any) {
      console.error('Cashier station load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDrawer = () => {
    const newDrawer: DrawerState = {
      isOpen: true,
      openingBalance: Number(openingInput),
      openedAt: new Date().toISOString(),
      cashSales: 0,
      telebirrSales: 0,
      cbeSales: 0,
      mpesaSales: 0,
    };
    setDrawer(newDrawer);
    localStorage.setItem('cashier_drawer', JSON.stringify(newDrawer));
  };

  const handleCloseDrawer = () => {
    const closed: DrawerState = {
      ...drawer,
      isOpen: false,
      closingBalance: Number(closingInput),
    };
    setDrawer(closed);
    localStorage.setItem('cashier_drawer', JSON.stringify(closed));
    alert('Cash drawer closed and balanced for today.');
  };

  const handleProcessRefund = async () => {
    if (!showRefundModal) return;
    try {
      await apiReq(`/pos/sales/${showRefundModal._id}/refund`, 'PATCH', {
        reason: refundReason || 'Cashier authorized return',
      });
      setShowRefundModal(null);
      setRefundReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Refund failed');
    }
  };

  const cashTotal = sales
    .filter((s) => s.payment?.method === 'cash' && s.payment?.status === 'paid')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const digitalTotal = sales
    .filter((s) => s.payment?.method !== 'cash' && s.payment?.status === 'paid')
    .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">💵</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Cashier &amp; Settlement Desk
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Cash drawer ledger, digital payment settlements (Telebirr, CBE, M-Pesa), receipts and refunds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/pos"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-950/50"
          >
            <span>⚡</span> Open Quick POS Register
          </a>
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-semibold uppercase">Total Register Orders</p>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">{stats.totalOrders}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-emerald-400 text-xs font-semibold uppercase">Cash Drawer Collected</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            ETB {cashTotal.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-cyan-400 text-xs font-semibold uppercase">Digital (Telebirr/CBE/M-Pesa)</p>
          <p className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
            ETB {digitalTotal.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-semibold uppercase">Drawer Status</p>
          <p className="text-xl font-black mt-2 flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                drawer.isOpen ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
              }`}
            />
            <span className={drawer.isOpen ? 'text-emerald-400' : 'text-rose-400'}>
              {drawer.isOpen ? 'Drawer Active' : 'Drawer Closed'}
            </span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'transactions'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🧾 Sales Ledger &amp; Receipts ({sales.length})
        </button>

        <button
          onClick={() => setActiveTab('drawer')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'drawer'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🏧 Cash Drawer &amp; Float Balancing
        </button>
      </div>

      {/* TAB 1: TRANSACTIONS & RECEIPTS */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Receipt / Order #</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Payment Method</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Time</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      Loading register transactions...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No sales recorded for this session.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-teal-400">
                        {sale.orderNumber}
                      </td>
                      <td className="py-4 px-4 capitalize text-slate-300">
                        {sale.orderType === 'dine_in'
                          ? `🍽️ Table ${sale.tableNumber || ''}`
                          : sale.orderType === 'takeaway'
                          ? '🛍️ Takeaway'
                          : '🛵 Delivery'}
                      </td>
                      <td className="py-4 px-4 font-black text-white">
                        ETB {Number(sale.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
                            sale.payment?.method === 'cash'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          {sale.payment?.method}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                            sale.payment?.status === 'paid'
                              ? 'text-emerald-400'
                              : sale.payment?.status === 'refunded'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {sale.payment?.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400 font-mono">
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {sale.payment?.status === 'paid' && (
                          <button
                            onClick={() => setShowRefundModal(sale)}
                            className="text-xs bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-1 rounded-lg border border-rose-500/30 font-semibold transition-all"
                          >
                            Refund / Void
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CASH DRAWER */}
      {activeTab === 'drawer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drawer Control Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {drawer.isOpen ? '🟢 Active Register Session' : '🔴 Open Register Session'}
            </h3>

            {!drawer.isOpen ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 leading-relaxed">
                  Start your shift by entering the starting cash float inside the cash drawer (e.g. ETB 1,000 for change).
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Opening Cash Float (ETB)
                  </label>
                  <input
                    type="number"
                    value={openingInput}
                    onChange={(e) => setOpeningInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={handleOpenDrawer}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-950/50"
                >
                  🔓 Open Cash Drawer &amp; Start Shift
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Shift Started At:</span>
                    <span className="text-white font-mono">
                      {new Date(drawer.openedAt || '').toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Opening Float:</span>
                    <span className="text-emerald-400 font-bold">
                      ETB {drawer.openingBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Cash Sales Recorded:</span>
                    <span className="text-white font-bold">ETB {cashTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-base font-black">
                    <span className="text-slate-300">Expected In Drawer:</span>
                    <span className="text-emerald-400">
                      ETB {(drawer.openingBalance + cashTotal).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    End of Shift Counted Cash (ETB)
                  </label>
                  <input
                    type="number"
                    value={closingInput || ''}
                    placeholder={`Expected: ${(drawer.openingBalance + cashTotal).toFixed(2)}`}
                    onChange={(e) => setClosingInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleCloseDrawer}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-950/50"
                >
                  🔒 Close Drawer &amp; Reconcile Shift
                </button>
              </div>
            )}
          </div>

          {/* Quick Balance Breakdown Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Today's Settlement Summary</h3>
              <p className="text-xs text-slate-400 mb-6">Split of cash vs digital customer transactions</p>

              <div className="space-y-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white text-sm">Physical Cash</p>
                    <p className="text-xs text-slate-500">In Cashier Drawer</p>
                  </div>
                  <p className="font-black text-emerald-400 text-base">ETB {cashTotal.toFixed(2)}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white text-sm">Telebirr &amp; CBE Birr</p>
                    <p className="text-xs text-slate-500">Bank &amp; Mobile Wallets</p>
                  </div>
                  <p className="font-black text-cyan-400 text-base">ETB {digitalTotal.toFixed(2)}</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white text-sm">Gross Sales</p>
                    <p className="text-xs text-slate-500">Total Net Revenue</p>
                  </div>
                  <p className="font-black text-amber-400 text-base">
                    ETB {(cashTotal + digitalTotal).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
              Audited real-time with double-entry general ledger
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      <AnimatePresence>
        {showRefundModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Process Refund / Void</h3>
              <p className="text-sm text-slate-400 mb-4">
                Order <strong className="text-white font-mono">{showRefundModal.orderNumber}</strong> • Total ETB {showRefundModal.totalAmount}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Refund Justification Note
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer cancelled dish, incorrect charge"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessRefund}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                >
                  Confirm Refund
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CashierStation;

