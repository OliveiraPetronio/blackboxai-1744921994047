const { sequelize } = require('../models');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

module.exports = async () => {
  try {
    // Close database connection
    await sequelize.close();
    logger.info('Database connection closed');

    // Clean up test database if in CI environment
    if (process.env.CI) {
      await sequelize.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME};`);
      logger.info('Test database dropped in CI environment');
    }

    // Clean up test files
    const testDirs = [
      path.join(__dirname, '../../uploads'),
      path.join(__dirname, '../../temp')
    ];

    await Promise.all(
      testDirs.map(async (dir) => {
        try {
          await fs.rm(dir, { recursive: true, force: true });
          logger.info(`Cleaned up directory: ${dir}`);
        } catch (error) {
          // Ignore errors if directory doesn't exist
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      })
    );

    // Clean up any test caches
    const cache = require('../utils/cache');
    await cache.clear();
    logger.info('Cache cleared');

    // Clean up any test queues
    const queue = require('../utils/queue');
    await queue.clear();
    logger.info('Queue cleared');

    // Clean up any test sessions
    if (process.env.SESSION_STORE) {
      const sessionStore = require('../utils/sessionStore');
      await sessionStore.clear();
      logger.info('Session store cleared');
    }

    // Clean up any test locks
    if (process.env.LOCK_STORE) {
      const lockStore = require('../utils/lockStore');
      await lockStore.clear();
      logger.info('Lock store cleared');
    }

    // Clean up any test metrics
    if (process.env.METRICS_ENABLED) {
      const metrics = require('../utils/metrics');
      await metrics.clear();
      logger.info('Metrics cleared');
    }

    // Clean up any test logs
    const testLogs = path.join(__dirname, '../../logs/test.log');
    try {
      await fs.unlink(testLogs);
      logger.info('Test logs cleaned up');
    } catch (error) {
      // Ignore errors if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Reset environment variables
    delete process.env.TEST_SETUP_COMPLETE;
    
    // Additional cleanup tasks
    await Promise.all([
      // Remove any test triggers
      sequelize.query('DROP TRIGGER IF EXISTS update_timestamp'),
      
      // Remove any test functions
      sequelize.query('DROP FUNCTION IF EXISTS get_fiscal_year'),
      
      // Remove any test procedures
      sequelize.query('DROP PROCEDURE IF EXISTS test_procedure')
    ]);
    logger.info('Database triggers, functions, and procedures removed');

    // Final cleanup message
    logger.info('Global test teardown completed successfully');
  } catch (error) {
    logger.error('Global test teardown failed:', error);
    throw error;
  } finally {
    // Ensure all connections are properly closed
    try {
      const mysql = require('mysql2/promise');
      const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
      });
      await pool.end();
    } catch (error) {
      logger.error('Error closing MySQL connections:', error);
    }

    // Clear any remaining timeouts/intervals
    const timeouts = setTimeout(() => {}, 0);
    for (let i = 0; i < timeouts; i++) {
      clearTimeout(i);
    }
    
    // Clear any remaining event listeners
    process.removeAllListeners();
  }
};
