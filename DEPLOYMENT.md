# 🚀 NextPlate: Deployment Guide

> **"The best code is code that helps someone."** — *NextPlate Philosophy*

This guide outlines how to deploy the NextPlate ecosystem to production environments.

## 🛠️ Infrastructure Requirements

1. **Database**: MongoDB Atlas (Dedicated Cluster recommended)
2. **Compute**: Render, Vercel, or AWS ECS/Fargate
3. **AI Provider**: Google Gemini (Vertex AI or Google AI Studio)
4. **Cloud Media**: Cloudflare R2 or AWS S3
5. **Messaging**: Firebase Cloud Messaging (FCM)
6. **Communications**: SendGrid (Email) & Twilio (SMS/WhatsApp)
7. **Payments**: Razorpay

---

## 🏗️ Deployment Strategies

### A. 🐳 Docker Compose (Universal/Local)
The fastest way to spin up the entire grid.

```bash
# Clone the repository
git clone https://github.com/urjitupadhya/Restraunt_Charity.git
cd Restraunt_Charity

# Configure secrets in .env files (backend/.env, dashboard/.env)

# Launch the ecosystem
docker-compose up -d --build
```

### B. 🌉 Backend Deployment (Render / AWS)
1. **Source**: Point to the `backend/` directory.
2. **Runtime**: Node.js 18+.
3. **Environment Variables**:
   - `MONGODB_URI`: Your Atlas connection string.
   - `JWT_ACCESS_SECRET`: Secure 256-bit key.
   - `GEMINI_API_KEY_POOL`: Comma-separated list of Gemini API keys.
   - `ALLOWED_ORIGINS`: Your frontend production URL.
4. **Start Command**: `npm start`.

### C. 📟 Frontend Deployment (Vercel)
1. **Source**: Point to the `dashboard/` directory.
2. **Framework**: Next.js.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL.
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: For OAuth.
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your payment key.
4. **Build Command**: `npm run build`.

---

## 📡 Health Checks & Monitoring

- **API Health**: `GET /api/v1/health` (should return `{ status: "up" }`).
- **Log Streaming**: Use `npm run logs` (Winston-powered) to monitor grid alerts.
- **CLI Monitoring**: Use `nplate status` from any terminal to check grid synchronization.

## 🛡️ Security Protocol

1. **Rate Limiting**: Enabled by default (100 req/15min). Scale as needed in `env.js`.
2. **Data Sanitization**: NoSQL injection and XSS protection active via `express-mongo-sanitize` and `xss-clean`.
3. **Audit Logging**: Every rescue mission is cryptographically logged and stored.

---
*NextPlate — Powering the Future of Food Security.*
