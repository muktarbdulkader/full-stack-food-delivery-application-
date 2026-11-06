import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      navigate('/');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] relative flex items-center justify-center px-4 py-12 sm:py-16 overflow-hidden">
      
      {/* Ambient Blur Bubbles */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-orange-300/30 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-300/20 rounded-full blur-3xl -z-10 animate-float-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        
        {/* Brand Logo Header */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 group-hover:rotate-3 transition-transform">
            <span className="text-3xl">🍔</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-3xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                FoodHub
              </span>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                ET
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Authentic Ethiopian Dining Delivered</p>
          </div>
        </Link>

        {/* Auth Glass Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-orange-500/5 p-7 sm:p-9 border border-orange-100/80">
          
          {/* Sign In / Sign Up Switcher Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all duration-300 ${
                isLogin ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-all duration-300 ${
                !isLogin ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="font-display font-black text-2xl text-slate-900 mb-1">
              {isLogin ? 'Welcome Back! 👋' : 'Create Free Account 🎉'}
            </h2>
            <p className="text-xs text-slate-500">
              {isLogin
                ? 'Sign in to order your favorite meals across Addis Ababa'
                : 'Join thousands enjoying 30-min doorstep food delivery'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs font-semibold mb-6 flex items-center gap-2 animate-fade-in-up">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name on Sign Up */}
            {!isLogin && (
              <div className="animate-fade-in-up">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    placeholder="e.g. Abebe Bikila"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            {/* Extra details on Sign Up */}
            {!isLogin && (
              <>
                <div className="animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ethiopian Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📱</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0911 234 567"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Delivery Address / Sub-City
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📍</span>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. Bole, Addis Ababa"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-2xl font-display font-bold text-base shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : isLogin ? (
                <>
                  <span>Sign In to FoodHub</span>
                  <span>→</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span>🚀</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Admin Portal Redirect */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-2">Hotel, Restaurant or Kitchen Manager?</p>
            <Link
              to="/admin-login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
            >
              <span>🏨</span>
              <span>Sign in to Hotel Pro Management System →</span>
            </Link>
          </div>

        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors">
            ← Back to Home Page
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
