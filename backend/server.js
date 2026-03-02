require('./src/config/env');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { port } = require('./src/config/env');
const logger = require('./src/utils/logger');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { startExpiryCron } = require('./src/services/expiryNotifier');
const { startDailySummaryCron } = require('./src/services/dailySummaryService');
const { startAdaptivePricingCron } = require('./src/services/adaptivePricingService');
const { startEchoService } = require('./src/services/echoNotificationService');

const httpServer = createServer(app);

// ─── Socket.IO Real-Time Layer ───
const io = new Server(httpServer, {
    cors: {
        origin: function (origin, callback) {
            // Allow requests with no origin
            if (!origin) return callback(null, true);
            // Allow all Vercel preview deployments
            if (origin.endsWith('.vercel.app')) return callback(null, true);
            // Allow localhost
            if (origin.startsWith('http://localhost:')) return callback(null, true);
            // Check env-based origins
            const envOrigins = process.env.ALLOWED_ORIGINS
                ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
                : [];
            if (envOrigins.includes(origin)) return callback(null, true);
            callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Export io globally so controllers can emit events
global.io = io;

io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // Client joins a "city" room for local live feed
    socket.on('join-city', (city) => {
        socket.join(`city:${city}`);
        logger.info(`Socket ${socket.id} joined city:${city}`);
    });

    // Client joins a specific order room (for order tracking)
    socket.on('track-order', (orderId) => {
        socket.join(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
});

let server;
connectDB().then(() => {
    server = httpServer.listen(port, '0.0.0.0', () => {
        logger.info(`🚀 Server running on port ${port} (HTTP + WebSocket)`);
    });
    // Start background services
    startExpiryCron();
    startDailySummaryCron();
    startAdaptivePricingCron();
    startEchoService();
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});
