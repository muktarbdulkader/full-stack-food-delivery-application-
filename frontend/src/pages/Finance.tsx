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

interface AccountItem {
  _id: string;
  code: string;
  name: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
}

interface JournalLine {
  account: string;
  debit: number;
  credit: number;
}

const Finance = () => {
  const [activeTab, setActiveTab] = useState<'statement' | 'accounts' | 'journal'>('statement');
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [statement, setStatement] = useState({
    revenues: [] as AccountItem[],
    totalRevenue: 0,
    expenses: [] as AccountItem[],
    totalExpenses: 0,
    netIncome: 0,
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Journal Entry Creator Modal
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryNotes, setEntryNotes] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { account: '', debit: 0, credit: 0 },
    { account: '', debit: 0, credit: 0 },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accRes, plRes, jeRes] = await Promise.all([
        apiReq('/finance/accounts'),
        apiReq('/finance/profit-loss'),
        apiReq('/finance/journal'),
      ]);
      setAccounts(accRes.data.accounts || []);
      setStatement(
        plRes.data.statement || {
          revenues: [],
          totalRevenue: 0,
          expenses: [],
          totalExpenses: 0,
          netIncome: 0,
        }
      );
      setEntries(jeRes.data.entries || []);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitDefaultAccounts = async () => {
    try {
      await apiReq('/finance/accounts/init', 'POST', {});
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Init failed');
    }
  };

  const addLineRow = () => {
    setLines([...lines, { account: '', debit: 0, credit: 0 }]);
  };

  const handlePostJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`Debits (${totalDebit}) must equal Credits (${totalCredit})`);
      return;
    }
    try {
      await apiReq('/finance/journal', 'POST', {
        lines,
        notes: entryNotes,
      });
      setShowEntryModal(false);
      setEntryNotes('');
      setLines([
        { account: '', debit: 0, credit: 0 },
        { account: '', debit: 0, credit: 0 },
      ]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to post entry');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Finance &amp; General Ledger
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Double-entry accounting, P&amp;L reporting, and chart of accounts</p>
        </div>
        <div className="flex items-center gap-3">
          {accounts.length === 0 && (
            <button
              onClick={handleInitDefaultAccounts}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-950/50"
            >
              🌱 Setup Chart of Accounts
            </button>
          )}
          <button
            onClick={() => setShowEntryModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/50"
          >
            <span>+</span> Post Journal Entry
          </button>
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <p className="text-emerald-400 text-xs font-semibold uppercase">Total Operating Revenue</p>
          <p className="text-3xl font-black text-white mt-1">ETB {Number(statement.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <p className="text-rose-400 text-xs font-semibold uppercase">Total Operating Expenses</p>
          <p className="text-3xl font-black text-white mt-1">ETB {Number(statement.totalExpenses || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <p className="text-teal-400 text-xs font-semibold uppercase">Net Operating Profit / Loss</p>
          <p
            className={`text-3xl font-black mt-1 ${
              statement.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            ETB {Number(statement.netIncome || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      {loading && <p className="text-xs text-slate-500 mb-2 italic">Loading ledger records...</p>}
      <div className="flex gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('statement')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'statement'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📈 Profit &amp; Loss Statement
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'accounts'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📚 Chart of Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'journal'
              ? 'border-emerald-400 text-emerald-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚖️ General Journal ({entries.length})
        </button>
      </div>

      {/* Tab: P&L Statement */}
      {activeTab === 'statement' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Revenue Section */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-4 pb-2 border-b border-slate-800 flex justify-between">
              <span>Revenues</span>
              <span>ETB {Number(statement.totalRevenue).toFixed(2)}</span>
            </h3>
            <div className="space-y-3">
              {statement.revenues.length === 0 ? (
                <p className="text-slate-500 text-xs italic">No revenue accounts recorded</p>
              ) : (
                statement.revenues.map((r) => (
                  <div key={r._id} className="flex justify-between text-sm py-1 border-b border-slate-800/40">
                    <span className="text-slate-300 font-medium">
                      <span className="text-slate-500 font-mono mr-2">{r.code}</span>
                      {r.name}
                    </span>
                    <span className="font-bold text-white">ETB {Number(r.balance).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expense Section */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-rose-400 mb-4 pb-2 border-b border-slate-800 flex justify-between">
              <span>Expenses</span>
              <span>ETB {Number(statement.totalExpenses).toFixed(2)}</span>
            </h3>
            <div className="space-y-3">
              {statement.expenses.length === 0 ? (
                <p className="text-slate-500 text-xs italic">No expense accounts recorded</p>
              ) : (
                statement.expenses.map((e) => (
                  <div key={e._id} className="flex justify-between text-sm py-1 border-b border-slate-800/40">
                    <span className="text-slate-300 font-medium">
                      <span className="text-slate-500 font-mono mr-2">{e.code}</span>
                      {e.name}
                    </span>
                    <span className="font-bold text-rose-300">ETB {Number(e.balance).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Accounts */}
      {activeTab === 'accounts' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Code</th>
                <th className="py-4 px-4">Account Title</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-6 text-right">Current Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {accounts.map((acc) => (
                <tr key={acc._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-teal-400">{acc.code}</td>
                  <td className="py-4 px-4 font-semibold text-white">{acc.name}</td>
                  <td className="py-4 px-4">
                    <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {acc.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-white">
                    ETB {Number(acc.balance).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Journal */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {entries.map((je) => (
            <div key={je._id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-teal-400">{je.entryNumber}</span>
                  <span className="text-xs text-slate-400">{new Date(je.date).toLocaleString()}</span>
                </div>
                <span className="text-xs font-bold text-slate-300">
                  Total: ETB {Number(je.totalDebit).toFixed(2)}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {je.lines?.map((line: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-1">
                    <span className="text-slate-300 font-medium">
                      {line.accountCode} — {line.accountName}
                    </span>
                    <div className="flex gap-6 font-mono">
                      <span className="text-emerald-400 w-24 text-right">
                        {line.debit > 0 ? `Dr ${line.debit.toFixed(2)}` : ''}
                      </span>
                      <span className="text-rose-400 w-24 text-right">
                        {line.credit > 0 ? `Cr ${line.credit.toFixed(2)}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {je.notes && <p className="text-xs text-slate-500 italic mt-3">Memo: {je.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Post Journal Modal */}
      <AnimatePresence>
        {showEntryModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Post Balanced Journal Entry</h3>
              <form onSubmit={handlePostJournalEntry} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase">Debits &amp; Credits Lines</label>
                    <button
                      type="button"
                      onClick={addLineRow}
                      className="text-xs bg-teal-600/20 text-teal-300 hover:bg-teal-600 hover:text-white px-2.5 py-1 rounded-lg border border-teal-500/30"
                    >
                      + Add Line
                    </button>
                  </div>
                  {lines.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <select
                        required
                        value={row.account}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].account = e.target.value;
                          setLines(updated);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="">Select Account...</option>
                        {accounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.code} - {a.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="any"
                        placeholder="Debit"
                        value={row.debit || ''}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].debit = parseFloat(e.target.value) || 0;
                          setLines(updated);
                        }}
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Credit"
                        value={row.credit || ''}
                        onChange={(e) => {
                          const updated = [...lines];
                          updated[idx].credit = parseFloat(e.target.value) || 0;
                          setLines(updated);
                        }}
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Transaction Memo</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly rent, staff tips payout, inventory adjustment"
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEntryModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                  >
                    Post Entry
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

export default Finance;
