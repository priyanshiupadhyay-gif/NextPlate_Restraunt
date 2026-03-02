const Joi = require('joi');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
        PORT: Joi.number().default(5000),
        MONGODB_URI: Joi.string().required().description('MongoDB connection string'),
        JWT_ACCESS_SECRET: Joi.string().required().description('JWT access secret key'),
        JWT_REFRESH_SECRET: Joi.string().required().description('JWT refresh secret key'),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        ALLOWED_ORIGINS: Joi.string().description('Comma-separated list of allowed CORS origins'),

    })
    .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const requiredEnvVars = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongoose: {
        url: envVars.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 100,
            minPoolSize: 10,
            socketTimeoutMS: 45000,
        },
    },
    jwt: {
        accessSecret: envVars.JWT_ACCESS_SECRET,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRES_IN,
        refreshExpirationDays: envVars.JWT_REFRESH_EXPIRES_IN,
    },
    cors: {
        allowedOrigins: envVars.ALLOWED_ORIGINS ? envVars.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001']
    },

};
