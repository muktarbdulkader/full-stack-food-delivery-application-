import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Admin secret code for registration
  adminSecretCode: process.env.ADMIN_SECRET_CODE || 'FOODHUB2024',
  
  // Email config
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  
  // M-Pesa Ethiopia (Safaricom Ethiopia)
  mpesaApiKey: process.env.MPESA_API_KEY || '',
  mpesaPublicKey: process.env.MPESA_PUBLIC_KEY || '',
  mpesaServiceProviderCode: process.env.MPESA_SERVICE_PROVIDER_CODE || '',
  
  // Telebirr (Ethio Telecom)
  telebirrAppId: process.env.TELEBIRR_APP_ID || '',
  telebirrAppKey: process.env.TELEBIRR_APP_KEY || '',
  telebirrShortCode: process.env.TELEBIRR_SHORT_CODE || '',
  telebirrApiUrl: process.env.TELEBIRR_API_URL || '',
  
  // CBE Birr (Commercial Bank of Ethiopia)
  cbeBirrMerchantId: process.env.CBEBIRR_MERCHANT_ID || '',
  cbeBirrApiKey: process.env.CBEBIRR_API_KEY || '',
  cbeBirrApiUrl: process.env.CBEBIRR_API_URL || '',
};
