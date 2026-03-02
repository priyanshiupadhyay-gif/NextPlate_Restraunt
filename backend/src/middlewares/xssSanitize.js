/**
 * XSS Sanitization Middleware
 * Recursively sanitizes all string values in req.body, req.query, and req.params
 * Uses the 'xss' library (actively maintained) instead of deprecated 'xss-clean'
 */

const xss = require('xss');

const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        return xss(value);
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
        return sanitizeObject(value);
    }
    return value;
};

const sanitizeObject = (obj) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeValue(value);
    }
    return sanitized;
};

const xssSanitize = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};

module.exports = xssSanitize;
