const mongoose = require('mongoose');

/**
 * Connect to MongoDB with optimized connection pooling and timeout settings
 * P1 Performance & Scalability Fix
 */
const connectDB = async () => {
  try {
    // Connection options optimized for production scale
    const options = {
      maxPoolSize: Number(process.env.DB_MAX_POOL) || 50,
      minPoolSize: Number(process.env.DB_MIN_POOL) || 5,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      retryWrites: true,
      retryReads: true,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection pool: min=${options.minPoolSize}, max=${options.maxPoolSize}`);

    // Connection event handlers for monitoring
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully close MongoDB connection
 * P1 Fix: Exported for use in graceful shutdown
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed successfully');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };