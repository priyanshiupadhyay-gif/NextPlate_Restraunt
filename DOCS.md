# 📖 NextPlate — Technical Documentation

> Comprehensive technical reference for the AI-Powered Zero Waste Food Redistribution Network.
> This document covers system design, data models, service architecture, AI integration, and deployment.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Database Schema](#3-database-schema)
4. [API Architecture](#4-api-architecture)
5. [AI Engine Deep Dive](#5-ai-engine-deep-dive)
6. [Real-Time Communication](#6-real-time-communication)
7. [Notification System](#7-notification-system)
8. [Payment Integration](#8-payment-integration)
9. [Carbon Tracking Engine](#9-carbon-tracking-engine)
10. [Background Services](#10-background-services)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Security Implementation](#12-security-implementation)
13. [Deployment Guide](#13-deployment-guide)
14. [Environment Variables Reference](#14-environment-variables-reference)

---

## 1. System Overview

### 1.1 High-Level Architecture

NextPlate follows a **3-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION TIER                          │
│                                                                 │
│  Next.js 16 (React 19)  │  40+ Pages  │  4 Role-Based Views   │
│  Contexts: Auth + Socket + i18n + Theme                         │
│  Components: Framer Motion + Recharts + Radix UI               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼─────────────────────────────────────┐
│                       APPLICATION TIER                           │
│                                                                 │
│  Express.js Server  │  20 Route Files  │  18 Controllers        │
│  Middleware: JWT Auth + Rate Limit + CORS + Helmet              │
│  Services: 12 Business Logic Modules                            │
│  WebSocket: Socket.IO Server                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                         DATA TIER                                │
│                                                                 │
│  MongoDB Atlas  │  Gemini AI  │  Firebase FCM  │  SendGrid     │
│  Twilio         │  Razorpay   │  Cloudflare R2 │               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Role-Based Access Control

| Role | Code | Access Level | Dashboard |
|------|------|-------------|-----------|
| **Customer** | `user` | Browse, order, sponsor, review | `/feed` |
| **Restaurant** | `restaurant` | List surplus, manage orders, earnings | `/restaurant` |
| **NGO** | `ngo` | Rescue, audit, recipe alchemist, community | `/ngo` |
| **Admin** | `admin` | Full platform control, analytics | `/admin` |

### 1.3 Request Flow

```
User Action → Next.js Page → API Call (Axios) → Express Router
    → Middleware (auth, validate) → Controller → Service → Database
    → Response → Frontend State Update → UI Re-render
```

---

## 2. Authentication & Authorization

### 2.1 Token Architecture

```
┌──────────────────────────────────────────────────┐
│                JWT TOKEN FLOW                     │
│                                                  │
│  Login ──→ Access Token (15 min)                 │
│        └─→ Refresh Token (7 days)                │
│                                                  │
│  Protected Route ──→ Access Token in Header      │
│      Authorization: Bearer <access_token>        │
│                                                  │
│  Token Expired? ──→ POST /auth/refresh           │
│      Body: { refreshToken: <refresh_token> }     │
│      Response: { newAccessToken, newRefreshToken }│
└──────────────────────────────────────────────────┘
```

### 2.2 Auth Strategies

| Strategy | Endpoint | Flow |
|----------|----------|------|
| **Email + Password** | `POST /auth/register` → `GET /auth/verify-email` → `POST /auth/login` | Traditional registration with email verification |
| **Google OAuth** | `POST /auth/google` (with `idToken`) | Google Sign-In, auto-creates account if new |
| **Apple Sign-In** | `POST /auth/apple` (with `identityToken`) | Apple ID integration |
| **Email OTP** | `POST /auth/email/send-otp` → `POST /auth/email/verify-otp` | Passwordless login via 6-digit code |
| **WhatsApp OTP** | `POST /auth/whatsapp/send-otp` → `POST /auth/whatsapp/verify-otp` | Phone verification via Twilio |
| **Password Reset** | `POST /auth/forgot-password` → `POST /auth/reset-password` | Secure token-based reset |

### 2.3 NGO Trust Tiers

NGOs progress through a trust system:

```
Tier 1: Self-Declared
  └── Sign up + agree to terms → 5 claims/week cap
      │
Tier 2: Document-Verified
  └── Upload registration certificate → Admin approves → Cap removed
      │
Tier 3: Root Access (Earned)
  └── Tier 2 + 10 successful rescues + positive ratings → Full Access
```

### 2.4 Middleware Stack

```javascript
// Applied to protected routes
router.use(protect)          // JWT verification
router.use(authorize('admin', 'restaurant'))  // Role check

// Applied to public routes
router.use(rateLimiter)      // 100 req / 15 min per IP
router.use(validate)         // express-validator checks
```

---

## 3. Database Schema

### 3.1 User Model

```javascript
User {
  fullName:        String (req, indexed)
  email:           String (req, unique, indexed)
  password:        String (hashed with bcrypt, select: false)
  phoneNumber:     String
  role:            Enum['user', 'restaurant', 'ngo', 'admin']
  avatarUrl:       String

  // OAuth
  googleId:        String
  appleId:         String

  // NGO-specific
  ngoName:         String
  ngoRegistration: String
  ngoDocuments:    [String]
  ngoTier:         Enum['self-declared', 'document-verified', 'root-access']
  ngoVerified:     Boolean
  ngoRescueCount:  Number

  // Email Verification
  isVerified:      Boolean
  verificationToken: String
  verificationOTP:   String

  // Password Reset
  passwordResetToken:   String (SHA-256 hashed)
  passwordResetExpires: Date (30 min TTL)

  // Preferences
  preferences:     {
    dietary:       [String]
    maxDistance:    Number (km)
    darkMode:      Boolean
    language:      String
    notifications: { push, email, sms: Boolean }
  }

  // Impact
  impactMetrics:   {
    totalMealsRescued:    Number
    totalCarbonSaved:     Number (kg CO₂e)
    totalWaterSaved:      Number (liters)
    totalMoneySaved:      Number
    greenScore:           Number
    badges:               [String]
    currentStreak:        Number
  }

  // FCM
  fcmToken:        String
  fcmTokens:       [{ token, deviceInfo, timestamp }]
}
```

### 3.2 Restaurant Model

```javascript
Restaurant {
  name:           String
  owner:          ObjectId → User
  description:    String
  location:       {
    type:         'Point'
    coordinates:  [lng, lat]    // GeoJSON (2dsphere indexed)
    address:      String
    city:         String
    state:        String
  }
  contact:        { phone, email, website }
  cuisine:        [String]
  operatingHours: { open, close }
  isVerified:     Boolean
  isActive:       Boolean
  rating:         { average, count }
  certifications: [String]
  images:         [String]
}
```

### 3.3 MenuItem Model

```javascript
MenuItem {
  name:              String
  description:       String
  restaurant:        ObjectId → Restaurant
  category:          Enum['prepared', 'raw', 'bakery', 'beverages', ...]
  originalPrice:     Number
  discountedPrice:   Number
  quantity:          Number
  unit:              Enum['portions', 'kg', 'liters', 'pieces']
  images:            [String]
  allergens:         [String]
  dietary:           [String] ('veg', 'non-veg', 'vegan', 'gluten-free')

  // Timing
  expectedReadyTime: Date
  expiryTime:        Date
  pickupWindow:      { start, end: Date }

  // Carbon
  weight:            Number (kg)
  carbonCategory:    Enum['meat', 'dairy', 'bread', 'vegetables', 'fruit', 'grains']
  carbonSaved:       Number (auto-calculated)

  // State
  isAvailable:       Boolean
  isClaimed:         Boolean
  isExpired:         Boolean
  isForecast:        Boolean
}
```

### 3.4 Order Model

```javascript
Order {
  orderNumber:       String (unique, 'SP-XXXXX')
  customerId:        ObjectId → User
  restaurantId:      ObjectId → Restaurant
  items:             [{
    menuItem:        ObjectId → MenuItem
    name:            String
    quantity:        Number
    originalPrice:   Number
    discountedPrice: Number
    itemTotal:       Number
  }]
  totalAmount:       Number
  totalItems:        Number
  totalCarbonSaved:  Number

  orderType:         Enum['pickup', 'ngo_claim', 'ghost_meal']
  orderStatus:       Enum['placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
  paymentMethod:     Enum['razorpay', 'cash', 'platform_credit']
  paymentStatus:     Enum['pending', 'paid', 'refunded']

  razorpayOrderId:   String
  razorpayPaymentId: String
  qrCode:            String
  qrVerified:        Boolean

  // Ghost Meal
  isGhostMeal:       Boolean
  sponsorMessage:    String
  sponsorId:         ObjectId → User

  pickupDetails:     {
    scheduledTime:   Date
    actualTime:      Date
    verifiedBy:      String
  }
}
```

### 3.5 Additional Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Notification** | FCM & in-app notifications | `userId`, `title`, `body`, `type`, `isRead`, `data` |
| **OTP** | Email/phone verification codes | `identifier`, `code`, `type`, `expiresAt` |
| **ChangeRequest** | Restaurant profile update approvals | `restaurantId`, `changes`, `status`, `reviewedBy` |
| **Image** | Upload metadata | `url`, `uploadedBy`, `resourceType` |

---

## 4. API Architecture

### 4.1 Route Organization

```
/api/v1/
├── auth/              # Authentication (11 endpoints)
├── menu/              # Menu items CRUD (8 endpoints)
├── orders/            # Order management (6 endpoints)
├── restaurants/       # Restaurant profiles (5 endpoints)
├── users/             # User profiles, reviews (4 endpoints)
├── admin/             # Admin operations (8 endpoints)
├── ngo/               # NGO-specific (3 endpoints)
├── payments/          # Razorpay integration (4 endpoints)
├── uploads/           # Image upload (2 endpoints)
├── fcm/               # Push notifications (4 endpoints)
├── notifications/     # In-app notifications (3 endpoints)
├── chat/              # Stitch AI chat (2 endpoints)
├── recommendations/   # AI recommendations (1 endpoint)
├── ai/                # AI features (5 endpoints)
├── reports/           # CSR reports (3 endpoints)
├── recipe-alchemist/  # Recipe synthesis (1 endpoint)
├── rescue-audit/      # Photo verification (1 endpoint)
├── impact/            # Impact stats (3 endpoints)
├── dashboard/         # Restaurant dashboard data (2 endpoints)
└── stitch-insights/   # Predictive analytics (1 endpoint)
```

### 4.2 Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 4.3 Error Handling

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

---

## 5. AI Engine Deep Dive

### 5.1 Multi-Key Pool Architecture

```javascript
// geminiService.js — Key Management
const KEY_POOLS = {
  chat:      process.env.GEMINI_API_KEY_CHAT,
  analytics: process.env.GEMINI_API_KEY_ANALYTICS,
  vision:    process.env.GEMINI_API_KEY_VISION,
};

// Each task type maps to a specific key pool
const TASK_KEY_MAP = {
  'stitch-chat':    'chat',
  'recommendations': 'analytics',
  'rescue-strategy': 'analytics',
  'stitch-vision':  'vision',
  'recipe-alchemy': 'vision',
  'rescue-audit':   'vision',
  'csr-report':     'analytics',
  'daily-summary':  'analytics',
  'predict-surplus': 'analytics',
  'route-optimizer': 'analytics',
  'meal-plans':      'analytics',
};
```

### 5.2 Retry & Fallback Chain

```
Request → gemini-2.0-flash
    ├── Success → Return response
    └── 429 (Rate Limited)
        └── Wait 2s → Retry gemini-2.0-flash
            ├── Success → Return
            └── Quota Exhausted
                └── gemini-2.0-flash-lite
                    ├── Success → Return
                    └── Also Exhausted
                        └── Deterministic Fallback
                            (hardcoded intelligent defaults)
```

### 5.3 Prompt Engineering Highlights

**Stitch Vision (Photo → Listing):**
```
Analyze this food photo and return JSON:
{
  "name": "detected food name",
  "category": "prepared|raw|bakery|beverages|dairy",
  "estimatedWeight": "weight in kg",
  "suggestedPrice": "price in USD",
  "allergens": ["list"],
  "dietary": ["veg|non-veg|vegan"],
  "description": "appetizing 2-line description"
}
```

**Recipe Alchemist:**
```
You are a community kitchen chef. Given these donated ingredients:
{items}
Create a recipe for {servings} servings. Return JSON with:
recipeName, description, prepTime, cookTime, servings,
ingredients (mark donated ones), steps, nutritionPerServing,
chefTips, wasteReduction advice.
```

**Rescue Audit:**
```
Analyze this food handover photo for quality verification:
- Is the food properly packaged?
- Does the quantity match the expected amount?
- Are there any safety concerns?
Return: { verdict: APPROVED|FLAGGED|REJECTED, confidence, issues[] }
```

---

## 6. Real-Time Communication

### 6.1 Socket.IO Setup

```javascript
// server.js
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.on('connection', (socket) => {
  // Join user-specific room
  socket.on('authenticate', (userId) => {
    socket.join(`user:${userId}`);
  });

  // Join city feed
  socket.on('join-city', (city) => {
    socket.join(`city:${city}`);
  });

  // Track specific order
  socket.on('track-order', (orderId) => {
    socket.join(`order:${orderId}`);
  });
});
```

### 6.2 Event Types

| Event | Direction | Payload |
|-------|-----------|---------|
| `order:statusUpdate` | Server → Client | `{ orderId, newStatus, timestamp }` |
| `surplus:new` | Server → Client (city room) | `{ menuItem, restaurant, distance }` |
| `rescue:audit` | Server → Client (NGO) | `{ auditId, verdict, confidence }` |
| `price:drop` | Server → Client | `{ menuItemId, oldPrice, newPrice }` |

### 6.3 Frontend Context

```typescript
// contexts/socket-context.tsx
const SocketContext = createContext<{
  socket: Socket | null;
  isConnected: boolean;
}>();

// Auto-connects on login, disconnects on logout
// Listens for events and shows toast notifications via sonner
```

---

## 7. Notification System

### 7.1 Multi-Channel Architecture

```
Notification Event
    ├── In-App (MongoDB + Socket.IO)
    ├── Push (Firebase FCM)
    ├── Email (SendGrid / SMTP)
    └── SMS/WhatsApp (Twilio)
```

### 7.2 Echo Notifications (Price-Drop Alerts)

The Echo service runs every 5 minutes and sends personalized alerts:

```
For each user with notifications enabled:
  1. Find items they've viewed/saved
  2. Check if any prices dropped
  3. Send push notification: "🔔 Price dropped on Margherita Pizza! Now $3.50 (was $5.00)"
```

### 7.3 Email Templates

All 4 email templates use inline CSS for maximum email client compatibility:

| Template | SendGrid Subject | Design System |
|----------|-----------------|---------------|
| Password Reset | 🔐 Reset Your NextPlate Password | Dark header (#1C1207) with orange CTA |
| Order Confirmation | ✅ Order Confirmed | Green header with itemized receipt |
| Welcome | 🎉 Welcome to NextPlate! | Orange header with 3-column features |
| Weekly Digest | 📊 Your Weekly Impact Report | Purple header with stat cards |

---

## 8. Payment Integration

### 8.1 Razorpay Flow

```
1. Customer clicks "Pay" → POST /payments/create-order
   → Backend creates Razorpay order → Returns order_id

2. Frontend opens Razorpay checkout modal
   → Customer pays → Razorpay returns payment_id + signature

3. POST /payments/verify
   → Backend verifies HMAC signature
   → Updates order.paymentStatus = 'paid'
   → Sends order confirmation email
```

### 8.2 Ghost Meal Payments

Ghost Meals follow the same payment flow, but:
- `order.isGhostMeal = true`
- `order.sponsorId = paying user`
- `order.orderType = 'ghost_meal'`
- NGO receives notification to claim

---

## 9. Carbon Tracking Engine

### 9.1 WRAP Methodology

Based on the Waste & Resources Action Programme standards:

```javascript
// Carbon calculation (per meal)
function calculateCarbonSaved(weightKg, category) {
  const factors = {
    meat: 27.0,      // kg CO₂e per kg
    dairy: 3.2,
    bread: 0.9,
    vegetables: 0.5,
    fruit: 0.4,
    grains: 0.8,
    prepared: 3.5,   // average mixed meal
    beverages: 0.3,
  };

  const carbonSaved = weightKg * (factors[category] || 3.5);
  const waterSaved = weightKg * 1000; // 1kg ≈ 1000L embedded water

  return { carbonSaved, waterSaved };
}
```

### 9.2 Impact Aggregation

```
User Level:     impactMetrics (embedded in User document)
Restaurant:     Aggregated from MenuItem.carbonSaved
Platform:       GET /impact/global → sum of all orders
CSR Report:     AI-narrated based on aggregated data
```

---

## 10. Background Services

| Service | File | Schedule | Description |
|---------|------|----------|-------------|
| **Expiry Notifier** | `expiryNotifier.js` | Every 15 min | Scans `MenuItem` for items expiring within 30 min, sends alerts |
| **Adaptive Pricing** | `adaptivePricingService.js` | Every 15 min | Increases discounts: 45→55→65→70% as expiry approaches |
| **Daily Summary** | `dailySummaryService.js` | Every 3 hours | AI-generated platform health narrative |
| **Echo Alerts** | `echoNotificationService.js` | Every 5 min | Price-drop notifications to interested users |

---

## 11. Frontend Architecture

### 11.1 Context Providers

```
<AuthProvider>                 # Manages login state, token refresh
  <GlobalProviders>            # Wraps all global functionality
    <ThemeProvider>             # Light/Dark mode (next-themes)
      <I18nProvider>            # Multi-language (EN/ES/FR/HI)
        <SocketProvider>        # Real-time WebSocket connection
          {children}
          <StitchChat />       # Floating AI chat widget
          <EchoListener />     # Price-drop listener
          <PWAInstallPrompt /> # Progressive Web App installer
        </SocketProvider>
      </I18nProvider>
    </ThemeProvider>
  </GlobalProviders>
</AuthProvider>
```

### 11.2 Page Structure

| Route | Role | Description |
|-------|------|-------------|
| `/login` | Public | Split-screen login with carousel |
| `/register` | Public | Multi-step registration |
| `/forgot-password` | Public | Email entry for reset link |
| `/reset-password/[token]` | Public | New password form |
| `/feed` | User | Surplus food marketplace |
| `/restaurant` | Restaurant | Dashboard with stats + charts |
| `/add-item` | Restaurant | Photo → AI auto-fill listing |
| `/manage-listings` | Restaurant | Active surplus CRUD |
| `/orders` | All | Order history and tracking |
| `/ai-rescue` | Restaurant/NGO | AI rescue strategy engine |
| `/rescue-audit` | NGO | Photo verification page |
| `/recipe-alchemist` | NGO/Restaurant | AI recipe synthesis |
| `/community` | All | Ghost meals + community fridges |
| `/live-map` | All | Real-time Leaflet map |
| `/impact-stats` | All | Personal/platform impact metrics |
| `/reviews` | User | Star rating system |
| `/settings` | All | Profile, preferences, notifications |
| `/admin` | Admin | Command center with charts |
| `/admin/approvals` | Admin | Restaurant verification queue |
| `/admin/restaurants` | Admin | Grid registry |
| `/admin/orders` | Admin | Order monitor + CSV export |
| `/admin/finance` | Admin | Platform revenue analytics |
| `/admin/payouts` | Admin | Commission and payout management |
| `/admin/refunds` | Admin | Dispute resolution |
| `/admin/reviews` | Admin | Review moderation |

### 11.3 Design System

```
Colors:
  Primary:     #1C1207 (Deep Espresso)
  Orange:      #EA580C → #F97316 (Action/CTA)
  Emerald:     #059669 → #10B981 (Positive)
  Background:  #FFF8F0 (Warm Cream)
  Dark Mode:   #0A0A0A

Typography:
  Display:     Font-display (headings, uppercase, tracked)
  Body:        Font-body (Inter/system)
  Mono:        Monospace (codes, IDs)

Border Radius:
  Cards:       28px → 48px (mega-rounded)
  Buttons:     12px → 24px
  Inputs:      16px → 20px

Shadows:
  Cards:       shadow-2xl shadow-[color]/5
  CTAs:        shadow-xl shadow-[color]/20
```

---

## 12. Security Implementation

| Layer | Implementation |
|-------|---------------|
| **Transport** | HTTPS enforced, secure cookies |
| **Authentication** | JWT with RS256 signing, 15-min access tokens |
| **Authorization** | Role-based middleware, resource ownership checks |
| **Input Validation** | express-validator on all 60+ endpoints |
| **Rate Limiting** | 100 req/15min per IP (express-rate-limit) |
| **Password** | bcrypt with 12 salt rounds |
| **Email** | Disposable email domain blocking (10K+ domains) |
| **Headers** | Helmet.js (CSP, HSTS, X-Frame, XSS filter) |
| **CORS** | Whitelist of frontend origins |
| **Reset Tokens** | SHA-256 hashed, 30-minute TTL |
| **OTP** | 6-digit, 10-minute expiry, max 3 attempts |

---

## 13. Deployment Guide

### 13.1 Backend (Render)

```yaml
# render.yaml
services:
  - type: web
    name: nextplate-api
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_ACCESS_SECRET
        sync: false
      # ... (see env reference below)
```

### 13.2 Frontend (Vercel)

```bash
# Automatic deployment from GitHub
# Settings:
#   Framework: Next.js
#   Root Directory: dashboard
#   Build Command: npm run build
#   Output: .next

# Environment Variables:
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 13.3 Database (MongoDB Atlas)

1. Create free M0 cluster
2. Add IP whitelist: `0.0.0.0/0` (for Render)
3. Create database user
4. Copy connection string to `MONGODB_URI`

---

## 14. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | ✅ | Server port | `5000` |
| `MONGODB_URI` | ✅ | MongoDB connection string | — |
| `JWT_ACCESS_SECRET` | ✅ | Access token signing key | — |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing key | — |
| `JWT_ACCESS_EXPIRY` | | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | | Refresh token TTL | `7d` |
| `GEMINI_API_KEY_CHAT` | ✅ | Gemini key for chat features | — |
| `GEMINI_API_KEY_ANALYTICS` | ✅ | Gemini key for analytics | — |
| `GEMINI_API_KEY_VISION` | ✅ | Gemini key for vision tasks | — |
| `FRONTEND_URL` | | Frontend origin for CORS | `http://localhost:3000` |
| `SENDGRID_API_KEY` | | SendGrid for emails | SMTP fallback |
| `EMAIL_FROM` | | Sender email address | — |
| `SMTP_HOST` | | SMTP server | — |
| `SMTP_PORT` | | SMTP port | — |
| `SMTP_USER` | | SMTP username | — |
| `SMTP_PASS` | | SMTP password | — |
| `TWILIO_ACCOUNT_SID` | | Twilio SID | — |
| `TWILIO_AUTH_TOKEN` | | Twilio auth token | — |
| `TWILIO_PHONE_NUMBER` | | Twilio phone number | — |
| `FIREBASE_PROJECT_ID` | | Firebase project | — |
| `RAZORPAY_KEY_ID` | | Razorpay key | Mock mode |
| `RAZORPAY_KEY_SECRET` | | Razorpay secret | Mock mode |
| `GOOGLE_CLIENT_ID` | | Google OAuth client | — |

### Frontend (`dashboard/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | | Google OAuth client ID |
| `NEXT_PUBLIC_SOCKET_URL` | | WebSocket server URL |

---

<p align="center">
  <strong>📖 This documentation covers the complete NextPlate system.</strong><br/>
  <em>For API testing, visit <code>/api-docs</code> (Swagger UI) on the running backend.</em>
</p>
