import axios from 'axios';
import { env } from '../config/env';

// Safaricom Ethiopia M-Pesa SDK
let MPesa: any;
let APIClient: any;

try {
  const sdk = require('@safaricom-et/mpesa-node-js-sdk');
  MPesa = sdk.MPesa;
  APIClient = sdk.APIClient;
  console.log('✅ M-Pesa Ethiopia SDK loaded');
} catch (error) {
  console.log('⚠️ M-Pesa SDK not installed, using fallback');
}

// Initialize M-Pesa Ethiopia client
const getMpesaClient = () => {
  if (!MPesa || !APIClient) {
    throw new Error('M-Pesa SDK not available');
  }
  
  const apiClient = new APIClient({
    apiKey: env.mpesaApiKey,
    publicKey: env.mpesaPublicKey,
    environment: env.nodeEnv === 'production' ? 'production' : 'sandbox',
  });
  
  return new MPesa(apiClient);
};

// M-Pesa Ethiopia Service
export const mpesaEthiopiaService = {
  async initiateC2B(phone: string, amount: number, orderId: string): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
  }> {
    try {
      const mpesa = getMpesaClient();
      
      // Format phone number for Ethiopia (remove leading 0, add 251)
      const formattedPhone = phone.startsWith('0') 
        ? `251${phone.substring(1)}` 
        : phone.startsWith('+') 
          ? phone.substring(1) 
          : phone;

      const result = await mpesa.c2b({
        amount: Math.ceil(amount),
        msisdn: formattedPhone,
        reference: orderId,
        thirdPartyReference: `FoodHub-${orderId.slice(-8)}`,
      });

      return {
        success: result.responseCode === '0' || result.responseCode === 'INS-0',
        transactionId: result.transactionId || result.conversationId,
        message: result.responseDesc || 'Payment initiated',
      };
    } catch (error: any) {
      console.error('M-Pesa C2B Error:', error);
      return {
        success: false,
        message: error.message || 'Payment failed',
      };
    }
  },

  async queryTransaction(transactionId: string): Promise<{
    status: 'pending' | 'paid' | 'failed';
    message: string;
  }> {
    try {
      const mpesa = getMpesaClient();
      
      const result = await mpesa.queryTransaction({
        queryReference: transactionId,
      });

      if (result.responseCode === '0' || result.responseCode === 'INS-0') {
        return { status: 'paid', message: 'Payment successful' };
      } else if (result.responseCode === 'INS-9') {
        return { status: 'pending', message: 'Payment pending' };
      } else {
        return { status: 'failed', message: result.responseDesc || 'Payment failed' };
      }
    } catch (error: any) {
      return { status: 'pending', message: 'Unable to verify payment' };
    }
  },

  async initiateB2C(phone: string, amount: number, reference: string): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
  }> {
    try {
      const mpesa = getMpesaClient();
      
      const formattedPhone = phone.startsWith('0') 
        ? `251${phone.substring(1)}` 
        : phone;

      const result = await mpesa.b2c({
        amount: Math.ceil(amount),
        msisdn: formattedPhone,
        reference,
        thirdPartyReference: `Refund-${reference}`,
      });

      return {
        success: result.responseCode === '0',
        transactionId: result.transactionId,
        message: result.responseDesc || 'Refund initiated',
      };
    } catch (error: any) {
      return { success: false, message: error.message || 'Refund failed' };
    }
  },
};

// Telebirr Service (Ethiopia)
export const telebirrService = {
  async initiatePayment(phone: string, amount: number, orderId: string): Promise<{
    success: boolean;
    outTradeNo?: string;
    toPayUrl?: string;
    message: string;
  }> {
    try {
      const timestamp = Date.now().toString();
      const nonce = Math.random().toString(36).substring(7);
      
      const payload = {
        appId: env.telebirrAppId,
        appKey: env.telebirrAppKey,
        nonce,
        notifyUrl: `${env.baseUrl}/api/payments/telebirr/callback`,
        outTradeNo: orderId,
        receiveName: 'FoodHub',
        returnUrl: `${env.frontendUrl}/orders`,
        shortCode: env.telebirrShortCode,
        subject: `FoodHub Order ${orderId.slice(-8)}`,
        timeoutExpress: '30',
        timestamp,
        totalAmount: amount.toFixed(2),
      };

      const response = await axios.post(
        env.telebirrApiUrl || 'https://api.ethiotelecom.et/payment/initiate',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.code === '0') {
        return {
          success: true,
          outTradeNo: response.data.data?.outTradeNo || orderId,
          toPayUrl: response.data.data?.toPayUrl,
          message: 'Redirecting to Telebirr',
        };
      }

      return { success: false, message: response.data.msg || 'Payment failed' };
    } catch (error: any) {
      console.error('Telebirr Error:', error);
      return { success: false, message: 'Telebirr service unavailable' };
    }
  },

  async verifyPayment(outTradeNo: string): Promise<{
    status: 'pending' | 'paid' | 'failed';
    amount?: number;
  }> {
    try {
      const response = await axios.post(
        env.telebirrApiUrl || 'https://api.ethiotelecom.et/payment/query',
        { appId: env.telebirrAppId, outTradeNo }
      );

      if (response.data.tradeStatus === 'SUCCESS') {
        return { status: 'paid', amount: response.data.totalAmount };
      }
      return { status: 'pending' };
    } catch {
      return { status: 'pending' };
    }
  },
};

// CBE Birr Service (Commercial Bank of Ethiopia)
export const cbeBirrService = {
  async initiatePayment(phone: string, amount: number, orderId: string): Promise<{
    success: boolean;
    referenceId?: string;
    message: string;
  }> {
    try {
      // CBE Birr API integration
      const response = await axios.post(
        env.cbeBirrApiUrl || 'https://api.cbe.com.et/payment/initiate',
        {
          merchantId: env.cbeBirrMerchantId,
          amount: amount.toFixed(2),
          phone,
          reference: orderId,
          callbackUrl: `${env.baseUrl}/api/payments/cbebirr/callback`,
        },
        {
          headers: {
            'Authorization': `Bearer ${env.cbeBirrApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: response.data.status === 'SUCCESS',
        referenceId: response.data.referenceId,
        message: response.data.message || 'Payment initiated',
      };
    } catch (error: any) {
      return { success: false, message: 'CBE Birr service unavailable' };
    }
  },
};

// Generic payment processor
export const processPayment = async (
  method: string,
  phone: string,
  amount: number,
  orderId: string
): Promise<{ success: boolean; transactionId?: string; payUrl?: string; message: string }> => {
  try {
    switch (method) {
      case 'mpesa': {
        const result = await mpesaEthiopiaService.initiateC2B(phone, amount, orderId);
        return {
          success: result.success,
          transactionId: result.transactionId,
          message: result.message,
        };
      }
      case 'telebirr': {
        const result = await telebirrService.initiatePayment(phone, amount, orderId);
        return {
          success: result.success,
          transactionId: result.outTradeNo,
          payUrl: result.toPayUrl,
          message: result.message,
        };
      }
      case 'cbebirr': {
        const result = await cbeBirrService.initiatePayment(phone, amount, orderId);
        return {
          success: result.success,
          transactionId: result.referenceId,
          message: result.message,
        };
      }
      case 'cash':
        return { success: true, message: 'Pay on delivery' };
      default:
        return { success: false, message: 'Invalid payment method' };
    }
  } catch (error: any) {
    console.error('Payment error:', error);
    return { success: false, message: 'Payment failed. Please try again.' };
  }
};
