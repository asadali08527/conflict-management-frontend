const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { specs, swaggerUi } = require('./config/swagger');
const { httpLogger } = require('./config/logger'); // P2: Structured logging

dotenv.config();

// Connect to database (P1 Fix: Updated to destructured import)
const { connectDB, disconnectDB } = require('./config/database');
const { createRedisClient, disconnectRedis } = require('./config/redis');

// Initialize connections
connectDB();
createRedisClient(); // P1: Initialize Redis for distributed rate limiting

// Import security middleware
const configureSecurityMiddleware = require('./middleware/security');

// Initialize express app
const app = express();

// Apply security middleware (helmet, xss, cors, rate limiting)
configureSecurityMiddleware(app);

// Body parser
app.use(express.json({ limit: '10mb' }));

// P2: Structured logging with Pino (replaces morgan)
app.use(httpLogger);

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Define routes
app.use('/api', require('./routes/health')); // P2: Health check endpoints
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/case-submission', require('./routes/caseSubmission'));
app.use('/api/panelists', require('./routes/panelists'));
app.use('/api/panelist', require('./routes/panelistRoutes'));
app.use('/api/client', require('./routes/clientRoutes'));
app.use('/api/files', require('./routes/files'));
app.get('/test', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Test endpoint working' });
});

// Legacy health endpoint (kept for backward compatibility)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is running' });
});

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

/**
 * Graceful shutdown handler
 * P1 Fix: Close connections cleanly on SIGTERM/SIGINT
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      console.error('Error during server close:', err);
      process.exit(1);
    }

    console.log('HTTP server closed');

    try {
      // Close database and Redis connections
      await disconnectDB();
      await disconnectRedis();
      console.log('All connections closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;
