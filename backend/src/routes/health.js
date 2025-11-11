const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isRedisReady } = require('../config/redis');

/**
 * P2: Health check endpoints for monitoring and orchestration
 * /healthz - Basic liveness probe (is server running?)
 * /readyz - Readiness probe (is server ready to accept traffic?)
 */

/**
 * @swagger
 * /api/healthz:
 *   get:
 *     summary: Liveness probe
 *     description: Basic health check - returns 200 if server is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: 2025-11-11T12:00:00.000Z
 */
router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/readyz:
 *   get:
 *     summary: Readiness probe
 *     description: Comprehensive readiness check - verifies DB and Redis connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is ready to accept traffic
 *       503:
 *         description: Server is not ready (dependencies unavailable)
 */
router.get('/readyz', async (req, res) => {
  const checks = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      mongodb: 'unknown',
      redis: 'unknown',
    },
  };

  let allHealthy = true;

  // Check MongoDB connection
  try {
    const mongoState = mongoose.connection.readyState;
    /*
     * 0 = disconnected
     * 1 = connected
     * 2 = connecting
     * 3 = disconnecting
     */
    if (mongoState === 1) {
      checks.checks.mongodb = 'connected';
    } else if (mongoState === 2) {
      checks.checks.mongodb = 'connecting';
      allHealthy = false;
    } else {
      checks.checks.mongodb = 'disconnected';
      allHealthy = false;
    }
  } catch (error) {
    checks.checks.mongodb = `error: ${error.message}`;
    allHealthy = false;
  }

  // Check Redis connection
  try {
    const redisReady = await isRedisReady();
    if (redisReady) {
      checks.checks.redis = 'connected';
    } else {
      checks.checks.redis = 'unavailable';
      // Redis is optional, so don't fail readiness check
      // allHealthy = false;
    }
  } catch (error) {
    checks.checks.redis = `error: ${error.message}`;
    // Redis is optional
  }

  if (allHealthy) {
    res.status(200).json(checks);
  } else {
    checks.status = 'not_ready';
    res.status(503).json(checks);
  }
});

module.exports = router;
