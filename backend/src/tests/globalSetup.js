const { sequelize } = require('../models');
const logger = require('../utils/logger');

module.exports = async () => {
  try {
    // Ensure test database exists
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
    logger.info('Test database created or verified');

    // Authenticate database connection
    await sequelize.authenticate();
    logger.info('Database connection authenticated');

    // Drop all tables to ensure clean state
    await sequelize.drop({ cascade: true });
    logger.info('Dropped all existing tables');

    // Sync database schema
    await sequelize.sync({ force: true });
    logger.info('Database schema synchronized');

    // Additional setup tasks
    await Promise.all([
      // Set up any required database triggers
      sequelize.query(`
        CREATE TRIGGER IF NOT EXISTS update_timestamp 
        BEFORE UPDATE ON users 
        FOR EACH ROW 
        SET NEW.updatedAt = CURRENT_TIMESTAMP
      `),

      // Set up any required database functions
      sequelize.query(`
        CREATE FUNCTION IF NOT EXISTS get_fiscal_year()
        RETURNS INTEGER
        RETURN YEAR(CURRENT_DATE)
      `)
    ]);
    logger.info('Database triggers and functions created');

    // Set up test environment variables if not already set
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
    process.env.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

    // Additional environment setup
    process.env.TEST_SETUP_COMPLETE = 'true';
    logger.info('Environment variables configured');

    // Set up any required directories
    const fs = require('fs').promises;
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../uploads');
    const tempDir = path.join(__dirname, '../../temp');

    await Promise.all([
      fs.mkdir(uploadsDir, { recursive: true }),
      fs.mkdir(tempDir, { recursive: true })
    ]);
    logger.info('Required directories created');

    // Set up any required caches
    const cache = require('../utils/cache');
    await cache.clear();
    logger.info('Cache cleared');

    // Set up any required queues
    const queue = require('../utils/queue');
    await queue.clear();
    logger.info('Queue cleared');

    // Log setup completion
    logger.info('Global test setup completed successfully');
  } catch (error) {
    logger.error('Global test setup failed:', error);
    throw error;
  }
};
