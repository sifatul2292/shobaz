// Copy this file to config.js and fill in your values.
// config.js is git-ignored — never commit real credentials.
module.exports = {
  // Your VPS API base URL (no trailing slash)
  //   'https://api.shobaz.com/api'  |  'http://YOUR_VPS_IP:4000/api'
  API_BASE_URL: 'https://api.shobaz.com/api',

  // Admin login credentials (username, NOT email)
  ADMIN_USERNAME: 'your_admin_username',
  ADMIN_PASSWORD: 'your_admin_password',

  // The Excel file to read (relative to this folder)
  EXCEL_FILE: './products.xlsx',

  // Sheet name inside the Excel file
  SHEET_NAME: 'Products',
};
