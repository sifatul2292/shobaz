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

  // SSL PAYMENT CREDENTIALS - Add your own
  STORE_ID: 'your_store_id',
  STORE_PASSWORD: 'your_store_password',

  // CDN Api
  cdnUrlBase:
    process.env.PRODUCTION_BUILD === 'true'
      ? 'https://api.yourdomain.com'
      : 'http://localhost:4000',

  // Gmail Api - Add your own
  gmail: 'your-email@gmail.com',
  googleClientId1: 'your_client_id',
  googleClientSecret1: 'your_client_secret',
  googleClientRedirectUrl: 'https://developers.google.com/oauthplayground',
  googleRefreshToken1: 'your_refresh_token',

  // iSMS SSL - Add your own
  api_token: 'your_api_token',
  sid: 'your_sid',
  SSL_SMS_API: 'https://smsplus.sslwireless.com/api/v3/send-sms',

  promoOfferSchedule: 'Promo_Offer_Schedule',
  promoOfferScheduleOnStart: 'Promo_Offer_Schedule_On_Start',
  promoOfferScheduleOnEnd: 'Promo_Offer_Schedule_On_End',
  
  // SMS Settings - Add your own
  smsSenderUsername: 'your_username',
  smsSenderSecret: 'your_secret',
  smsSenderPassword: 'your_password',
  smsSenderId: 'your_id',

  // Database Admin - Add your own
  dbAdminUsername: 'your_username',
  dbAdminPassword: 'your_password',
  backupDB: process.env.DB_NAME,
  backupPath: './backup/db',
  restorePath: `./restore/${process.env.DB_NAME}`,

  // Back Up Config - Add your own
  driveFolder: 'your_google_drive_folder_id',
  
  // Google Oauth2 Config - Add your own
  googleRedirectUrl: 'https://developers.google.com/oauthplayground',
  googleClientId: 'your_client_id',
  googleClientSecret: 'your_client_secret',
  googleRefreshToken: 'your_refresh_token',
  accountGmail: 'your-email@gmail.com',
});