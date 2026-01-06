import api from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  address?: string;
  phone?: string;
}

export interface AdminRegisterData {
  name: string;
  email: string;
  password: string;
  adminCode: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Admin-specific login - only checks Admin collection
  async adminLogin(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/admin-login', data);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async registerAdmin(data: AdminRegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register-admin', data);
    return response.data;
  },

  async getMe(): Promise<{ data: { user: User } }> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
