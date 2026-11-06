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
      <nav className="sticky top-0 z-50 glass-nav shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                <span className="text-xl sm:text-2xl">🍔</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                    FoodHub
                  </span>
                  <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    ET
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight -mt-0.5 hidden sm:block">
                  Addis Ababa Delivery
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-md">
              <NavLink to="/" active={isActive('/')} icon="🏠">
                Menu
              </NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/orders" active={isActive('/orders')} icon="📋">
                    Orders
                  </NavLink>
                  <NavLink to="/cart" active={isActive('/cart')} icon="🛒" badge={totalItems}>
                    Cart
                  </NavLink>
                </>
              )}
            </div>

            {/* Desktop User Section */}
            <div className="hidden md:flex items-center gap-3">
              {/* Hotel / Admin Quick Link */}
              <Link
                to="/admin"
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-amber-600 bg-amber-50 hover:bg-amber-100/80 rounded-xl transition-colors border border-amber-200/60 flex items-center gap-1.5"
                title="Restaurant / Hotel Management System"
              >
                <span>🏨</span>
                <span>Hotel Pro</span>
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                  <div className="flex items-center gap-2.5 bg-white px-3.5 py-1.5 rounded-2xl border border-orange-100 shadow-sm">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left pr-1">
                      <p className="font-bold text-slate-800 text-xs line-clamp-1">{user?.name}</p>
                      <p className="text-[10px] text-orange-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl transition-colors duration-200"
                    title="Sign Out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>Sign In</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-2">
              {isAuthenticated && (
                <Link to="/cart" className="relative p-2.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-sm animate-bounce">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
                aria-label="Toggle navigation"
              >
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-[290px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍔</span>
            <span className="font-display font-black text-xl text-slate-800">FoodHub</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {isAuthenticated && (
          <div className="p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-100/60">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-slate-800 text-sm truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <MobileNavLink to="/" icon="🏠" onClick={() => setIsMenuOpen(false)}>
            Menu
          </MobileNavLink>
          {isAuthenticated ? (
            <>
              <MobileNavLink to="/orders" icon="📋" onClick={() => setIsMenuOpen(false)}>
                My Orders
              </MobileNavLink>
              <MobileNavLink to="/cart" icon="🛒" badge={totalItems} onClick={() => setIsMenuOpen(false)}>
                Shopping Cart
              </MobileNavLink>
            </>
          ) : (
            <MobileNavLink to="/login" icon="🔐" onClick={() => setIsMenuOpen(false)}>
              Sign In / Register
            </MobileNavLink>
          )}

          <div className="pt-3 mt-3 border-t border-slate-100">
            <MobileNavLink to="/admin" icon="🏨" onClick={() => setIsMenuOpen(false)}>
              Hotel Management Portal
            </MobileNavLink>
          </div>
        </div>

        {isAuthenticated && (
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const NavLink = ({
  to,
  active,
  icon,
  badge,
  children,
}: {
  to: string;
  active: boolean;
  icon: string;
  badge?: number;
  children: React.ReactNode;
}) => (
  <Link
    to={to}
    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
      active
        ? 'bg-white text-orange-600 shadow-sm shadow-orange-500/10'
        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
    }`}
  >
    <span className="text-base">{icon}</span>
    <span>{children}</span>
    {badge !== undefined && badge > 0 && (
      <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[11px] font-black rounded-full shadow-sm animate-pulse">
        {badge}
      </span>
    )}
  </Link>
);

const MobileNavLink = ({
  to,
  icon,
  badge,
  onClick,
  children,
}: {
  to: string;
  icon: string;
  badge?: number;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-orange-50/70 rounded-2xl text-slate-700 hover:text-orange-600 font-bold text-sm transition-colors"
  >
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <span>{children}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
        {badge}
      </span>
    )}
  </Link>
);

export default Navbar;
