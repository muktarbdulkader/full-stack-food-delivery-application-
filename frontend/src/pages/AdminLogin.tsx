import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../services/auth.service';
import { setAdminCredentials } from '../store/authSlice';

const AdminLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    adminCode: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authService.adminLogin({ 
          email: formData.email, 
          password: formData.password 
        });
        
        if (response.data.user.role !== 'admin') {
          setError('Access denied. This portal is for administrators only.');
          setLoading(false);
          return;
        }
        
        dispatch(setAdminCredentials({
          user: response.data.user,
          token: response.data.token,
        }));
        
        navigate('/admin');
      } else {
        // Register as admin
        const response = await authService.registerAdmin({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          adminCode: formData.adminCode,
        });
        
        dispatch(setAdminCredentials({
          user: response.data.user,
          token: response.data.token,
        }));
        
        setSuccess('Admin account created successfully!');
        setTimeout(() => navigate('/admin'), 1500);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Top Quick Navigation Pills */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/staff/login"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 transition shadow-sm font-medium"
          >
            <span className="text-sm">👥</span>
            <span>Staff & Workstations Login</span>
            <span>→</span>
          </Link>
          <Link
            to="/restaurant/register"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-amber-400 hover:bg-slate-700 hover:text-amber-300 transition shadow-sm font-medium"
          >
            <span>🏢</span>
            <span>New Restaurant</span>
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">👨‍💼</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 mt-2">FoodHub ERP Restaurant Management</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Workstation Switcher Header Tabs */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl mb-6">
            <div className="flex-1 py-2 text-center text-xs font-bold text-gray-800 bg-white rounded-lg shadow-sm flex items-center justify-center gap-1.5">
              <span>👨‍💼</span>
              <span>Admin Master</span>
            </div>
            <Link
              to="/staff/login"
              className="flex-1 py-2 text-center text-xs font-semibold text-gray-500 hover:text-emerald-600 transition flex items-center justify-center gap-1.5"
            >
              <span>👥</span>
              <span>Staff Workstations</span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {isLogin ? 'Admin Login' : 'Admin Registration'}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Admin Secret Code</label>
                <input
                  type="password"
                  name="adminCode"
                  value={formData.adminCode}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter secret admin code"
                />
                <p className="text-xs text-gray-500 mt-1">Default code: FOODHUB2024</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login to Dashboard' : 'Create Admin Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an admin account? " : 'Already have an account? '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                className="text-orange-500 hover:underline font-semibold"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>

          {/* Staff Workstations Callout Banner with Icon */}
          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/20">
                👥
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <span>Operational Staff Workstations</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-200 text-emerald-800 font-bold uppercase">Active</span>
                </p>
                <p className="text-[11px] text-gray-600">Cashier • Waiter • Kitchen KDS • Delivery</p>
              </div>
            </div>
            <Link
              to="/staff/login"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1"
            >
              <span>Staff Login</span>
              <span>→</span>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link to="/" className="flex items-center justify-center text-gray-500 hover:text-orange-500 transition">
              <span className="mr-2">←</span> Back to FoodHub
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>🔒 Secure Admin Access</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
