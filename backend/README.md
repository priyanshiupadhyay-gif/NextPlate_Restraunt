# 🌐 NextPlate Backend: Powering Food Rescue

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com)

The NextPlate Backend is a robust, scalable Node.js API designed to support a high-end food rescue marketplace. It handles complex operations ranging from artisanal restaurant management and real-time order tracking to secure payments and automated waste-reduction metrics.

---

## 🚀 Key Features

### 🔐 Secure Authentication
- **Multi-Factor Auth**: Support for Email OTP via Twilio/SendGrid.
- **OAuth 2.0 Integration**: Seamless login with Google and Apple.
- **JWT-based Security**: Stateless authentication with short-lived access tokens and secure rotation for refresh tokens.

### 🍱 Restaurant & Menu Management
- **Artisanal Profiles**: Detailed management of restaurant identities, operating hours, and sustainability tags.
- **Dynamic Menu Sourcing**: Real-time availability tracking for surplus items with automated expiry handling.
- **Change Request System**: Controlled updates for restaurant profiles ensuring brand consistency.

### 🛒 High-Performance Ordering
- **Checkout Engine**: Secure cart management and order placement logic.
- **QR Code Verification**: Automated QR generation for secure order pickups at restaurant locations.
- **Order Tracking**: Comprehensive lifecycle management from placement to completion.

### 🛡️ Enterprise-Grade Infrastructure
- **Security First**: Implements `helmet`, `hpp`, and `rate-limit` for DDoS and common attack protection.
- **Comprehensive Logging**: Centralized logging using `winston` for error tracking and system health monitoring.
- **Swagger Documentation**: Interactive API explorer for developer-friendly integration.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Runtime** | Node.js (>= 18.0.0) |
| **Web Framework** | Express.js |
| **Database** | MongoDB (via Mongoose) |
| **Authentication** | JWT, Passport, Google/Apple Auth |
| **Messaging** | Twilio (WhatsApp/SMS), Nodemailer (SMTP) |
| **Security** | Helmet, HPP, CORS, Express Rate Limit |

---

## 📂 Project Structure

```text
src/
├── config/       # Environment & package configurations (Swagger, DB)
├── controllers/  # Request handlers for Auth, User, Restaurant, etc.
├── middlewares/  # Security, Validation, and Error handling
├── models/       # Mongoose schemas (User, Restaurant, MenuItem, Order)
├── routes/       # API route definitions
├── services/     # core business logic (Email, QR, Payment services)
└── utils/        # Shared helpers (Logger, API Error classes)
```

---

## 🚀 Setup & Installation

### 1. Environment Configuration
Create a `.env` file in the root directory based on `.env.example` (or the provided template):
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_secret
TWILIO_ACCOUNT_SID=your_sid
SENDGRID_API_KEY=your_key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Seed Sample Data
Populate the database with curated artisanal restaurants:
```bash
node scripts/seed.js
```

---

## 📖 API Documentation
Once the server is running, explore the interactive Swagger documentation at:
`http://localhost:5000/api-docs`

---

## 🌿 Sustainability Mission
Every line of code in this backend is optimized to ensure that no good food goes to waste. We are committed to an artisanal, zero-waste future.

**Built for the community, by the community.**
