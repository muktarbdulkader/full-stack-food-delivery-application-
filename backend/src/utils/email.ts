import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"FoodHub" <${env.smtpUser}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error);
  }
};

export const sendOrderConfirmation = async (email: string, orderId: string, total: number) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🍔 FoodHub</h1>
      </div>
      <div style="padding: 30px; background: #fff;">
        <h2 style="color: #333;">Order Confirmed! ✅</h2>
        <p>Thank you for your order!</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
          <p><strong>Total:</strong> ${total.toFixed(0)} ETB</p>
        </div>
        <p>We're preparing your delicious food and will notify you when it's on the way!</p>
      </div>
      <div style="background: #333; color: #fff; padding: 15px; text-align: center;">
        <p style="margin: 0;">© 2026 FoodHub. Delicious Delivered.</p>
      </div>
    </div>
  `;
  await sendEmail(email, 'Order Confirmed - FoodHub', html);
};

export const sendOrderStatusUpdate = async (email: string, orderId: string, status: string) => {
  const statusMessages: Record<string, string> = {
    confirmed: '✅ Your order has been confirmed!',
    preparing: '👨‍🍳 Your food is being prepared!',
    out_for_delivery: '🚗 Your order is on the way!',
    delivered: '🎉 Your order has been delivered!',
    cancelled: '❌ Your order has been cancelled.',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f97316, #ef4444); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🍔 FoodHub</h1>
      </div>
      <div style="padding: 30px; background: #fff;">
        <h2 style="color: #333;">Order Update</h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order ID:</strong> #${orderId.slice(-8).toUpperCase()}</p>
          <p style="font-size: 18px;">${statusMessages[status] || status}</p>
        </div>
      </div>
    </div>
  `;
  await sendEmail(email, `Order Update - FoodHub`, html);
};
