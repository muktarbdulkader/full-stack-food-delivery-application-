const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const staffAuthService = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Staff login failed');
    return data;
  },

  async submitRegistration(body: {
    name: string;
    email: string;
    phone?: string;
    requestedRole: string;
    requestedBranchId?: string;
    password: string;
  }) {
    const res = await fetch(`${API_URL}/staff/register-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration request failed');
    return data;
  },

  async acceptInvitation(body: {
    token: string;
    password: string;
    name?: string;
    phone?: string;
  }) {
    const res = await fetch(`${API_URL}/staff/accept-invitation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to accept invitation');
    return data;
  },

  async logout() {
    const token = localStorage.getItem('staffToken');
    const refreshToken = localStorage.getItem('staffRefreshToken');
    try {
      if (token) {
        await fetch(`${API_URL}/staff/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    }
  },

  async getMe() {
    const token = localStorage.getItem('staffToken') || localStorage.getItem('adminToken');
    if (!token) throw new Error('No staff token');
    const res = await fetch(`${API_URL}/staff/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch staff profile');
    return data.user;
  },
};

