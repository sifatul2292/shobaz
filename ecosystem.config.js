module.exports = {
  apps: [
    {
      name: 'shobaz-backend',
      script: './backend/dist/main.js',
      cwd: '/var/www/shobaz',
      instances: 'max',          // use all available CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '/var/log/pm2/shobaz-backend-error.log',
      out_file: '/var/log/pm2/shobaz-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'shobaz-frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3003',
      cwd: '/var/www/shobaz/frontend',
      instances: 1,              // Next.js manages its own internal threading
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      error_file: '/var/log/pm2/shobaz-frontend-error.log',
      out_file: '/var/log/pm2/shobaz-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
