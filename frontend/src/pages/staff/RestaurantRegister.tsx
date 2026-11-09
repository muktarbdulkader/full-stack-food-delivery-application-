import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setStaffCredentials } from '../../store/staffAuthSlice';
import { staffAuthService } from '../../services/staffAuth.service';

export default function RestaurantRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurantName: '',
    phone: '',
    businessType: 'restaurant',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    street: 'Bole Road',
    currency: 'ETB',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const businessTypes = [
    { id: 'restaurant', label: 'Restaurant & Dining', icon: '🍽️' },
    { id: 'hotel', label: 'Hotel & Resort Dining', icon: '🏨' },
    { id: 'cafe', label: 'Cafe & Bistro', icon: '☕' },
    { id: 'cloud_kitchen', label: 'Cloud Kitchen & Delivery', icon: '🥡' },
    { id: 'chain', label: 'Restaurant Multi-Branch Chain', icon: '🏢' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const data = await staffAuthService.registerRestaurant({
        ownerName: formData.ownerName,
        email: formData.email,
        password: formData.password,
        restaurantName: formData.restaurantName,
        phone: formData.phone,
        businessType: formData.businessType,
        city: formData.city,
        country: formData.country,
        street: formData.street,
        currency: formData.currency,
      });

      // Save tokens and owner session in Redux + LocalStorage
      dispatch(
        setStaffCredentials({
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        })
      );
      localStorage.setItem('adminToken', data.token);

      // Navigate to Restaurant Administration Command Center
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Restaurant organization creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-3xl shadow-xl shadow-emerald-500/20 mb-3 border border-emerald-400/30">
            🏢
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Register New Restaurant Organization
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Deploy your dedicated multi-tenant Restaurant ERP workspace with instant QR ordering,
            POS cashier desks, kitchen displays, and financial ledger.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <span className="text-base">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Restaurant Profile Section */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <span>1. Business Details</span>
                <span className="h-px bg-slate-800 flex-1" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Restaurant / Establishment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abyssinia Gourmet Dining"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Business Type
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white"
                  >
                    {businessTypes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.icon} {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Primary Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white"
                  >
                    <option value="ETB">ETB (Ethiopian Birr)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Addis Ababa"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Business Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+251 911 234 567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Owner Account Section */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <span>2. Owner / Administrator Account</span>
                <span className="h-px bg-slate-800 flex-1" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe Bikila"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Owner Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@your-restaurant.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white placeholder-slate-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Owner Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-white placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Instant Provisioning Info */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 flex items-start space-x-3">
              <span className="text-xl">✨</span>
              <div className="space-y-1">
                <p className="font-semibold text-emerald-400">Automatic ERP Workspace Provisioning:</p>
                <p className="text-slate-400 leading-relaxed">
                  Upon registration, your organization receives its primary branch, initial dine-in
                  tables (with generated cryptographic QR codes), default Ethiopian Chart of Accounts,
                  and full Owner permissions.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl shadow-xl shadow-emerald-500/25 transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Provisioning Restaurant ERP...</span>
              ) : (
                <>
                  <span>Create Restaurant Organization & Launch ERP</span>
                  <span>🚀</span>
                </>
              )}
            </button>
          </form>

          {/* Navigation links */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <Link to="/staff/login" className="hover:text-emerald-400 transition">
              Already have an account? <strong className="text-emerald-400 font-semibold">Sign In</strong>
            </Link>
            <Link to="/staff/register" className="hover:text-blue-400 transition">
              Employee looking to join a restaurant? <strong className="text-blue-400 font-semibold">Request Access</strong>
            </Link>
          </div>
        </div>

        {/* Customer Return */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-400 transition">
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

