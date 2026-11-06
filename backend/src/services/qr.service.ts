import crypto from 'crypto';
import QRCode from 'qrcode';
import { env } from '../config/env';

export const generateSecureQRToken = (): string => {
  return crypto.randomBytes(18).toString('hex');
};

export const generateTableQRCodeDataUrl = async (qrToken: string): Promise<string> => {
  const scanUrl = `${env.frontendUrl}/table/${qrToken}`;
  return await QRCode.toDataURL(scanUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  });
};

export const generateTableQRCodeSVG = async (qrToken: string): Promise<string> => {
  const scanUrl = `${env.frontendUrl}/table/${qrToken}`;
  return await QRCode.toString(scanUrl, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  });
};

