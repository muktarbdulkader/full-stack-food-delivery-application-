import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { staffAuthService } from '../../services/staffAuth.service';

interface BranchOption {
  _id: string;
  name: string;
  code: string;
}

interface OrganizationOption {
  _id: string;
  name: string;
  slug: string;
  businessType: string;
  branches: BranchOption[];
}

export default function StaffRegister() {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    requestedRole: 'waiter',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingOrgs, setFetchingOrgs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const roles = [
    { id: 'waiter', label: 'Waiter / Server', icon: '🛎️', desc: 'Table service, floor orders & guest requests' },
    { id: 'cashier', label: 'Cashier / POS', icon: '💰', desc: 'Checkout billing, cash drawer & receipts' },
    { id: 'chef', label: 'Kitchen Chef / Line Cook', icon: '🍳', desc: 'Kitchen Display System order preparation' },
    { id: 'driver', label: 'Delivery Courier', icon: '🛵', desc: 'Order pickup, dispatch & door delivery' },
  ];

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const orgs = await staffAuthService.getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setSelectedOrgId(orgs[0]._id);
          if (orgs[0].branches && orgs[0].branches.length > 0) {
            setSelectedBranchId(orgs[0].branches[0]._id);
          }
        }
      } catch (err: any) {
        console.warn('Could not fetch organizations for registration:', err);
      } finally {
        setFetchingOrgs(false);
      }
    };
    fetchOrgs();
  }, []);

  // Update selected branch when org changes
  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    const org = organizations.find((o) => o._id === orgId);
    if (org && org.branches && org.branches.length > 0) {
      setSelectedBranchId(org.branches[0]._id);
    } else {
      setSelectedBranchId('');
    }
  };

  const currentOrg = organizations.find((o) => o._id === selectedOrgId);
  const availableBranches = currentOrg?.branches || [];

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
      await staffAuthService.submitRegistration({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        requestedRole: formData.requestedRole,
        requestedBranchId: selectedBranchId || undefined,
        password: formData.password,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Registration submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-2xl shadow-lg mb-2">
            📋
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Access Request</h1>
          <p className="text-xs text-slate-400 mt-1">
            Request to join an existing restaurant organization as an operational team member
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-500/20">
                ✓
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Request Submitted Successfully!</h2>
              <p className="text-sm text-slate-300 mb-4 max-w-md mx-auto">
                Your request has been placed in <strong className="text-amber-400 font-semibold">Pending Approval</strong>.
                The restaurant administrator will review and authorize your account before you can sign in.
              </p>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 text-left mb-6 space-y-1">
                <p>• Restaurant: <span className="text-white font-medium">{currentOrg?.name || 'Selected Restaurant'}</span></p>
                <p>• Employee: <span className="text-white font-medium">{formData.name}</span></p>
                <p>• Email: <span className="text-white font-medium">{formData.email}</span></p>
                <p>• Requested Role: <span className="text-emerald-400 font-medium uppercase">{formData.requestedRole}</span></p>
              </div>
              <button
                onClick={() => navigate('/staff/login')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition"
              >
                Go to Staff Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Restaurant & Branch Selection */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Select Restaurant Organization
                  </label>
                  <Link
                    to="/restaurant/register"
                    className="text-[11px] text-emerald-400 hover:underline font-medium"
                  >
                    + Register New Restaurant
                  </Link>
                </div>

                {fetchingOrgs ? (
                  <div className="text-xs text-slate-500 py-2">Loading restaurants...</div>
                ) : organizations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Restaurant</label>
                      <select
                        value={selectedOrgId}
                        onChange={(e) => handleOrgChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {organizations.map((org) => (
                          <option key={org._id} value={org._id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Branch</label>
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {availableBranches.length > 0 ? (
                          availableBranches.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.name} ({b.code})
                            </option>
                          ))
                        ) : (
                          <option value="">Main Branch</option>
                        )}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    No active restaurants found.{' '}
                    <Link to="/restaurant/register" className="text-emerald-400 font-semibold underline">
                      Be the first to register a restaurant!
                    </Link>
                  </div>
                )}
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Abebe Bikila"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251 911 000 000"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Work / Personal Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.name@restaurant.et"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Requested Workstation Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setFormData({ ...formData, requestedRole: r.id })}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        formData.requestedRole === r.id
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{r.icon}</span>
                        <span className="font-semibold text-xs text-white">{r.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-2">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Create Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                🔒 <strong>Security Policy:</strong> Accounts submitted via self-registration remain pending until an authorized administrator verifies your identity and activates your account.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm transition disabled:opacity-50"
              >
                {loading ? 'Submitting Request...' : 'Submit Request for Approval'}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                <Link to="/staff/login" className="text-blue-400 font-semibold hover:underline">
                  Already have an account? Sign In
                </Link>
                <Link to="/restaurant/register" className="text-emerald-400 font-semibold hover:underline">
                  Are you a Restaurant Owner?
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
