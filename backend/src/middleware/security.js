const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { getRedisClient } = require('../config/redis');

/**
 * Configure security middleware for the Express application
 * @param {Object} app - Express application instance
 */
const configureSecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Prevent XSS attacks
  app.use(xss());

  // Enable CORS with allowlist-based configuration (P0 Security Fix)
  // Parse comma-separated allowlist from environment
  const allowedOrigins = (process.env.CORS_ALLOWLIST || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const corsOptions = {
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.) in development
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      // Block requests with no origin in production
      if (!origin) {
        return callback(new Error('Origin header required'), false);
      }

      // Check if origin is in allowlist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject origin not in allowlist
      return callback(new Error('Not allowed by CORS policy'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // Disabled - using Bearer tokens, no cookies needed
    maxAge: 86400, // 24 hours
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  /**
   * P1 Fix: Distributed rate limiting with Redis
   * Falls back to in-memory rate limiting if Redis is unavailable
   */
  const redisClient = getRedisClient();

  if (redisClient) {
    // Redis-backed distributed rate limiting
    console.log('Using Redis-backed distributed rate limiting');

    // API rate limiter (1000 requests per minute per IP)
    const apiRateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_api',
      points: 1000, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60 * 15, // Block for 15 minutes if exceeded
    });

    // Auth rate limiter (10 requests per hour per IP)
    const authRateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_auth',
      points: 10,
      duration: 60 * 60, // Per hour
      blockDuration: 60 * 60, // Block for 1 hour if exceeded
    });

    // API rate limit middleware
    app.use('/api', async (req, res, next) => {
      // Skip rate limiting for health check endpoints
      if (req.path === '/healthz' || req.path === '/readyz') {
        return next();
      }

      try {
        await apiRateLimiter.consume(req.ip);
        next();
      } catch (rejRes) {
        res.status(429).json({
          status: 'error',
          message: 'Too many requests from this IP, please try again later',
          retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60,
        });
      }
    });

    // Auth rate limit middleware
    app.use('/api/auth', async (req, res, next) => {
      try {
        await authRateLimiter.consume(req.ip);
        next();
      } catch (rejRes) {
        res.status(429).json({
          status: 'error',
          message: 'Too many authentication attempts, please try again after an hour',
          retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 3600,
        });
      }
    });
  } else {
    // Fallback to in-memory rate limiting
    console.warn('Redis unavailable. Using in-memory rate limiting (not suitable for production clusters)');

    const apiLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 1000,
      message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/api/healthz' || req.path === '/api/readyz',
    });
    app.use('/api', apiLimiter);

    const authLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10,
      message: {
        status: 'error',
        message: 'Too many authentication attempts, please try again after an hour',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api/auth', authLimiter);
  }

  // Add enhanced security headers (P2 Security Hardening)
  app.use((req, res, next) => {
    // Content Security Policy - Removed 'unsafe-inline' (P2 Fix)
    // Note: Frontend may need nonce-based CSP for inline scripts
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    );

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Strict Transport Security (only in production)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enhanced Referrer Policy (P2 Fix)
    res.setHeader('Referrer-Policy', 'no-referrer');

    // Feature/Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()'
    );

    next();
  });
};

module.exports = configureSecurityMiddleware;
