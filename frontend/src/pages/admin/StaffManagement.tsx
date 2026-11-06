import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
  role: string;
  branchId?: { _id: string; name: string };
  registrationStatus: 'pending' | 'active' | 'suspended' | 'rejected' | 'invited';
  employmentStatus: 'active' | 'on_leave' | 'terminated';
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
}

interface RegistrationRequest {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  requestedRole: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

interface AuditLogItem {
  _id: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  details?: Record<string, any>;
  createdAt: string;
}

export default function StaffManagement({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<'directory' | 'requests' | 'invitations' | 'activity'>('directory');
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<AuditLogItem[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'waiter',
    branchId: '',
    permissions: [] as string[],
  });
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  useEffect(() => {
    fetchStaff();
    fetchRequests();
    fetchInvitations();
    fetchActivity();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStaffList(data.staff);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/staff/requests/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/staff/invitations/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setInvitations(data.invitations);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/staff/activity/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setActivityLogs(data.logs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/staff/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (data.success) {
        setInviteResult(data.inviteLink || 'Invitation sent successfully!');
        fetchInvitations();
        fetchStaff();
      } else {
        alert(data.message || 'Failed to send invite');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/staff/requests/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        alert('Request approved successfully!');
        fetchRequests();
        fetchStaff();
      } else {
        alert(data.message || 'Approval failed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectRequest = async (id: string) => {
    const reason = prompt('Enter reason for declining request:');
    if (reason === null) return;
    try {
      const res = await fetch(`${API_URL}/admin/staff/requests/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Request rejected');
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetch(`${API_URL}/admin/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registrationStatus: newStatus,
          isActive: newStatus === 'active',
        }),
      });
      fetchStaff();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeSessions = async (staffId: string) => {
    if (!confirm('Revoke all active sessions for this employee immediately?')) return;
    try {
      await fetch(`${API_URL}/admin/staff/${staffId}/revoke-sessions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('All active sessions revoked');
    } catch (e) {
      console.error(e);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.employeeId && s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className={embedded ? 'space-y-6' : 'min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8'}>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          {!embedded && (
            <div className="flex items-center space-x-3 mb-1">
              <Link to="/admin" className="text-slate-400 hover:text-white text-sm">
                ← Admin Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-emerald-400 text-sm font-semibold">Staff Management</span>
            </div>
          )}
          <h1 className="text-2xl lg:text-3xl font-extrabold">Staff Access &amp; Operational Portals</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage employee identities, invitations, approval requests and RBAC workstation authorization
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/staff/login"
            target="_blank"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
          >
            <span>Preview Staff Login</span>
            <span>↗</span>
          </Link>
          <button
            onClick={() => {
              setShowInviteModal(true);
              setInviteResult(null);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2"
          >
            <span>+</span>
            <span>Invite Employee</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mt-6 space-x-6">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 font-semibold text-sm transition relative ${
            activeTab === 'directory' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Staff Directory ({staffList.length})
          {activeTab === 'directory' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 font-semibold text-sm transition relative flex items-center space-x-2 ${
            activeTab === 'requests' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Pending Requests</span>
          {requests.filter((r) => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
              {requests.filter((r) => r.status === 'pending').length}
            </span>
          )}
          {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />}
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-3 font-semibold text-sm transition relative ${
            activeTab === 'invitations' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Invitations Sent ({invitations.length})
          {activeTab === 'invitations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 font-semibold text-sm transition relative ${
            activeTab === 'activity' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Activity &amp; Audit Logs
          {activeTab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {/* TAB 1: STAFF DIRECTORY */}
        {activeTab === 'directory' && (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search name, email, employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['all', 'cashier', 'waiter', 'chef', 'driver', 'admin'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition ${
                      roleFilter === r
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">ID</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Assigned Portal</th>
                      <th className="px-4 py-3.5">Account Status</th>
                      <th className="px-4 py-3.5">Last Login</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          Loading staff directory...
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No staff accounts found.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => (
                        <tr key={staff._id} className="hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-white">{staff.name}</p>
                            <p className="text-[11px] text-slate-400">{staff.email}</p>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-300">
                            {staff.employeeId || '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-300 border border-slate-700">
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-slate-300 font-mono text-[11px]">
                              {staff.role === 'cashier'
                                ? '/cashier'
                                : staff.role === 'waiter'
                                ? '/waiter'
                                : staff.role === 'chef'
                                ? '/kds'
                                : staff.role === 'driver'
                                ? '/delivery'
                                : '/admin'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                staff.registrationStatus === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : staff.registrationStatus === 'suspended'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {staff.registrationStatus || 'active'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                            {staff.lastLoginAt
                              ? new Date(staff.lastLoginAt).toLocaleString()
                              : 'Never logged in'}
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleToggleStatus(staff._id, staff.registrationStatus)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition ${
                                staff.registrationStatus === 'active'
                                  ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {staff.registrationStatus === 'active' ? 'Suspend' : 'Reactivate'}
                            </button>
                            <button
                              onClick={() => handleRevokeSessions(staff._id)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                            >
                              Kill Sessions
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTRATION REQUESTS */}
        {activeTab === 'requests' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">Employee Self-Registration Queue</h3>
                <p className="text-[11px] text-slate-400">
                  Review applicant role submissions. Self-approval is strictly prohibited by security policy.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Applicant</th>
                    <th className="px-4 py-3.5">Requested Role</th>
                    <th className="px-4 py-3.5">Phone</th>
                    <th className="px-4 py-3.5">Requested Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Approval Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No registration requests in queue.
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-white">{req.name}</p>
                          <p className="text-[11px] text-slate-400">{req.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {req.requestedRole}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">{req.phone || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : req.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveRequest(req._id)}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs transition"
                              >
                                Approve &amp; Activate
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req._id)}
                                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs transition"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVITATIONS */}
        {activeTab === 'invitations' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">Issued Staff Invitations</h3>
              <p className="text-[11px] text-slate-400">
                Secure, expiring invitation tokens emailed to personnel.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Invited Personnel</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Expires At</th>
                    <th className="px-4 py-3.5">Invited By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No invitations sent yet. Click &quot;Invite Employee&quot; above to issue one.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-white">{inv.invitedName}</p>
                          <p className="text-[11px] text-slate-400">{inv.invitedEmail}</p>
                        </td>
                        <td className="px-4 py-3.5 font-bold uppercase text-emerald-400">{inv.role}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              inv.status === 'accepted'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : inv.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {inv.invitedBy?.name || 'Administrator'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'activity' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">Security &amp; Operational Audit Trail</h3>
                <p className="text-[11px] text-slate-400">
                  Immutable record of staff logins, register openings, food dispatches and role updates.
                </p>
              </div>
              <button
                onClick={fetchActivity}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
              >
                Refresh Log
              </button>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No audit logs recorded yet.</div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="p-3.5 hover:bg-slate-800/20 transition flex items-start justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-400">{log.action}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-white font-medium">{log.userName || 'System'}</span>
                        {log.userRole && (
                          <span className="px-1.5 py-0.2 bg-slate-800 text-[10px] text-slate-400 rounded">
                            {log.userRole}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Target: <span className="text-slate-300">{log.entityType}</span>
                        {log.details && (
                          <span className="ml-2 font-mono text-[10px] text-slate-500">
                            {JSON.stringify(log.details)}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-7 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white">Invite Staff Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {inviteResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400">
                  <p className="font-bold mb-1">Invitation Created!</p>
                  <p className="text-slate-300 break-all">{inviteResult}</p>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteResult(null);
                  }}
                  className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="e.g. Almaz Ayana"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="almaz@foodhub.et"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Assign Portal Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="cashier">Cashier Desk (/cashier)</option>
                    <option value="waiter">Waiter Station (/waiter)</option>
                    <option value="chef">Kitchen Display (/kds)</option>
                    <option value="driver">Driver &amp; Dispatch (/delivery)</option>
                    <option value="branch_manager">Branch Manager</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                  Staff member will receive an expiring single-use link to verify their email and configure their password.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
                >
                  Send Invitation
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
