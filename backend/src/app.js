require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');

const mongoSanitize = require('express-mongo-sanitize');
const xssSanitize = require('./middlewares/xssSanitize');
const { v4 } = require('uuid');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const restaurantDashRoutes = require('./routes/restaurantDashRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const impactRoutes = require('./routes/impactRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const fcmRoutes = require('./routes/fcmRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const dailySummaryRoutes = require('./routes/dailySummaryRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const rescueAuditRoutes = require('./routes/rescueAuditRoutes');
const reportRoutes = require('./routes/reportRoutes');
const recipeAlchemistRoutes = require('./routes/recipeAlchemistRoutes');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const app = express();

app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || v4();
    res.setHeader('X-Request-ID', req.id);
    logger.info(`[${req.id}] ${req.method} ${req.url}`);
    next();
});

// ─── Dynamic CORS ───────────────────────────────────────────
// Allows all *.vercel.app preview deployments automatically
const allowedOriginsFromEnv = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

const staticAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://restraunt-charity.vercel.app',
    'https://restraunt-charity-l7bn.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) return callback(null, true);

        // Check static + env-based origins
        if (staticAllowedOrigins.includes(origin) || allowedOriginsFromEnv.includes(origin)) {
            return callback(null, true);
        }

        // Allow ALL Vercel preview deployments (*.vercel.app)
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        // Reject everything else
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
};

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(helmet());

app.use(hpp());

app.use(mongoSanitize());

// XSS Protection - sanitize user inputs against cross-site scripting
app.use(xssSanitize);



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images from local filesystem (fallback when R2 not configured)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    req._startTime = process.hrtime();

    // Capture response finish for metrics
    res.on('finish', () => {
        const diff = process.hrtime(req._startTime);
        const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        logger[level](`[${req.id}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
    });

    next();
});



app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/menu-items', menuRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/restaurant', restaurantDashRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/impact', impactRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/fcm', fcmRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/daily-summary', dailySummaryRoutes);
app.use('/api/v1/ngo', ngoRoutes);
app.use('/api/v1/rescue-audit', rescueAuditRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/recipe-alchemist', recipeAlchemistRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'NextPlate API v2.3 is running', version: 'v1' });
});

app.get('/health', async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    const health = {
        status: dbState === 1 ? 'OK' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        services: {
            database: {
                status: dbStatus[dbState],
                ready: dbState === 1
            }
        },
        uptime: process.uptime()
    };

    const statusCode = dbState === 1 ? 200 : 503;
    res.status(statusCode).json(health);
});

app.use((req, res, next) => {
    next(new ApiError(404, 'Route not found'));
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
