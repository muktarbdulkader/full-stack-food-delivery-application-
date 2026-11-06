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

  // Quick filling for demo/testing convenience
  const quickLogins = [
    { role: 'Cashier Desk', email: 'cashier@foodhub.com', color: 'from-amber-500 to-orange-600', icon: '💰' },
    { role: 'Waiter Station', email: 'waiter@foodhub.com', color: 'from-blue-500 to-indigo-600', icon: '🛎️' },
    { role: 'Kitchen KDS', email: 'chef@foodhub.com', color: 'from-emerald-500 to-teal-600', icon: '🍳' },
    { role: 'Driver Dispatch', email: 'driver@foodhub.com', color: 'from-violet-500 to-purple-600', icon: '🛵' },
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

      // Redirect directly to destination portal based on role
      const portal = data.user.portal || '/cashier';
      navigate(portal);
    } catch (err: any) {
      setError(err.message || 'Staff authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-3xl shadow-lg shadow-emerald-500/20 mb-3">
            ⚡
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Staff Workstations</h1>
          <p className="text-sm text-slate-400 mt-1">
            FoodHub ERP Centralized Operations Portal
          </p>
        </div>

        {/* Portal Quick-Fill Chips */}
        <div className="mb-6 grid grid-cols-2 gap-2">
          {quickLogins.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => {
                setEmail(item.email);
                setPassword('password123');
              }}
              className="text-left p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition flex items-center space-x-2.5 text-xs text-slate-300 hover:text-white"
            >
              <span className="text-base">{item.icon}</span>
              <div>
                <p className="font-semibold text-slate-200">{item.role}</p>
                <p className="text-[10px] text-slate-500 truncate">{item.email}</p>
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
                placeholder="staff@foodhub.com"
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

          {/* Role Redirection Footnote */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
            <p>
              New staff member?{' '}
              <Link to="/staff/register" className="text-emerald-400 font-semibold hover:underline">
                Submit Access Request
              </Link>
            </p>
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

