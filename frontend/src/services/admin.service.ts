import { adminApi } from './api';
import type { Food, Order } from './food.service';

export interface CreateFoodData {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalFoods: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const adminService = {
  // Food Management
  async createFood(data: CreateFoodData): Promise<{ data: { food: Food } }> {
    const response = await adminApi.post('/foods', data);
    return response.data;
  },

  async updateFood(id: string, data: Partial<CreateFoodData>): Promise<{ data: { food: Food } }> {
    const response = await adminApi.put(`/foods/${id}`, data);
    return response.data;
  },

  async deleteFood(id: string): Promise<void> {
    await adminApi.delete(`/foods/${id}`);
  },

  // Order Management
  async getAllOrders(): Promise<{ data: { orders: Order[] } }> {
    const response = await adminApi.get('/orders/all');
    return response.data;
  },

  async updateOrderStatus(id: string, status: string): Promise<{ data: { order: Order } }> {
    const response = await adminApi.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  async getOrderDetails(id: string): Promise<{ data: { order: Order } }> {
    const response = await adminApi.get(`/admin/orders/${id}`);
    return response.data;
  },

  // Payment Management
  async confirmPayment(orderId: string, transactionId?: string): Promise<{ data: { order: Order } }> {
    const response = await adminApi.post(`/admin/orders/${orderId}/confirm-payment`, { transactionId });
    return response.data;
  },

  // Delivery Management
  async assignDriver(orderId: string, driverName: string, driverPhone: string, estimatedMinutes?: number): Promise<{ data: { order: Order } }> {
    const response = await adminApi.post(`/admin/orders/${orderId}/assign-driver`, {
      driverName,
      driverPhone,
      estimatedMinutes: estimatedMinutes || 30,
    });
    return response.data;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await adminApi.get('/admin/stats');
    return response.data.data;
  },

  // User Management
  async getAllUsers(): Promise<{ data: { users: UserData[] } }> {
    const response = await adminApi.get('/admin/users');
    return response.data;
  },

  // Branch & Organization Management
  async getBranches(): Promise<{ data: { branches: any[] } }> {
    const response = await adminApi.get('/organization/branches');
    return response.data;
  },

  // Table & QR Management
  async getAllTables(branchId?: string): Promise<{ data: { tables: any[] } }> {
    const params = branchId ? { branchId } : {};
    const response = await adminApi.get('/tables', { params });
    return response.data;
  },

  async createTable(data: any): Promise<{ data: { table: any } }> {
    const response = await adminApi.post('/tables', data);
    return response.data;
  },

  async updateTable(id: string, data: any): Promise<{ data: { table: any } }> {
    const response = await adminApi.put(`/tables/${id}`, data);
    return response.data;
  },

  async deleteTable(id: string): Promise<void> {
    await adminApi.delete(`/tables/${id}`);
  },

  async regenerateQRCode(id: string): Promise<any> {
    const response = await adminApi.post(`/tables/${id}/regenerate-qr`);
    return response.data;
  },

  // Waiter Service Requests
  async getWaiterRequests(branchId?: string): Promise<{ data: { requests: any[] } }> {
    const params = branchId ? { branchId } : {};
    const response = await adminApi.get('/waiters', { params });
    return response.data;
  },

  async updateWaiterRequest(id: string, status: string): Promise<{ data: { request: any } }> {
    const response = await adminApi.patch(`/waiters/${id}/status`, { status });
    return response.data;
  },
};
