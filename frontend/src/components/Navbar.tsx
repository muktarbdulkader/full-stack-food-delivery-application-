import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { totalItems } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-lg shadow-gray-100/50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                <span className="text-xl sm:text-2xl">🍔</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">FoodHub</span>
                <p className="text-[10px] text-gray-400 -mt-1">Delicious Delivered</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/" active={isActive('/')} icon="🏠">Menu</NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/orders" active={isActive('/orders')} icon="📋">Orders</NavLink>
                  <NavLink to="/cart" active={isActive('/cart')} icon="🛒" badge={totalItems}>Cart</NavLink>
                </>
              )}
            </div>

            {/* Desktop User Section */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 rounded-2xl border border-orange-100">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                      <p className="text-[10px] text-gray-500">{user?.role === 'admin' ? '👑 Admin' : '🍽️ Foodie'}</p>
                    </div>
                  </div>
                  <button onClick={logout} className="p-2.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl transition-all" title="Logout">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <Link to="/login" className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                  <span>Sign In</span>
                  <span>→</span>
                </Link>
              )}
            </div>

            {/* Mobile Right Section */}
            <div className="flex md:hidden items-center gap-2">
              {isAuthenticated && (
                <Link to="/cart" className="relative p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl">
                {isMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div className={`md:hidden fixed top-0 right-0 h-full w-[280px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">🍔</span>
              </div>
              <span className="font-bold text-gray-800">FoodHub</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {isAuthenticated && (
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <MobileNavLink to="/" icon="🏠" onClick={() => setIsMenuOpen(false)}>Home</MobileNavLink>
            {isAuthenticated ? (
              <>
                <MobileNavLink to="/orders" icon="📋" onClick={() => setIsMenuOpen(false)}>My Orders</MobileNavLink>
                <MobileNavLink to="/cart" icon="🛒" badge={totalItems} onClick={() => setIsMenuOpen(false)}>Cart</MobileNavLink>
              </>
            ) : (
              <MobileNavLink to="/login" icon="🔐" onClick={() => setIsMenuOpen(false)}>Sign In</MobileNavLink>
            )}
          </nav>

          {/* Footer */}
          {isAuthenticated && (
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full py-3 px-4 bg-red-50 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Desktop Nav Link Component
const NavLink = ({ to, active, icon, badge, children }: { to: string; active: boolean; icon: string; badge?: number; children: React.ReactNode }) => (
  <Link to={to} className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${active ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'}`}>
    <span>{icon}</span>
    <span>{children}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
        {badge}
      </span>
    )}
  </Link>
);

// Mobile Nav Link Component
const MobileNavLink = ({ to, icon, badge, onClick, children }: { to: string; icon: string; badge?: number; onClick: () => void; children: React.ReactNode }) => (
  <Link to={to} onClick={onClick} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors">
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <span className="font-medium text-gray-700">{children}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">{badge}</span>
    )}
  </Link>
);

export default Navbar;
