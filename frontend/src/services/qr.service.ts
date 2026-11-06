import api from './api';

export interface FoodPortion {
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface FoodExtra {
  name: string;
  price: number;
}

export interface DiningFood {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  portions?: FoodPortion[];
  extras?: FoodExtra[];
  spiceLevel?: string;
  isFasting?: boolean;
}

export interface QRScanResponse {
  status: string;
  data: {
    restaurant: {
      name: string;
      logo?: string;
      currency: string;
      taxRate: number;
      serviceChargeRate: number;
    };
    branch: {
      id: string;
      name: string;
      code: string;
      phone: string;
      city?: string;
    };
    table: {
      id: string;
      number: string;
      name: string;
      diningArea: string;
      status: string;
    };
    session: {
      id: string;
      status: string;
      totalAmount: number;
      balanceDue: number;
      ordersCount: number;
    };
    guest: {
      token: string;
      name: string;
      cart: any[];
    };
    menu: {
      categories: string[];
      foods: DiningFood[];
    };
  };
}

export interface DineInOrderItem {
  foodId: string;
  quantity: number;
  selectedPortion?: string;
  selectedExtras?: { name: string; price: number }[];
  instructions?: string;
}

export interface PlaceDineInOrderPayload {
  qrToken: string;
  guestToken?: string;
  items: DineInOrderItem[];
  specialInstructions?: string;
}

export const qrDiningService = {
  async resolveScan(qrToken: string, guestToken?: string): Promise<QRScanResponse> {
    const params = guestToken ? { guestToken } : {};
    const res = await api.get<QRScanResponse>(`/qr/scan/${qrToken}`, { params });
    return res.data;
  },

  async placeOrder(payload: PlaceDineInOrderPayload): Promise<any> {
    const res = await api.post('/qr/order', payload);
    return res.data;
  },

  async callWaiter(qrToken: string, requestType: string, note?: string): Promise<any> {
    const res = await api.post('/qr/call-waiter', { qrToken, requestType, note });
    return res.data;
  },

  async getTableBill(qrToken: string): Promise<any> {
    const res = await api.get(`/qr/bill/${qrToken}`);
    return res.data;
  },

  async requestBill(qrToken: string, paymentMethod?: string): Promise<any> {
    const res = await api.post('/qr/request-bill', { qrToken, paymentMethod });
    return res.data;
  },
};

