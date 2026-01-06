import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order.model';
import { User } from '../models/User.model';
import { processPayment, mpesaEthiopiaService, telebirrService } from '../services/payment.service';
import { createError } from '../middlewares/error.middleware';
import { sendOrderConfirmation } from '../utils/email';
import { AuthRequest } from '../middlewares/auth.middleware';

export const initiatePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, method, phone } = req.body;

    const order = await Order.findById(orderId);
    if (!order) throw createError('Order not found', 404);

    // Format Ethiopian phone number
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
      formattedPhone = `251${phone.substring(1)}`;
    } else if (!phone.startsWith('251') && !phone.startsWith('+251')) {
      formattedPhone = `251${phone}`;
    }

    const result = await processPayment(method, formattedPhone, order.totalAmount, orderId);

    if (result.success) {
      order.payment = {
        method,
        status: method === 'cash' ? 'pending' : 'pending',
        transactionId: result.transactionId,
      };
      await order.save();
    }

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const mpesaCallback = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    console.log('M-Pesa Callback:', JSON.stringify(req.body, null, 2));
    
    const { transactionId, resultCode, reference } = req.body;

    const order = await Order.findOne({
      $or: [
        { 'payment.transactionId': transactionId },
        { _id: reference },
      ],
    });

    if (order) {
      if (resultCode === '0' || resultCode === 'INS-0') {
        order.payment.status = 'paid';
        order.payment.transactionId = transactionId;
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
        await order.save();

        const user = await User.findById(order.user);
        if (user?.email) {
          sendOrderConfirmation(user.email, order._id.toString(), order.totalAmount);
        }
      } else {
        order.payment.status = 'failed';
        await order.save();
      }
    }

    res.status(200).json({ resultCode: '0', resultDesc: 'Accepted' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(200).json({ resultCode: '0', resultDesc: 'Accepted' });
  }
};

export const telebirrCallback = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    console.log('Telebirr Callback:', JSON.stringify(req.body, null, 2));
    
    const { outTradeNo, tradeStatus, tradeNo } = req.body;

    const order = await Order.findById(outTradeNo);

    if (order) {
      if (tradeStatus === 'SUCCESS' || tradeStatus === 'TRADE_SUCCESS') {
        order.payment.status = 'paid';
        order.payment.transactionId = tradeNo || outTradeNo;
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
        await order.save();

        const user = await User.findById(order.user);
        if (user?.email) {
          sendOrderConfirmation(user.email, order._id.toString(), order.totalAmount);
        }
      } else {
        order.payment.status = 'failed';
        await order.save();
      }
    }

    res.status(200).json({ code: '0', msg: 'success' });
  } catch (error) {
    console.error('Telebirr callback error:', error);
    res.status(200).json({ code: '0', msg: 'success' });
  }
};

export const cbeBirrCallback = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    console.log('CBE Birr Callback:', JSON.stringify(req.body, null, 2));
    
    const { referenceId, status, transactionId } = req.body;

    const order = await Order.findOne({ 'payment.transactionId': referenceId });

    if (order) {
      if (status === 'SUCCESS') {
        order.payment.status = 'paid';
        order.payment.transactionId = transactionId || referenceId;
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
        await order.save();

        const user = await User.findById(order.user);
        if (user?.email) {
          sendOrderConfirmation(user.email, order._id.toString(), order.totalAmount);
        }
      } else {
        order.payment.status = 'failed';
        await order.save();
      }
    }

    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('CBE Birr callback error:', error);
    res.status(200).json({ status: 'OK' });
  }
};

export const checkPaymentStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) throw createError('Order not found', 404);

    // Query payment status from provider
    if (order.payment.status === 'pending' && order.payment.transactionId) {
      if (order.payment.method === 'mpesa') {
        const result = await mpesaEthiopiaService.queryTransaction(order.payment.transactionId);
        if (result.status === 'paid') {
          order.payment.status = 'paid';
          order.payment.paidAt = new Date();
          order.status = 'confirmed';
          await order.save();
        }
      } else if (order.payment.method === 'telebirr') {
        const result = await telebirrService.verifyPayment(order.payment.transactionId);
        if (result.status === 'paid') {
          order.payment.status = 'paid';
          order.payment.paidAt = new Date();
          order.status = 'confirmed';
          await order.save();
        }
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        paymentStatus: order.payment.status,
        orderStatus: order.status,
        method: order.payment.method,
      },
    });
  } catch (error) {
    next(error);
  }
};
