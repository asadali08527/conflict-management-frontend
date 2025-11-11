const Redis = require('ioredis');

/**
 * Redis Client Configuration
 * P1 Fix: Distributed rate limiting and caching support
 */

let redisClient = null;

/**
 * Create and configure Redis client
 * @returns {Redis} Redis client instance
 */
const createRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('REDIS_URL not configured. Redis features (distributed rate limiting) will be disabled.');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNREFUSED'];
        if (targetErrors.some(targetError => err.message.includes(targetError))) {
          // Reconnect on specific errors
          return true;
        }
        return false;
      },
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    redisClient.on('close', () => {
      console.warn('Redis connection closed');
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error.message);
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Redis|null} Redis client or null if not configured
 */
const getRedisClient = () => {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
};

/**
 * Close Redis connection gracefully
 */
const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed successfully');
      redisClient = null;
    } catch (error) {
      console.error('Error closing Redis connection:', error.message);
      throw error;
    }
  }
};

/**
 * Check if Redis is connected and ready
 * @returns {Promise<boolean>}
 */
const isRedisReady = async () => {
  if (!redisClient) {
    return false;
  }
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  createRedisClient,
  getRedisClient,
  disconnectRedis,
  isRedisReady,
};
