const { sequelize } = require('../models');
const Seeder = require('../utils/seeder');
const logger = require('../utils/logger');

/**
 * Initialize database and seed data
 * Usage: node src/scripts/initDb.js [--force] [--seed]
 * Options:
 *   --force: Drop and recreate all tables
 *   --seed: Seed the database with initial data
 */
async function initializeDatabase() {
  try {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const seed = args.includes('--seed');

    logger.info('Starting database initialization...');
    logger.info(`Force mode: ${force}`);
    logger.info(`Seed mode: ${seed}`);

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Sync database
    if (force) {
      logger.warn('Forcing database sync - all data will be lost!');
      await sequelize.sync({ force: true });
      logger.info('Database tables dropped and recreated.');
    } else {
      await sequelize.sync({ alter: true });
      logger.info('Database tables synchronized.');
    }

    // Seed data if requested
    if (seed) {
      logger.info('Starting to seed database...');
      await Seeder.seedAll();
      logger.info('Database seeded successfully.');
    }

    logger.info('Database initialization completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Add these commands to package.json scripts:
// "db:init": "node src/scripts/initDb.js",
// "db:reset": "node src/scripts/initDb.js --force",
// "db:seed": "node src/scripts/initDb.js --seed",
// "db:reset-seed": "node src/scripts/initDb.js --force --seed"

// Run the initialization
initializeDatabase();
