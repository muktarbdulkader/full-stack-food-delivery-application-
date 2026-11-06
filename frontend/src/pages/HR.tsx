import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

const apiReq = async (endpoint: string, method = 'GET', body?: any) => {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API request failed');
  return data;
};

interface EmployeeItem {
  _id: string;
  employeeCode: string;
  name: string;
  phone: string;
  role: string;
  employmentType: string;
  baseSalary: number;
}

interface AttendanceItem {
  _id: string;
  employee: { _id: string; name: string; employeeCode: string; role: string };
  clockIn: string;
  clockOut?: string;
  totalHoursWorked?: number;
  status: string;
}

interface PayrollItem {
  _id: string;
  month: string;
  status: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  items: any[];
}

const HR = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'payroll'>('employees');
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Employee Modal
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'waiter',
    employmentType: 'full_time',
    baseSalary: 5000,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes, payRes] = await Promise.all([
        apiReq('/hr/employees'),
        apiReq('/hr/attendance'),
        apiReq('/hr/payroll'),
      ]);
      setEmployees(empRes.data.employees || []);
      setAttendance(attRes.data.records || []);
      setPayrolls(payRes.data.payrolls || []);
    } catch (err: any) {
      console.error('Failed to load HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiReq('/hr/employees', 'POST', newEmp);
      setShowEmpModal(false);
      setNewEmp({
        name: '',
        phone: '',
        email: '',
        role: 'waiter',
        employmentType: 'full_time',
        baseSalary: 5000,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    }
  };

  const handleClockIn = async (employeeId: string) => {
    try {
      await apiReq('/hr/attendance/clock-in', 'POST', { employeeId });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Clock in failed');
    }
  };

  const handleClockOut = async (employeeId: string) => {
    try {
      await apiReq('/hr/attendance/clock-out', 'POST', { employeeId });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Clock out failed');
    }
  };

  const handleGeneratePayroll = async () => {
    const month = prompt('Enter month for payroll (YYYY-MM):', new Date().toISOString().slice(0, 7));
    if (!month) return;
    try {
      await apiReq('/hr/payroll/generate', 'POST', { month });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Payroll generation failed');
    }
  };

  const handleMarkPaid = async (payrollId: string) => {
    try {
      await apiReq(`/hr/payroll/${payrollId}/pay`, 'PATCH', {});
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Marking paid failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              HR &amp; Staff Payroll
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Employee profiles, shift attendance clock-in/out, and payroll computation</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'employees' && (
            <button
              onClick={() => setShowEmpModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-950/50"
            >
              <span>+</span> Add Employee
            </button>
          )}
          {activeTab === 'payroll' && (
            <button
              onClick={handleGeneratePayroll}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-950/50"
            >
              <span>⚡</span> Run Monthly Payroll
            </button>
          )}
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <p className="text-indigo-400 text-xs font-semibold uppercase">Active Restaurant Staff</p>
          <p className="text-3xl font-black text-white mt-1">{employees.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <p className="text-violet-400 text-xs font-semibold uppercase">Today Clocked-In</p>
          <p className="text-3xl font-black text-white mt-1">
            {attendance.filter((a) => !a.clockOut).length}
          </p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <p className="text-emerald-400 text-xs font-semibold uppercase">Monthly Wage Commitment</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">
            ETB {employees.reduce((s, e) => s + (e.baseSalary || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      {loading && <p className="text-xs text-slate-500 mb-2 italic">Loading staff records...</p>}
      <div className="flex gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'employees'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          👤 Staff Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'attendance'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ⏰ Shift Attendance
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'payroll'
              ? 'border-indigo-400 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          💰 Payroll Runs ({payrolls.length})
        </button>
      </div>

      {/* Tab: Employees */}
      {activeTab === 'employees' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Emp Code</th>
                <th className="py-4 px-4">Name</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Phone</th>
                <th className="py-4 px-4">Base Salary</th>
                <th className="py-4 px-6 text-right">Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-indigo-400">{emp.employeeCode}</td>
                  <td className="py-4 px-4 font-semibold text-white">{emp.name}</td>
                  <td className="py-4 px-4">
                    <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {emp.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-300">{emp.phone}</td>
                  <td className="py-4 px-4 font-bold text-white">ETB {Number(emp.baseSalary).toFixed(2)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleClockIn(emp._id)}
                        className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white px-3 py-1 rounded-lg border border-emerald-500/30 font-bold transition-all"
                      >
                        ⏱️ In
                      </button>
                      <button
                        onClick={() => handleClockOut(emp._id)}
                        className="text-xs bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white px-3 py-1 rounded-lg border border-rose-500/30 font-bold transition-all"
                      >
                        🚪 Out
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Clock In</th>
                <th className="py-4 px-4">Clock Out</th>
                <th className="py-4 px-6 text-right">Hours Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attendance.map((att) => (
                <tr key={att._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">
                    {att.employee?.name || 'Staff Member'}
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-400 uppercase">
                    {att.employee?.role?.replace('_', ' ') || 'Staff'}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-emerald-400">
                    {new Date(att.clockIn).toLocaleTimeString()}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-rose-400">
                    {att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : 'On Shift'}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-white">
                    {att.totalHoursWorked ? `${att.totalHoursWorked} hrs` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Payroll */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {payrolls.map((pr) => (
            <div key={pr._id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-black text-white">Payroll Cycle: {pr.month}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{pr.items?.length || 0} employees evaluated</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full ${
                      pr.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {pr.status}
                  </span>
                  {pr.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(pr._id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40"
                    >
                      💳 Disburse &amp; Settle Payroll
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-950/60 rounded-2xl p-4 text-center mb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Gross Salaries</p>
                  <p className="text-base font-bold text-slate-200 mt-1">ETB {Number(pr.totalGross).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Statutory Deductions</p>
                  <p className="text-base font-bold text-rose-400 mt-1">ETB {Number(pr.totalDeductions).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Net Take-Home</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">ETB {Number(pr.totalNet).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showEmpModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Add Employee Profile</h3>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={newEmp.name}
                    onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                  <input
                    required
                    type="text"
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Role</label>
                    <select
                      value={newEmp.role}
                      onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="cashier">Cashier</option>
                      <option value="chef">Chef</option>
                      <option value="kitchen_staff">Kitchen Staff</option>
                      <option value="delivery_driver">Delivery Driver</option>
                      <option value="branch_manager">Branch Manager</option>
                      <option value="cleaner">Cleaner</option>
                      <option value="accountant">Accountant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Base Salary (ETB)</label>
                    <input
                      type="number"
                      value={newEmp.baseSalary}
                      onChange={(e) => setNewEmp({ ...newEmp, baseSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEmpModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
                  >
                    Save Employee
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HR;
