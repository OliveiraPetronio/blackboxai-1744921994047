const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  logging: (msg) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true, // Soft deletes
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Initialize database connection
const initDatabase = async () => {
  try {
    await testConnection();
    
    if (process.env.NODE_ENV === 'development') {
      // In development, sync database (create tables if they don't exist)
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized successfully.');
    }
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  initDatabase
};
