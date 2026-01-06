import api from './api';

export interface PaymentInitResponse {
  success: boolean;
  transactionId?: string;
  payUrl?: string;
  message: string;
}

export interface PaymentStatusResponse {
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: string;
}

export const paymentService = {
  async initiatePayment(
    orderId: string,
    method: 'mpesa' | 'telebirr' | 'cash',
    phone: string
  ): Promise<PaymentInitResponse> {
    const response = await api.post('/payments/initiate', {
      orderId,
      method,
      phone,
    });
    return response.data.data;
  },

  async checkStatus(orderId: string): Promise<PaymentStatusResponse> {
    const response = await api.get(`/payments/status/${orderId}`);
    return response.data.data;
  },
};
