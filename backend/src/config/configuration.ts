import * as process from 'node:process';

export default () => ({
  productionBuild: process.env.PRODUCTION_BUILD === 'true',
  hostname: `http://localhost:${process.env.PORT || 3000}`,
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoCluster:
    process.env.PRODUCTION_BUILD === 'true'
      ? `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@127.0.0.1:${process.env.DB_PORT}/${process.env.DB_NAME}?authSource=${process.env.AUTH_SOURCE}`
      : `mongodb://127.0.0.1:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  userJwtSecret: process.env.JWT_PRIVATE_KEY_USER,
  adminJwtSecret: process.env.JWT_PRIVATE_KEY_ADMIN,
  userTokenExpiredTime: 604800,
  adminTokenExpiredTime: 604800,

  STORE_ID: process.env.STORE_ID || 'your_store_id',
  STORE_PASSWORD: process.env.STORE_PASSWORD || 'your_store_password',

  cdnUrlBase:
    process.env.PRODUCTION_BUILD === 'true'
      ? 'https://api.shobaz.com'
      : 'http://localhost:4000',

  gmail: process.env.GMAIL || 'your-email@gmail.com',
  googleClientId1: process.env.GOOGLE_CLIENT_ID_1 || 'your_client_id',
  googleClientSecret1: process.env.GOOGLE_CLIENT_SECRET_1 || 'your_client_secret',
  googleClientRedirectUrl: 'https://developers.google.com/oauthplayground',
  googleRefreshToken1: process.env.GOOGLE_REFRESH_TOKEN_1 || 'your_refresh_token',

  api_token: process.env.SMS_API_TOKEN || 'your_api_token',
  sid: process.env.SMS_SID || 'your_sid',
  SSL_SMS_API: 'https://smsplus.sslwireless.com/api/v3/send-sms',

  promoOfferSchedule: 'Promo_Offer_Schedule',
  promoOfferScheduleOnStart: 'Promo_Offer_Schedule_On_Start',
  promoOfferScheduleOnEnd: 'Promo_Offer_Schedule_On_End',
  
  smsSenderUsername: process.env.SMS_USERNAME || 'your_username',
  smsSenderSecret: process.env.SMS_SECRET || 'your_secret',
  smsSenderPassword: process.env.SMS_PASSWORD || 'your_password',
  smsSenderId: process.env.SMS_ID || 'your_id',

  dbAdminUsername: process.env.DB_ADMIN_USER || 'your_username',
  dbAdminPassword: process.env.DB_ADMIN_PASS || 'your_password',
  backupDB: process.env.DB_NAME,
  backupPath: './backup/db',
  restorePath: `./restore/${process.env.DB_NAME}`,

  driveFolder: process.env.DRIVE_FOLDER_ID || 'your_google_drive_folder_id',
  
  googleRedirectUrl: 'https://developers.google.com/oauthplayground',
  googleClientId: process.env.GOOGLE_CLIENT_ID || 'your_client_id',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_client_secret',
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || 'your_refresh_token',
  accountGmail: process.env.ACCOUNT_GMAIL || 'your-email@gmail.com',
  fraudspyApiKey: process.env.FRAUDSPY_API_KEY || '',
});