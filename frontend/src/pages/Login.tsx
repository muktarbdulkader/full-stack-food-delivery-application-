import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '', phone: '' });
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
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4 py-8 sm:py-12">
      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-orange-300 to-red-300 rounded-full blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-200 to-pink-200 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 group-hover:scale-110 transition-transform">
            <span className="text-3xl">🍔</span>
          </div>
          <div>
            <span className="text-3xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">FoodHub</span>
            <p className="text-xs text-gray-400 -mt-1">Delicious Delivered</p>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 p-6 sm:p-8 border border-white">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${isLogin ? 'bg-white text-orange-500 shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}>
              Sign In
            </button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${!isLogin ? 'bg-white text-orange-500 shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}>
              Sign Up
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">
              {isLogin ? 'Welcome Back! 👋' : 'Join FoodHub! 🎉'}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              {isLogin ? 'Sign in to order your favorite food' : 'Create an account to get started'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm animate-fade-in-up">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="animate-fade-in-up">
                <label className="block text-gray-700 font-medium mb-2 text-sm">Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">👤</span>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required={!isLogin}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-gray-800"
                    placeholder="Your full name" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">✉️</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-gray-800"
                  placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔒</span>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-gray-800"
                  placeholder="••••••••" />
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="animate-fade-in-up">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📱</span>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-gray-800"
                      placeholder="0911 234 567" />
                  </div>
                </div>

                <div className="animate-fade-in-up">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Delivery Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📍</span>
                    <input type="text" name="address" value={formData.address} onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-gray-800"
                      placeholder="Bole, Addis Ababa" />
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Please wait...</span>
                </>
              ) : isLogin ? (
                <>
                  <span>Sign In</span>
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

          {isLogin && (
            <p className="text-center mt-6 text-gray-500 text-sm">
              <a href="#" className="text-orange-500 hover:underline font-medium">Forgot password?</a>
            </p>
          )}

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400">Or continue with</span></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: '🔵', name: 'Google' },
                { icon: '📘', name: 'Facebook' },
                { icon: '🍎', name: 'Apple' },
              ].map((provider, i) => (
                <button key={i} className="flex items-center justify-center py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                  <span className="text-xl">{provider.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Link to="/" className="flex items-center justify-center gap-2 mt-6 text-gray-500 hover:text-orange-500 transition-colors text-sm">
          <span>←</span>
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default Login;
