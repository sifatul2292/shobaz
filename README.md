# Shobaz - E-Commerce Platform

A modern e-commerce platform for books and publications built with Next.js and NestJS.

---

## 📋 Project Details

- **Project Name**: Shobaz
- **Description**: E-commerce platform for selling books online with features like product browsing, shopping cart, checkout, order management, and admin dashboard.
- **Target Users**: Book buyers, bookstore owners, publishers

---

## 🛠 Software Stack

### Frontend
- **Framework**: Next.js 16.2.3
- **UI Library**: React 19.2.4
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: React Icons
- **Carousel**: Swiper

### Backend
- **Framework**: NestJS
- **Database**: MongoDB
- **Authentication**: JWT (Passport)
- **Payment Gateway**: SSL Commercial

### DevOps
- **Process Manager**: PM2
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Git**: GitHub

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x
- MongoDB
- npm or yarn

### Local Development

**1. Clone the repository:**
```bash
git clone https://github.com/sifatul2292/shobaz.git
cd shobaz
```

**2. Backend Setup:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration

npm install
npm run build
npm run start:prod
# Backend runs on http://localhost:3001
```

**3. Frontend Setup:**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your API URL

npm install
npm run build
npm run start
# Frontend runs on http://localhost:3000
```

**4. Development Mode:**
```bash
# Backend
cd backend
npm run start:dev

# Frontend (new terminal)
cd frontend
npm run dev
```

---

## 📁 Project Structure

```
shobaz/
├── backend/           # NestJS backend
│   ├── src/
│   │   ├── config/    # Configuration
│   │   ├── pages/     # API routes
│   │   ├── schema/    # MongoDB schemas
│   │   └── shared/    # Shared services
│   └── .env.example   # Backend env template
│
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/       # Next.js pages
│   │   ├── components/# React components
│   │   └── lib/      # Utilities
│   └── .env.example  # Frontend env template
│
├── deploy-shobaz.sh  # Deployment script
└── .gitignore        # Git ignore rules
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
PRODUCTION_BUILD=true
DB_PORT=27017
DB_NAME=shobaz
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
JWT_PRIVATE_KEY_USER=your_jwt_secret
JWT_PRIVATE_KEY_ADMIN=your_admin_jwt_secret
STORE_ID=your_ssl_store_id
STORE_PASSWORD=your_ssl_password
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🌐 Deployment (VPS)

### Using the Deployment Script

**1. Copy script to VPS:**
```bash
scp deploy-shobaz.sh user@your-vps-ip:/tmp/
```

**2. SSH and run:**
```bash
ssh user@your-vps-ip
sudo bash /tmp/deploy-shobaz.sh
```

**3. Update these values in the script:**
```bash
DOMAIN="your-actual-domain.com"
EMAIL="your-email@example.com"
```

### Manual Deployment

**1. Clone and setup:**
```bash
cd /var/www
git clone https://github.com/sifatul2292/shobaz.git
cd shobaz/backend
cp .env.example .env
# Configure .env

npm install
npm run build
pm2 start dist/main.js --name shobaz-backend
```

**2. Frontend:**
```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run build
pm2 start npm --name shobaz-frontend -- run start
```

**3. Nginx configuration** - Point domain to port 3000

---

## 🔐 API Endpoints

### Backend runs on port 3001

- `/api/*` - Public API routes
- Authentication required for: cart, checkout, orders, profile

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to GitHub
5. Deploy to VPS

---

## 📄 License

Private - All rights reserved

---

## 👤 Author

Sifatul Alam Shohan

---

## 🔗 Links

- GitHub: https://github.com/sifatul2292/shobaz
- Issues: https://github.com/sifatul2292/shobaz/issues