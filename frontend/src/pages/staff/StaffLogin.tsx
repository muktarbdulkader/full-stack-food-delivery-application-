import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setStaffCredentials } from '../../store/staffAuthSlice';
import { staffAuthService } from '../../services/staffAuth.service';

export default function StaffLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-workspace selection state
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);

  const quickLogins = [
    { role: 'Restaurant Owner', email: 'owner@foodhub.com', color: 'from-amber-500 to-yellow-600', icon: '👑', target: '/admin' },
    { role: 'Cashier Desk', email: 'cashier@foodhub.com', color: 'from-emerald-500 to-teal-600', icon: '💰', target: '/cashier' },
    { role: 'Waiter Station', email: 'waiter@foodhub.com', color: 'from-blue-500 to-indigo-600', icon: '🛎️', target: '/waiter' },
    { role: 'Kitchen KDS', email: 'chef@foodhub.com', color: 'from-rose-500 to-orange-600', icon: '🍳', target: '/kds' },
    { role: 'Driver Dispatch', email: 'driver@foodhub.com', color: 'from-violet-500 to-purple-600', icon: '🛵', target: '/delivery' },
  ];

  const availableWorkspaces = [
    { id: 'admin', label: 'Restaurant Administration', path: '/admin', icon: '🏢', desc: 'Org management, staff, menus, tables & financial ledger' },
    { id: 'waiter', label: 'Waiter Station', path: '/waiter', icon: '🛎️', desc: 'Table occupancy, QR orders, walk-ins, food ordering & bill requests' },
    { id: 'cashier', label: 'Cashier Desk', path: '/cashier', icon: '💰', desc: 'Cash register sessions, unpaid tabs, bills, receipts & payments' },
    { id: 'kds', label: 'Kitchen Display System (KDS)', path: '/kds', icon: '🍳', desc: 'Live ticket routing, cooking stages, timers & station dispatch' },
    { id: 'delivery', label: 'Delivery Station', path: '/delivery', icon: '🛵', desc: 'Driver dispatching, courier GPS transit, package handoff' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await staffAuthService.login(email, password);
      dispatch(
        setStaffCredentials({
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        })
      );

      // If user is owner, super_admin, admin, or has multiple roles, allow workspace selection
      const isPrivileged = ['business_owner', 'super_admin', 'admin', 'restaurant_admin', 'branch_manager'].includes(data.user.role);

      if (isPrivileged) {
        setAuthenticatedUser(data.user);
        setShowWorkspaceModal(true);
      } else {
        const portal = data.user.portal || '/cashier';
        navigate(portal);
      }
    } catch (err: any) {
      setError(err.message || 'Staff authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = (path: string) => {
    setShowWorkspaceModal(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Background Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Workspace Selector Modal */}
      {showWorkspaceModal && authenticatedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 border border-emerald-500/20">
                🚀
              </div>
              <h2 className="text-2xl font-bold text-white">Select Active Workspace</h2>
              <p className="text-xs text-slate-400 mt-1">
                Welcome back, <strong className="text-white">{authenticatedUser.name}</strong> ({authenticatedUser.role}). Choose the operational station you want to enter for this shift.
              </p>
            </div>

            <div className="space-y-2.5 mb-6">
              {availableWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws.path)}
                  className="w-full p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition flex items-center space-x-3 text-left group"
                >
                  <span className="text-2xl p-2 bg-slate-900 rounded-xl group-hover:scale-110 transition">
                    {ws.icon}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
                      {ws.label}
                    </h3>
                    <p className="text-[11px] text-slate-400">{ws.desc}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-emerald-400 text-sm font-bold">
                    →
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleSelectWorkspace(authenticatedUser.portal || '/admin')}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition"
            >
              Enter Default Station ({authenticatedUser.portal || '/admin'})
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-3xl shadow-lg shadow-emerald-500/20 mb-3">
            ⚡
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Staff & Operations</h1>
          <p className="text-sm text-slate-400 mt-1">
            FoodHub ERP Centralized Multi-Tenant Operations Portal
          </p>
        </div>

        {/* Quick Portal Switcher Chips */}
        <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {quickLogins.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => {
                setEmail(item.email);
                setPassword('password123');
              }}
              className="text-left p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition flex items-center space-x-2 text-xs text-slate-300 hover:text-white"
            >
              <span className="text-sm">{item.icon}</span>
              <div className="truncate">
                <p className="font-semibold text-slate-200 text-[11px] truncate">{item.role}</p>
                <p className="text-[9px] text-slate-500 truncate">{item.email}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Staff Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@restaurant.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/staff/accept-invitation"
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Have an invite link?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 text-sm mt-2 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Workstation</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Creation & Request Links */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2 text-center text-xs">
            <div>
              <Link
                to="/restaurant/register"
                className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold hover:underline"
              >
                <span>🏢</span>
                <span>Create a Restaurant Account (Owner Registration)</span>
              </Link>
            </div>
            <div className="text-slate-400">
              Employee joining a team?{' '}
              <Link to="/staff/register" className="text-blue-400 font-semibold hover:underline">
                Request Access
              </Link>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-400 transition">
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
