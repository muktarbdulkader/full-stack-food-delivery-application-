import api from './api';

export interface Food {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
}

export interface Location {
  address: string;
  city: string;
  zipCode: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface Payment {
  method: 'cash' | 'card' | 'mpesa' | 'telebirr' | 'cbebirr';
  status?: string;
  transactionId?: string;
  paidAt?: string;
}

export interface Tracking {
  assignedDriver?: string;
  driverPhone?: string;
  currentLocation?: { lat: number; lng: number };
  estimatedArrival?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  foodId: string;
  quantity: number;
}

export interface CreateOrderData {
  items: OrderItem[];
  location: Location;
  payment: Payment;
  phone: string;
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  orderType?: 'delivery' | 'dine_in' | 'takeaway';
  tableNumber?: string;
  items: { food: Food; quantity: number; price: number }[];
  totalAmount: number;
  status: string;
  deliveryAddress?: string;
  location?: Location;
  payment?: Payment;
  phone?: string;
  notes?: string;
  estimatedDelivery?: string;
  tracking?: Tracking;
  statusHistory?: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
}

export interface FoodsResponse {
  status: string;
  results: number;
  data: { foods: Food[] };
}

export const foodService = {
  async getAllFoods(): Promise<FoodsResponse> {
    const response = await api.get<FoodsResponse>('/foods');
    return response.data;
  },

  async getFoodById(id: string): Promise<{ data: { food: Food } }> {
    const response = await api.get(`/foods/${id}`);
    return response.data;
  },
};

export const orderService = {
  async createOrder(data: CreateOrderData): Promise<{ data: { order: Order } }> {
    const response = await api.post('/orders', data);
    return response.data;
  },

  async getMyOrders(): Promise<{ data: { orders: Order[] } }> {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },

  async getOrderById(id: string): Promise<{ data: { order: Order } }> {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};
