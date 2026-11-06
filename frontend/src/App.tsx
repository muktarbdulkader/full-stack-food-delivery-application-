import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import DineInMenu from './pages/DineInMenu';
import KDS from './pages/KDS';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import Procurement from './pages/Procurement';
import Finance from './pages/Finance';
import HR from './pages/HR';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Home page - shows Landing for guests, Menu for authenticated users
const HomePage = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <Home /> : <Landing />;
};

// Layout wrapper that conditionally shows navbar
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Pages without customer navbar
  const isNoNavbarPage =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/table/') ||
    location.pathname.startsWith('/dine/') ||
    location.pathname.startsWith('/kds') ||
    location.pathname.startsWith('/pos') ||
    location.pathname.startsWith('/inventory') ||
    location.pathname.startsWith('/recipes') ||
    location.pathname.startsWith('/procurement') ||
    location.pathname.startsWith('/finance') ||
    location.pathname.startsWith('/hr');

  if (isNoNavbarPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          {/* QR Table Ordering */}
          <Route path="/table/:qrToken" element={<DineInMenu />} />
          <Route path="/dine/:qrToken" element={<DineInMenu />} />

          {/* Kitchen Display System */}
          <Route path="/kds" element={<KDS />} />

          {/* Point of Sale */}
          <Route path="/pos" element={<POS />} />

          {/* ERP Core Modules */}
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/hr" element={<HR />} />

          {/* Admin Management System */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
