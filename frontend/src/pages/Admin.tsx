import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { adminLogout, setAdminCredentials } from '../store/authSlice';
import { foodService } from '../services/food.service';
import { adminService } from '../services/admin.service';
import { authService } from '../services/auth.service';
import type { Food, Order } from '../services/food.service';
import StaffManagement from './admin/StaffManagement';
import CashierStation from './CashierStation';
import WaiterStation from './WaiterStation';
import KDS from './KDS';
import DeliveryStation from './DeliveryStation';
import POS from './POS';
import Inventory from './Inventory';
import Recipes from './Recipes';
import Procurement from './Procurement';
import Finance from './Finance';
import HR from './HR';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'foods'
  | 'tables'
  | 'waiters'
  | 'staff'
  | 'payments'
  | 'analytics'
  | 'settings'
  | 'cashier'
  | 'waiter'
  | 'kds'
  | 'delivery'
  | 'pos'
  | 'inventory'
  | 'recipes'
  | 'procurement'
  | 'finance'
  | 'hr';

const Admin = () => {
  const { isAdminAuthenticated, admin } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Auth state
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', adminCode: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Sync tab with URL search parameter
  const initialTab = (searchParams.get('tab') as AdminTab) || 'dashboard';
  const [tab, setTabState] = useState<AdminTab>(initialTab);
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'HRM-01' | 'BOL-01'>(
    (localStorage.getItem('selectedBranch') as any) || 'HRM-01'
  );
  const [showWorkstationMenu, setShowWorkstationMenu] = useState(false);

  const setTab = (newTab: AdminTab) => {
    setTabState(newTab);
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    const queryTab = searchParams.get('tab') as AdminTab;
    if (queryTab && queryTab !== tab) {
      setTabState(queryTab);
    }
  }, [searchParams]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editFood, setEditFood] = useState<Food | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', image: '', isAvailable: true });

  // Check if user is admin
  const isAdmin = isAdminAuthenticated && admin?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
      setShowAuth(false);
    } else {
      setShowAuth(true);
      setLoading(false);
    }
  }, [isAdmin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        // Use admin-specific login - only check Admin collection
        const response = await authService.adminLogin({ email: authForm.email, password: authForm.password });
        if (response.data.user.role !== 'admin') {
          setAuthError('Access denied. This portal is for administrators only.');
          setAuthLoading(false);
          return;
        }
        dispatch(setAdminCredentials({ user: response.data.user, token: response.data.token }));
      } else {
        const response = await authService.registerAdmin({
          name: authForm.name, email: authForm.email, password: authForm.password, adminCode: authForm.adminCode
        });
        dispatch(setAdminCredentials({ user: response.data.user, token: response.data.token }));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAuthError(error.response?.data?.message || 'Invalid credentials. Please try again.');
      // Stay on admin login page - don't redirect anywhere
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(adminLogout());
    setShowAuth(true);
  };

  const loadData = async () => {
    try {
      const [foodsRes, ordersRes] = await Promise.all([
        foodService.getAllFoods(),
        adminService.getAllOrders().catch(() => ({ data: { orders: [] } }))
      ]);
      setFoods(foodsRes.data.foods);
      setOrders(ordersRes.data.orders);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAddModal = () => { setEditFood(null); setForm({ name: '', description: '', price: '', category: '', image: '', isAvailable: true }); setShowModal(true); };
  const openEditModal = (food: Food) => { setEditFood(food); setForm({ name: food.name, description: food.description, price: food.price.toString(), category: food.category, image: food.image, isAvailable: food.isAvailable }); setShowModal(true); };
  const handleSave = async () => { try { if (editFood) await adminService.updateFood(editFood._id, { ...form, price: parseFloat(form.price) }); else await adminService.createFood({ ...form, price: parseFloat(form.price) }); setShowModal(false); loadData(); } catch (e) { console.error(e); } };
  const handleDelete = async (id: string) => { if (!confirm('Delete this item?')) return; try { await adminService.deleteFood(id); loadData(); } catch (e) { console.error(e); } };
  const updateOrderStatus = async (id: string, status: string) => { try { await adminService.updateOrderStatus(id, status); loadData(); } catch (e) { console.error(e); } };
  
  // Payment confirmation handler
  const handleConfirmPayment = async (orderId: string, transactionId?: string) => {
    try {
      await adminService.confirmPayment(orderId, transactionId);
      loadData();
    } catch (e) { console.error(e); }
  };

  // Assign driver handler
  const handleAssignDriver = async (orderId: string, driverName: string, driverPhone: string, estimatedMinutes: number) => {
    try {
      await adminService.assignDriver(orderId, driverName, driverPhone, estimatedMinutes);
      loadData();
    } catch (e) { console.error(e); }
  };

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
  const paidOrders = orders.filter(o => o.payment?.status === 'paid').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  const menuItems: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'orders', icon: '📦', label: 'Orders' },
    { id: 'foods', icon: '🍽️', label: 'Menu Management' },
    { id: 'tables', icon: '🪑', label: 'Tables & QR' },
    { id: 'waiters', icon: '🔔', label: 'Waiter Buzzers' },
    { id: 'staff', icon: '🛡️', label: 'Staff & Approvals' },
    { id: 'payments', icon: '💳', label: 'Payments' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  const staffHubItems: { id: AdminTab; icon: string; label: string; path: string }[] = [
    { id: 'cashier', icon: '💵', label: 'Cashier Desk', path: '/cashier' },
    { id: 'waiter', icon: '🛎️', label: 'Waiter Station', path: '/waiter' },
    { id: 'kds', icon: '🍳', label: 'Kitchen Display (KDS)', path: '/kds' },
    { id: 'delivery', icon: '🛵', label: 'Driver & Dispatch', path: '/delivery' },
  ];

  const erpSystemItems: { id: AdminTab; icon: string; label: string; path: string }[] = [
    { id: 'pos', icon: '🏪', label: 'Point of Sale (POS)', path: '/pos' },
    { id: 'inventory', icon: '📦', label: 'Inventory & Stock', path: '/inventory' },
    { id: 'recipes', icon: '🍲', label: 'Recipe Food Costing', path: '/recipes' },
    { id: 'procurement', icon: '🚛', label: 'Procurement & POs', path: '/procurement' },
    { id: 'finance', icon: '📊', label: 'General Ledger & P&L', path: '/finance' },
    { id: 'hr', icon: '👥', label: 'HR & Staff Payroll', path: '/hr' },
  ];

  const getTabTitle = (t: AdminTab): string => {
    switch (t) {
      case 'dashboard': return 'Executive Dashboard';
      case 'orders': return 'Live Orders & Dispatch';
      case 'foods': return 'Menu Management & Pricing';
      case 'tables': return 'Dining Tables & QR Codes';
      case 'waiters': return 'Waiter Service Calls';
      case 'staff': return 'Staff RBAC & Approvals';
      case 'payments': return 'Payments & Revenue';
      case 'analytics': return 'Business Analytics & Reports';
      case 'settings': return 'Restaurant & Branch Settings';
      case 'cashier': return 'Cashier Desk & Shift Ledger';
      case 'waiter': return 'Waiter Service Station';
      case 'kds': return 'Kitchen Display System (KDS)';
      case 'delivery': return 'Delivery & Courier Dispatch';
      case 'pos': return 'Point of Sale (POS) Register';
      case 'inventory': return 'Inventory & Stock Control';
      case 'recipes': return 'Recipe Food Costing & BOM';
      case 'procurement': return 'Procurement & Purchase Orders';
      case 'finance': return 'General Ledger & Chart of Accounts';
      case 'hr': return 'HR & Staff Payroll Management';
      default: return 'Administration';
    }
  };

  // Show Auth Screen
  if (showAuth || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/20">
              <span className="text-4xl">🏨</span>
            </div>
            <h1 className="text-3xl font-bold text-white">FoodHub Pro</h1>
            <p className="text-slate-400 mt-2">Hotel Management System</p>
          </div>

          {/* Auth Card */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              {isLogin ? 'Admin Login' : 'Admin Registration'}
            </h2>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Full Name</label>
                  <input type="text" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required={!isLogin}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="Your full name" />
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
                <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="admin@example.com" />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required minLength={6}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="••••••••" />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Admin Secret Code</label>
                  <input type="password" value={authForm.adminCode} onChange={(e) => setAuthForm({ ...authForm, adminCode: e.target.value })} required={!isLogin}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    placeholder="Enter admin secret code" />
                  <p className="text-slate-500 text-xs mt-1">Contact system administrator for the code</p>
                </div>
              )}

              <button type="submit" disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition shadow-lg shadow-amber-500/20 disabled:opacity-50">
                {authLoading ? 'Please wait...' : isLogin ? 'Login to Dashboard' : 'Create Admin Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                {isLogin ? "Don't have an admin account? " : 'Already have an account? '}
                <button onClick={() => { setIsLogin(!isLogin); setAuthError(''); }} className="text-amber-400 hover:underline font-semibold">
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <Link to="/" className="flex items-center justify-center text-slate-400 hover:text-amber-400 transition gap-2">
                <span>←</span> Back to FoodHub Website
              </Link>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">🔒 Secure Admin Access</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Dashboard</h2>
          <p className="text-slate-400">Preparing your hotel management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-lg">🏨</span>
              </div>
              <span className="font-bold text-white">FoodHub Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button className="p-2 text-slate-400 hover:text-white relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {pendingOrders > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingOrders}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-50" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <span className="text-2xl">🏨</span>
                </div>
                <div>
                  <h1 className="font-bold text-white text-lg">FoodHub Pro</h1>
                  <p className="text-xs text-amber-400">Hotel Management</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Quick Stats Mobile */}
          <div className="lg:hidden p-4 border-b border-slate-700/50">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-emerald-400 text-xl font-bold">{todayOrders}</p>
                <p className="text-slate-400 text-xs">Today's Orders</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                <p className="text-amber-400 text-xl font-bold">{pendingOrders}</p>
                <p className="text-slate-400 text-xs">Pending</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 mb-2">Main Menu</p>
            {menuItems.map((item) => (
              <button key={item.id} onClick={() => { setTab(item.id as typeof tab); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  tab === item.id ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/5' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}>
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.id === 'orders' && pendingOrders > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingOrders}</span>
                )}
              </button>
            ))}

            <div className="pt-4 mt-2 border-t border-slate-700/50">
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider px-4 mb-2">Dedicated Staff Hubs</p>
              {staffHubItems.map((item) => (
                <div key={item.id} className="flex items-center gap-1 group">
                  <button
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left ${
                      tab === item.id
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/5 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  </button>
                  <Link
                    to={item.path}
                    target="_blank"
                    title={`Open ${item.label} in standalone window`}
                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800/80 rounded-xl transition opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              ))}

              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider px-4 mt-4 mb-2">ERP Systems</p>
              {erpSystemItems.map((item) => (
                <div key={item.id} className="flex items-center gap-1 group">
                  <button
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left ${
                      tab === item.id
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  </button>
                  <Link
                    to={item.path}
                    target="_blank"
                    title={`Open ${item.label} in standalone window`}
                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800/80 rounded-xl transition opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-slate-700/50 space-y-2">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition">
              <span className="text-xl">🌐</span>
              <span className="font-medium">View Website</span>
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition">
              <span className="text-xl">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {getTabTitle(tab)}
                </h2>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                  <span>FoodHub ERP Enterprise</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Live Operational State</span>
                </div>
              </div>

              {/* Branch Selector Pill */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 space-x-2">
                <span className="text-xs text-slate-400">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => {
                    const b = e.target.value as any;
                    setSelectedBranch(b);
                    localStorage.setItem('selectedBranch', b);
                  }}
                  className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="HRM-01" className="bg-slate-900 text-white">
                    Haramaya Campus (HRM-01)
                  </option>
                  <option value="BOL-01" className="bg-slate-900 text-white">
                    Bole Branch (BOL-01)
                  </option>
                  <option value="all" className="bg-slate-900 text-white">
                    All Branches Consolidated
                  </option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Workstations Quick Launch Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowWorkstationMenu(!showWorkstationMenu)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm"
                >
                  <span>⚡ Workstations</span>
                  <span className="text-[10px]">▾</span>
                </button>

                {showWorkstationMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Open Operational Workspace
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('cashier');
                        setShowWorkstationMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">💰</span>
                        <div>
                          <p className="font-semibold text-white">Cashier Desk</p>
                          <p className="text-[10px] text-slate-400">Ledger &amp; Settlements</p>
                        </div>
                      </div>
                      <Link
                        to="/cashier"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in new window"
                        className="text-slate-500 hover:text-white p-1"
                      >
                        ↗
                      </Link>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('waiter');
                        setShowWorkstationMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">🛎️</span>
                        <div>
                          <p className="font-semibold text-white">Waiter Station</p>
                          <p className="text-[10px] text-slate-400">Table Orders &amp; Buzzers</p>
                        </div>
                      </div>
                      <Link
                        to="/waiter"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in new window"
                        className="text-slate-500 hover:text-white p-1"
                      >
                        ↗
                      </Link>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('kds');
                        setShowWorkstationMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">🍳</span>
                        <div>
                          <p className="font-semibold text-white">Kitchen KDS</p>
                          <p className="text-[10px] text-slate-400">Chef Ticket Preparation</p>
                        </div>
                      </div>
                      <Link
                        to="/kds"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in new window"
                        className="text-slate-500 hover:text-white p-1"
                      >
                        ↗
                      </Link>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('delivery');
                        setShowWorkstationMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">🛵</span>
                        <div>
                          <p className="font-semibold text-white">Driver Dispatch</p>
                          <p className="text-[10px] text-slate-400">Order Routing &amp; Courier</p>
                        </div>
                      </div>
                      <Link
                        to="/delivery"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in new window"
                        className="text-slate-500 hover:text-white p-1"
                      >
                        ↗
                      </Link>
                    </button>
                    <div className="my-1 border-t border-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setTab('pos');
                        setShowWorkstationMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">🏪</span>
                        <div>
                          <p className="font-semibold">POS Register (Full)</p>
                          <p className="text-[10px] text-slate-400">Point of Sale Workspace</p>
                        </div>
                      </div>
                      <Link
                        to="/pos"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        title="Open in new window"
                        className="text-slate-500 hover:text-white p-1"
                      >
                        ↗
                      </Link>
                    </button>
                  </div>
                )}
              </div>

              {/* Pending Orders Notification Pill */}
              <button
                onClick={() => setTab('orders')}
                className="p-2.5 text-slate-400 hover:text-white bg-slate-950 rounded-xl border border-slate-800 relative transition"
                title="View Pending Orders"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {pendingOrders}
                  </span>
                )}
              </button>

              {/* Admin Avatar */}
              <div className="flex items-center gap-3 bg-slate-950 rounded-xl px-3.5 py-1.5 border border-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                  ADM
                </div>
                <div>
                  <p className="font-semibold text-white text-xs leading-none">
                    {admin?.name || 'Hotel Administrator'}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">super_admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8 pt-20 lg:pt-8">
          {tab === 'dashboard' && (
            <DashboardTab
              totalRevenue={totalRevenue}
              orders={orders}
              foods={foods}
              pendingOrders={pendingOrders}
              todayOrders={todayOrders}
              paidOrders={paidOrders}
              preparingOrders={preparingOrders}
              deliveredOrders={deliveredOrders}
              setTab={setTab}
            />
          )}
          {tab === 'tables' && <TablesTab />}
          {tab === 'waiters' && <WaitersTab />}
          {tab === 'foods' && (
            <FoodsTab
              foods={foods}
              openAddModal={openAddModal}
              openEditModal={openEditModal}
              handleDelete={handleDelete}
            />
          )}
          {tab === 'orders' && (
            <OrdersTab
              orders={orders}
              updateOrderStatus={updateOrderStatus}
              onConfirmPayment={handleConfirmPayment}
              onAssignDriver={handleAssignDriver}
            />
          )}
          {tab === 'staff' && <StaffManagement embedded={true} />}
          {tab === 'payments' && (
            <PaymentsTab orders={orders} totalRevenue={totalRevenue} paidOrders={paidOrders} />
          )}
          {tab === 'analytics' && (
            <AnalyticsTab orders={orders} foods={foods} totalRevenue={totalRevenue} />
          )}
          {tab === 'settings' && <SettingsTab />}

          {/* Operational Workstations embedded with full Admin shell */}
          {tab === 'cashier' && <CashierStation />}
          {tab === 'waiter' && <WaiterStation />}
          {tab === 'kds' && <KDS />}
          {tab === 'delivery' && <DeliveryStation />}

          {/* ERP Core Modules embedded with full Admin shell */}
          {tab === 'pos' && <POS />}
          {tab === 'inventory' && <Inventory />}
          {tab === 'recipes' && <Recipes />}
          {tab === 'procurement' && <Procurement />}
          {tab === 'finance' && <Finance />}
          {tab === 'hr' && <HR />}
        </main>
      </div>

      {/* Food Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-lg border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white">{editFood ? '✏️ Edit Menu Item' : '➕ Add New Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Item Name</label>
                <input placeholder="e.g., Doro Wat Special" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Description</label>
                <textarea placeholder="Describe the dish..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Price (ETB)</label>
                  <input placeholder="0.00" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500">
                    <option value="">Select</option>
                    <option value="Ethiopian">Ethiopian</option>
                    <option value="International">International</option>
                    <option value="Burger">Burger</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Image URL</label>
                <input placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500" />
              </div>
              <label className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-amber-500 focus:ring-amber-500" />
                <div>
                  <p className="text-white font-medium">Available for Order</p>
                  <p className="text-slate-400 text-sm">Customers can order this item</p>
                </div>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition font-medium">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition font-semibold shadow-lg shadow-amber-500/20">Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Dashboard Tab
const DashboardTab = ({ totalRevenue, orders, foods, pendingOrders, todayOrders, paidOrders, preparingOrders, deliveredOrders, setTab }: {
  totalRevenue: number; orders: Order[]; foods: Food[]; pendingOrders: number; todayOrders: number; paidOrders: number; preparingOrders: number; deliveredOrders: number; setTab: (tab: 'dashboard' | 'foods' | 'orders' | 'payments' | 'analytics' | 'settings') => void;
}) => {
  const recentOrders = orders.slice(0, 6);
  const topFoods = foods.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue" value={`${(totalRevenue/1000).toFixed(1)}K`} sub="ETB" trend="+12.5%" color="amber" />
        <StatCard icon="📦" label="Total Orders" value={orders.length.toString()} sub="orders" trend={`${todayOrders} today`} color="blue" />
        <StatCard icon="⏳" label="Pending" value={pendingOrders.toString()} sub="orders" trend="Needs action" color="rose" />
        <StatCard icon="✅" label="Delivered" value={deliveredOrders.toString()} sub="completed" trend={`${paidOrders} paid`} color="emerald" />
      </div>

      {/* Order Status Overview */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4">📊 Order Status Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { status: 'pending', count: pendingOrders, color: 'amber', icon: '⏳' },
            { status: 'confirmed', count: orders.filter(o => o.status === 'confirmed').length, color: 'blue', icon: '✓' },
            { status: 'preparing', count: preparingOrders, color: 'violet', icon: '👨‍🍳' },
            { status: 'out_for_delivery', count: orders.filter(o => o.status === 'out_for_delivery').length, color: 'indigo', icon: '🚗' },
            { status: 'delivered', count: deliveredOrders, color: 'emerald', icon: '✅' },
          ].map((item) => (
            <button key={item.status} onClick={() => setTab('orders')} className={`p-4 rounded-xl border transition-all hover:scale-105 bg-${item.color}-500/10 border-${item.color}-500/20 hover:border-${item.color}-500/40`}>
              <span className="text-2xl block mb-2">{item.icon}</span>
              <p className={`text-2xl font-bold text-${item.color}-400`}>{item.count}</p>
              <p className="text-slate-400 text-xs capitalize">{item.status.replace('_', ' ')}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">📋 Recent Orders</h3>
            <button onClick={() => setTab('orders')} className="text-amber-400 text-sm hover:underline">View All →</button>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-2">📭</span>
                <p className="text-slate-400">No orders yet</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      order.status === 'delivered' ? 'bg-emerald-500/20' : order.status === 'cancelled' ? 'bg-red-500/20' : order.status === 'preparing' ? 'bg-violet-500/20' : 'bg-amber-500/20'
                    }`}>
                      {order.status === 'delivered' ? '✅' : order.status === 'cancelled' ? '❌' : order.status === 'preparing' ? '👨‍🍳' : '📦'}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">#{order._id.slice(-6)}</p>
                      <p className="text-slate-400 text-xs">{order.items.length} items • {order.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-semibold">{order.totalAmount.toFixed(0)} ETB</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">🔥 Popular Items</h3>
            <button onClick={() => setTab('foods')} className="text-amber-400 text-sm hover:underline">Manage Menu →</button>
          </div>
          <div className="space-y-3">
            {topFoods.map((food, i) => (
              <div key={food._id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                <div className="relative">
                  <img src={food.image} alt={food.name} className="w-14 h-14 rounded-xl object-cover" />
                  <span className="absolute -top-1 -left-1 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">#{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{food.name}</p>
                  <p className="text-slate-400 text-sm">{food.category}</p>
                </div>
                <p className="text-amber-400 font-bold">{food.price.toFixed(0)} ETB</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => setTab('foods')} className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl text-amber-400 hover:from-amber-500/30 hover:to-orange-500/20 transition group">
            <span className="text-3xl block mb-2 group-hover:scale-110 transition">➕</span>
            <span className="font-medium">Add Menu Item</span>
          </button>
          <button onClick={() => setTab('orders')} className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 rounded-xl text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/20 transition group">
            <span className="text-3xl block mb-2 group-hover:scale-110 transition">📦</span>
            <span className="font-medium">View Orders</span>
          </button>
          <button onClick={() => setTab('payments')} className="p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/20 transition group">
            <span className="text-3xl block mb-2 group-hover:scale-110 transition">💳</span>
            <span className="font-medium">Payments</span>
          </button>
          <button onClick={() => setTab('analytics')} className="p-4 bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 rounded-xl text-violet-400 hover:from-violet-500/30 hover:to-purple-500/20 transition group">
            <span className="text-3xl block mb-2 group-hover:scale-110 transition">📈</span>
            <span className="font-medium">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Foods Tab
const FoodsTab = ({ foods, openAddModal, openEditModal, handleDelete }: {
  foods: Food[]; openAddModal: () => void; openEditModal: (food: Food) => void; handleDelete: (id: string) => void;
}) => {
  const [filter, setFilter] = useState('all');
  const categories = ['all', ...new Set(foods.map(f => f.category))];
  const filteredFoods = filter === 'all' ? foods : foods.filter(f => f.category === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Menu Items</h3>
          <p className="text-slate-400 text-sm">{foods.length} items • {foods.filter(f => f.isAvailable).length} available</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${filter === cat ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>
          <button onClick={openAddModal} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
            <span>➕</span> Add Item
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFoods.map((food) => (
          <div key={food._id} className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden hover:border-amber-500/30 transition group">
            <div className="relative h-40 sm:h-48">
              <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${food.isAvailable ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {food.isAvailable ? '● Available' : '● Unavailable'}
                </span>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="px-3 py-1 bg-slate-900/80 backdrop-blur text-slate-300 rounded-full text-xs">{food.category}</span>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-white mb-1 truncate">{food.name}</h4>
              <p className="text-slate-400 text-sm line-clamp-2 mb-3 h-10">{food.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-amber-400">{food.price.toFixed(0)} <span className="text-sm text-slate-400">ETB</span></span>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(food)} className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition" title="Edit">✏️</button>
                  <button onClick={() => handleDelete(food._id)} className="p-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition" title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// Orders Tab
const OrdersTab = ({ orders, updateOrderStatus, onConfirmPayment, onAssignDriver }: { 
  orders: Order[]; 
  updateOrderStatus: (id: string, status: string) => void;
  onConfirmPayment: (id: string, txId?: string) => void;
  onAssignDriver: (id: string, name: string, phone: string, mins: number) => void;
}) => {
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDriverModal, setShowDriverModal] = useState<string | null>(null);
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', minutes: 30 });
  
  const statuses = ['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const handleAssignDriver = (orderId: string) => {
    onAssignDriver(orderId, driverForm.name, driverForm.phone, driverForm.minutes);
    setShowDriverModal(null);
    setDriverForm({ name: '', phone: '', minutes: 30 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Orders Management</h3>
          <p className="text-slate-400 text-sm">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
          {statuses.slice(0, 5).map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${filter === status ? 'bg-amber-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredOrders.map((order) => (
          <div key={order._id} className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-amber-400 font-bold">#{order._id.slice(-6)}</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-slate-400">Items:</span><span className="text-white">{order.items.length} items</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total:</span><span className="text-amber-400 font-bold">{order.totalAmount.toFixed(0)} ETB</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="text-white">{order.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Payment:</span>
                <span className="flex items-center gap-2">
                  <span className="text-white capitalize">{order.payment?.method || 'cash'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.payment?.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{order.payment?.status || 'pending'}</span>
                </span>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Address:</span><span className="text-white truncate max-w-[150px]">{order.deliveryAddress || '-'}</span></div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => setSelectedOrder(order)} className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium">📍 View Details</button>
              {order.payment?.status !== 'paid' && (
                <button onClick={() => onConfirmPayment(order._id)} className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">✅ Confirm Pay</button>
              )}
            </div>
            
            <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500">
              <option value="pending">⏳ Pending</option>
              <option value="confirmed">✓ Confirmed</option>
              <option value="preparing">👨‍🍳 Preparing</option>
              <option value="out_for_delivery">🚗 Out for Delivery</option>
              <option value="delivered">✅ Delivered</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                  <td className="px-6 py-4"><span className="font-mono text-amber-400 font-medium">#{order._id.slice(-6)}</span></td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{order.phone || 'No phone'}</p>
                      <p className="text-slate-400 text-sm truncate max-w-[180px]">{order.deliveryAddress || 'No address'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{order.items.length} items</td>
                  <td className="px-6 py-4"><span className="text-amber-400 font-bold">{order.totalAmount.toFixed(0)} ETB</span></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-300 capitalize text-sm">{order.payment?.method || 'cash'}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${order.payment?.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {order.payment?.status || 'pending'}
                        </span>
                        {order.payment?.status !== 'paid' && (
                          <button onClick={() => onConfirmPayment(order._id)} className="text-xs px-2 py-0.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600">✓ Confirm</button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedOrder(order)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30" title="View Details">📍</button>
                      {order.status === 'preparing' && (
                        <button onClick={() => setShowDriverModal(order._id)} className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30" title="Assign Driver">🚗</button>
                      )}
                      <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)} className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">📦 Order #{selectedOrder._id.slice(-6)}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-white">✕</button>
            </div>
            
            {/* Customer & Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-amber-400 font-semibold mb-3">📍 Delivery Location</h3>
                <p className="text-white font-medium">{selectedOrder.deliveryAddress}</p>
                <p className="text-slate-400 text-sm">{selectedOrder.location?.city}, {selectedOrder.location?.country || 'Ethiopia'}</p>
                {selectedOrder.location?.lat && selectedOrder.location?.lng && (
                  <a href={`https://www.google.com/maps?q=${selectedOrder.location.lat},${selectedOrder.location.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600">
                    🗺️ Open in Google Maps
                  </a>
                )}
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-amber-400 font-semibold mb-3">📞 Contact</h3>
                <p className="text-white font-medium">{selectedOrder.phone}</p>
                {selectedOrder.notes && <p className="text-slate-400 text-sm mt-2">📝 {selectedOrder.notes}</p>}
                <a href={`tel:${selectedOrder.phone}`} className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600">
                  📞 Call Customer
                </a>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
              <h3 className="text-amber-400 font-semibold mb-3">🍽️ Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-600 last:border-0">
                    <div className="flex items-center gap-3">
                      <img src={item.food?.image || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="text-white font-medium">{item.food?.name || 'Item'}</p>
                        <p className="text-slate-400 text-sm">x{item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-amber-400 font-semibold">{(item.price * item.quantity).toFixed(0)} ETB</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-600">
                <span className="text-white font-bold">Total</span>
                <span className="text-amber-400 font-bold text-xl">{selectedOrder.totalAmount.toFixed(0)} ETB</span>
              </div>
            </div>

            {/* Payment & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-amber-400 font-semibold mb-2">💳 Payment</h3>
                <p className="text-white capitalize">{selectedOrder.payment?.method || 'Cash'}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${selectedOrder.payment?.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {selectedOrder.payment?.status || 'pending'}
                </span>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-amber-400 font-semibold mb-2">📊 Status</h3>
                <StatusBadge status={selectedOrder.status} />
                <p className="text-slate-400 text-sm mt-2">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">🚗 Assign Delivery Driver</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Driver Name</label>
                <input type="text" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} placeholder="Enter driver name" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Driver Phone</label>
                <input type="tel" value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} placeholder="+251 9XX XXX XXX" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Estimated Delivery (minutes)</label>
                <input type="number" value={driverForm.minutes} onChange={e => setDriverForm({...driverForm, minutes: parseInt(e.target.value) || 30})} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDriverModal(null)} className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600">Cancel</button>
              <button onClick={() => handleAssignDriver(showDriverModal)} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600">Assign Driver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Payments Tab
const PaymentsTab = ({ orders, totalRevenue, paidOrders }: { orders: Order[]; totalRevenue: number; paidOrders: number }) => {
  const paymentMethods = ['telebirr', 'mpesa', 'cbebirr', 'cash'];
  const getMethodStats = (method: string) => {
    const methodOrders = orders.filter(o => o.payment?.method === method);
    return { count: methodOrders.length, revenue: methodOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0) };
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue" value={`${(totalRevenue/1000).toFixed(1)}K`} sub="ETB" trend="+12%" color="amber" />
        <StatCard icon="✅" label="Paid Orders" value={paidOrders.toString()} sub="completed" trend="Success" color="emerald" />
        <StatCard icon="⏳" label="Pending" value={orders.filter(o => o.payment?.status !== 'paid' && o.status !== 'cancelled').length.toString()} sub="awaiting" trend="In progress" color="blue" />
        <StatCard icon="❌" label="Failed" value={orders.filter(o => o.payment?.status === 'failed').length.toString()} sub="failed" trend="Need attention" color="rose" />
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentMethods.map((method) => {
          const stats = getMethodStats(method);
          const config: Record<string, { icon: string; color: string; name: string }> = {
            telebirr: { icon: '🟢', color: 'emerald', name: 'Telebirr' },
            mpesa: { icon: '🟣', color: 'violet', name: 'M-Pesa' },
            cbebirr: { icon: '🔵', color: 'blue', name: 'CBE Birr' },
            cash: { icon: '💵', color: 'amber', name: 'Cash' },
          };
          const c = config[method];
          return (
            <div key={method} className={`bg-slate-800/50 backdrop-blur rounded-2xl p-5 border border-slate-700/50 hover:border-${c.color}-500/30 transition`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-white font-semibold">{c.name}</span>
              </div>
              <p className={`text-2xl font-bold text-${c.color}-400`}>{stats.revenue.toFixed(0)} <span className="text-sm text-slate-400">ETB</span></p>
              <p className="text-slate-400 text-sm">{stats.count} orders</p>
            </div>
          );
        })}
      </div>

      {/* Transactions */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-5 border-b border-slate-700/50">
          <h3 className="text-lg font-bold text-white">💳 Recent Transactions</h3>
        </div>
        
        {/* Mobile */}
        <div className="lg:hidden p-4 space-y-3">
          {orders.slice(0, 10).map((order) => (
            <div key={order._id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
              <div>
                <p className="font-mono text-amber-400 text-sm">#{order._id.slice(-6)}</p>
                <p className="text-slate-400 text-xs capitalize">{order.payment?.method || 'cash'}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">{order.totalAmount.toFixed(0)} ETB</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${order.payment?.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : order.payment?.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {order.payment?.status || 'pending'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Order</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 15).map((order) => (
                <tr key={order._id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                  <td className="px-6 py-4"><span className="font-mono text-amber-400">#{order._id.slice(-6)}</span></td>
                  <td className="px-6 py-4"><span className="text-white font-semibold">{order.totalAmount.toFixed(0)} ETB</span></td>
                  <td className="px-6 py-4"><span className="text-slate-300 capitalize">{order.payment?.method || 'cash'}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.payment?.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : order.payment?.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {order.payment?.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// Analytics Tab
const AnalyticsTab = ({ orders, foods, totalRevenue }: { orders: Order[]; foods: Food[]; totalRevenue: number }) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === date.toDateString());
    return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), orders: dayOrders.length, revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0) };
  });

  const categoryStats = foods.reduce((acc, food) => {
    acc[food.category] = (acc[food.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxOrders = Math.max(...last7Days.map(d => d.orders), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📈" label="Avg Order Value" value={orders.length ? `${(totalRevenue / orders.length).toFixed(0)}` : '0'} sub="ETB" trend="Per order" color="amber" />
        <StatCard icon="🔄" label="Order Rate" value={`${(orders.length / 30).toFixed(1)}`} sub="/day" trend="Last 30 days" color="blue" />
        <StatCard icon="⭐" label="Menu Items" value={foods.length.toString()} sub="items" trend={`${Object.keys(categoryStats).length} categories`} color="violet" />
        <StatCard icon="📊" label="Completion Rate" value={orders.length ? `${((orders.filter(o => o.status === 'delivered').length / orders.length) * 100).toFixed(0)}%` : '0%'} sub="delivered" trend="Success rate" color="emerald" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-6">📊 Orders This Week</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {last7Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-700/50 rounded-t-lg relative" style={{ height: '160px' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500 to-orange-400 rounded-t-lg transition-all duration-500" style={{ height: `${(day.orders / maxOrders) * 100}%`, minHeight: day.orders > 0 ? '8px' : '0' }} />
                </div>
                <span className="text-slate-400 text-xs">{day.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-400 rounded" />
              <span className="text-slate-400">Orders</span>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-6">🍽️ Menu Categories</h3>
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, count]) => {
              const percentage = (count / foods.length) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{category}</span>
                    <span className="text-slate-400">{count} items ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue by Day */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-6">💰 Revenue This Week</h3>
        <div className="grid grid-cols-7 gap-3">
          {last7Days.map((day, i) => (
            <div key={i} className="text-center p-3 bg-slate-700/30 rounded-xl">
              <p className="text-slate-400 text-xs mb-1">{day.day}</p>
              <p className="text-amber-400 font-bold text-sm lg:text-base">{day.revenue.toFixed(0)}</p>
              <p className="text-slate-500 text-xs">ETB</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab = () => (
  <div className="space-y-6">
    {/* Restaurant Info */}
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-6">🏨 Restaurant Information</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Restaurant Name</label>
          <input type="text" defaultValue="FoodHub Ethiopia" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Contact Phone</label>
          <input type="text" defaultValue="+251 911 234 567" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
          <input type="email" defaultValue="info@foodhub.et" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Address</label>
          <input type="text" defaultValue="Bole, Addis Ababa" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
        </div>
      </div>
    </div>

    {/* Delivery Settings */}
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-6">🚗 Delivery Settings</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Delivery Fee (ETB)</label>
          <input type="number" defaultValue="50" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Min Order Amount (ETB)</label>
          <input type="number" defaultValue="100" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">VAT Rate (%)</label>
          <input type="number" defaultValue="15" className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
        </div>
      </div>
    </div>

    {/* Payment Methods */}
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 lg:p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-6">💳 Payment Methods</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'Telebirr', icon: '🟢', desc: 'Ethio Telecom', enabled: true },
          { name: 'M-Pesa', icon: '🟣', desc: 'Safaricom Ethiopia', enabled: true },
          { name: 'CBE Birr', icon: '🔵', desc: 'Commercial Bank', enabled: true },
          { name: 'Cash on Delivery', icon: '💵', desc: 'Pay on arrival', enabled: true },
        ].map((method) => (
          <div key={method.name} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{method.icon}</span>
              <div>
                <p className="text-white font-medium">{method.name}</p>
                <p className="text-slate-400 text-sm">{method.desc}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={method.enabled} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>

    {/* Save Button */}
    <div className="flex justify-end">
      <button className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition shadow-lg shadow-amber-500/20">
        Save All Settings
      </button>
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ icon, label, value, sub, trend, color }: { icon: string; label: string; value: string; sub: string; trend: string; color: string }) => {
  const colors: Record<string, string> = {
    amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    rose: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
    violet: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color].split(' ').slice(0, 2).join(' ')} backdrop-blur rounded-2xl p-5 border ${colors[color].split(' ')[2]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className={`text-2xl lg:text-3xl font-bold ${colors[color].split(' ')[3]}`}>{value} <span className="text-sm text-slate-400 font-normal">{sub}</span></p>
          <p className="text-slate-500 text-xs mt-1">{trend}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    preparing: 'bg-violet-500/20 text-violet-400',
    out_for_delivery: 'bg-indigo-500/20 text-indigo-400',
    delivered: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-500/20 text-slate-400'}`}>{status.replace('_', ' ')}</span>;
};

// =========================================================
// MODULE B: TABLES & QR CODE MANAGEMENT TAB
// =========================================================
const TablesTab = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTable, setPrintTable] = useState<any>(null);

  const [form, setForm] = useState({
    branchId: '',
    tableNumber: '',
    name: '',
    diningArea: 'Main Dining Hall',
    capacity: 4,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [branchesRes, tablesRes] = await Promise.all([
        adminService.getBranches().catch(() => ({ data: { branches: [] } })),
        adminService.getAllTables(selectedBranch || undefined).catch(() => ({ data: { tables: [] } })),
      ]);

      const branchList = branchesRes.data.branches || [];
      setBranches(branchList);
      if (!selectedBranch && branchList.length > 0) {
        setSelectedBranch(branchList[0]._id);
      }
      setTables(tablesRes.data.tables || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createTable({
        ...form,
        branchId: form.branchId || selectedBranch,
        capacity: Number(form.capacity),
      });
      setShowAddModal(false);
      setForm({ branchId: selectedBranch, tableNumber: '', name: '', diningArea: 'Main Dining Hall', capacity: 4, notes: '' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create table');
    }
  };

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    try {
      await adminService.updateTable(tableId, { status: newStatus });
      setTables(tables.map((t) => (t._id === tableId ? { ...t, status: newStatus } : t)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update table status');
    }
  };

  const handleRegenerateQR = async (tableId: string) => {
    if (!confirm('Regenerate QR Code? Existing printed QR codes for this table will become inactive.')) return;
    try {
      const res = await adminService.regenerateQRCode(tableId);
      setTables(
        tables.map((t) =>
          t._id === tableId
            ? { ...t, qrCodeUrl: res.data.qrCodeUrl, qrToken: res.data.qrToken }
            : t
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to regenerate QR code');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to deactivate this table?')) return;
    try {
      await adminService.deleteTable(tableId);
      setTables(tables.filter((t) => t._id !== tableId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const openPrintStandee = (table: any) => {
    setPrintTable(table);
    setShowPrintModal(true);
  };

  const filteredTables = tables.filter((t) => {
    if (selectedArea !== 'all' && t.diningArea !== selectedArea) return false;
    return true;
  });

  const areas = ['all', ...Array.from(new Set(tables.map((t) => t.diningArea).filter(Boolean)))];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🪑</span>
            <span>Restaurant Table & QR Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage physical dining tables, generate cryptographically signed QR codes & track live occupancy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {branches.length > 0 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  📍 {b.name} ({b.code})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setForm({ ...form, branchId: selectedBranch });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Register Table</span>
          </button>
        </div>
      </div>

      {/* Area Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedArea === area
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/50'
            }`}
          >
            {area === 'all' ? 'All Dining Areas' : area}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading table registry...</div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-slate-800/40 rounded-2xl p-12 text-center border border-slate-700/50">
          <span className="text-5xl block mb-3">🪑</span>
          <p className="font-bold text-white mb-1">No tables registered yet</p>
          <p className="text-xs text-slate-400 mb-4">Click "Register Table" to add your first dining table with a QR code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTables.map((table) => {
            const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
              available: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
              occupied: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
              waiting_for_food: { bg: 'bg-violet-500/10 border-violet-500/30', text: 'text-violet-400', dot: 'bg-violet-400 animate-pulse' },
              waiting_for_payment: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400 animate-ping' },
              reserved: { bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-400' },
              cleaning: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400' },
              out_of_service: { bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', dot: 'bg-slate-400' },
            };
            const sc = statusColors[table.status] || statusColors.available;

            return (
              <div
                key={table._id}
                className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-display font-black text-lg shadow-md shadow-amber-500/20">
                        {table.tableNumber}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{table.name}</h3>
                        <p className="text-xs text-slate-400">{table.diningArea} • {table.capacity} Seats</p>
                      </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      <span className="capitalize">{table.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* QR Preview & Info */}
                  <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/40 mb-4">
                    {table.qrCodeUrl ? (
                      <img src={table.qrCodeUrl} alt="QR Code" className="w-14 h-14 bg-white rounded-lg p-1 object-contain" />
                    ) : (
                      <div className="w-14 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">QR</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-400 font-mono truncate">Token: {table.qrToken.slice(0, 16)}...</p>
                      <button
                        onClick={() => openPrintStandee(table)}
                        className="text-amber-400 hover:text-amber-300 text-xs font-bold mt-1 inline-flex items-center gap-1"
                      >
                        <span>🖨️</span>
                        <span>Print Table Standee</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Override & Actions */}
                <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
                  <select
                    value={table.status}
                    onChange={(e) => handleStatusChange(table._id, e.target.value)}
                    className="bg-slate-700/60 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
                  >
                    <option value="available">Set Available</option>
                    <option value="occupied">Set Occupied</option>
                    <option value="waiting_for_food">Waiting for Food</option>
                    <option value="food_ready">Food Ready</option>
                    <option value="waiting_for_payment">Waiting for Payment</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="out_of_service">Out of Service</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRegenerateQR(table._id)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                      title="Regenerate QR Token"
                    >
                      🔄
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table._id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      title="Deactivate Table"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REGISTER TABLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>➕</span>
                <span>Register New Dining Table</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Table Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01, 05, VIP-1"
                  value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Table Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 01 - Window Seat"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Dining Area</label>
                  <select
                    value={form.diningArea}
                    onChange={(e) => setForm({ ...form, diningArea: e.target.value })}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Main Dining Hall">Main Dining Hall</option>
                    <option value="Outdoor Patio">Outdoor Patio</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                    <option value="Terrace Balcony">Terrace Balcony</option>
                    <option value="Bar Area">Bar Area</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase mb-1">Capacity (Seats)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-600 shadow-md"
                >
                  Create & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT TABLE STANDEE MODAL */}
      {showPrintModal && printTable && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-sm border border-slate-700 shadow-2xl text-center">
            <h3 className="font-bold text-white text-lg mb-4">Print QR Standee</h3>

            {/* Printable White Standee Card */}
            <div id="printable-standee" className="bg-white rounded-2xl p-6 text-slate-900 shadow-lg mb-6 border-2 border-orange-500">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🍔</span>
                <span className="font-display font-black text-xl text-slate-900">FoodHub Dining</span>
              </div>
              <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-3">
                Scan to Order & Pay
              </p>

              {printTable.qrCodeUrl ? (
                <img src={printTable.qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto mb-3" />
              ) : null}

              <div className="bg-slate-100 rounded-xl py-2 px-3 inline-block mb-2">
                <p className="font-display font-black text-2xl text-slate-900">TABLE {printTable.tableNumber}</p>
                <p className="text-[10px] text-slate-500 font-bold">{printTable.diningArea}</p>
              </div>
              <p className="text-[10px] text-slate-400">Point your camera to browse real menu & call waiter</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print Standee</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// MODULE B: WAITER BUZZERS TAB (Live Staff Assistance)
// =========================================================
const WaitersTab = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const res = await adminService.getWaiterRequests();
      setRequests(res.data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await adminService.updateWaiterRequest(id, status);
      setRequests(requests.map((r) => (r._id === id ? { ...r, status } : r)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update request');
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 border border-slate-700/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🔔</span>
            <span>Live Waiter & Table Service Buzzers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time alerts triggered by diners from their table QR sessions.</p>
        </div>

        {pendingCount > 0 && (
          <span className="px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold rounded-xl animate-pulse">
            {pendingCount} Pending Calls
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Listening for waiter buzzers...</div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-800/40 rounded-2xl p-12 text-center border border-slate-700/50">
          <span className="text-5xl block mb-3">✨</span>
          <p className="font-bold text-white mb-1">No active table calls</p>
          <p className="text-xs text-slate-400">All dining tables are currently serviced.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => {
            const isPending = req.status === 'pending';
            const iconMap: Record<string, string> = {
              waiter: '🙋 Call Waiter',
              water: '💧 Water Refill',
              bill: '🧾 Request Bill',
              assistance: '💬 Assistance',
              cleaning: '🧼 Clean Table',
            };

            return (
              <div
                key={req._id}
                className={`rounded-2xl p-5 border transition-all ${
                  isPending
                    ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/5'
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-lg font-display font-black text-white">
                      TABLE {req.tableNumber}
                    </span>
                    <p className="text-xs text-amber-400 font-bold mt-0.5">
                      {iconMap[req.requestType] || req.requestType}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isPending ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {req.note && <p className="text-xs text-slate-300 italic mb-4">"{req.note}"</p>}

                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4">
                  <span>Called at:</span>
                  <span>{new Date(req.createdAt).toLocaleTimeString()}</span>
                </div>

                <div className="flex gap-2">
                  {isPending && (
                    <button
                      onClick={() => handleUpdateStatus(req._id, 'acknowledged')}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(req._id, 'resolved')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Mark Resolved ✓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Admin;
