const { Sequelize } = require('sequelize');
const databaseConfig = require('../../../config/database');
const { sequelize } = require('../../../models');
const logger = require('../../../utils/logger');

describe('Database Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Configuration Object', () => {
    it('should use environment variables for database configuration', () => {
      process.env.DB_HOST = 'test-host';
      process.env.DB_PORT = '3306';
      process.env.DB_NAME = 'test-db';
      process.env.DB_USER = 'test-user';
      process.env.DB_PASS = 'test-pass';

      const config = require('../../../config/database');

      expect(config).toEqual(
        expect.objectContaining({
          host: 'test-host',
          port: 3306,
          database: 'test-db',
          username: 'test-user',
          password: 'test-pass'
        })
      );
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASS;

      const config = require('../../../config/database');

      expect(config).toEqual(
        expect.objectContaining({
          host: 'localhost',
          port: 3306,
          database: 'retail_management',
          username: 'root',
          password: 'root'
        })
      );
    });

    it('should configure dialect options', () => {
      const config = require('../../../config/database');

      expect(config.dialectOptions).toBeDefined();
      expect(config.dialectOptions.timezone).toBe('local');
    });

    it('should configure connection pool', () => {
      const config = require('../../../config/database');

      expect(config.pool).toBeDefined();
      expect(config.pool.max).toBeGreaterThan(0);
      expect(config.pool.min).toBeGreaterThanOrEqual(0);
      expect(config.pool.acquire).toBeGreaterThan(0);
      expect(config.pool.idle).toBeGreaterThan(0);
    });
  });

  describe('Sequelize Instance', () => {
    it('should create a valid Sequelize instance', () => {
      expect(sequelize).toBeInstanceOf(Sequelize);
    });

    it('should use the correct database name', () => {
      expect(sequelize.config.database).toBe(
        process.env.DB_NAME || 'retail_management'
      );
    });

    it('should use the correct dialect', () => {
      expect(sequelize.getDialect()).toBe('mysql');
    });

    it('should have timezone configuration', () => {
      expect(sequelize.options.timezone).toBe('+00:00');
    });

    it('should have logging configured', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(sequelize.options.logging).toBe(false);
      } else {
        expect(sequelize.options.logging).toBeDefined();
      }
    });
  });

  describe('Connection Management', () => {
    it('should connect to the database successfully', async () => {
      try {
        await sequelize.authenticate();
        expect(true).toBe(true); // Connection successful
      } catch (error) {
        fail('Database connection failed: ' + error.message);
      }
    });

    it('should handle connection errors gracefully', async () => {
      // Create a new instance with invalid credentials
      const invalidSequelize = new Sequelize({
        ...databaseConfig,
        username: 'invalid_user',
        password: 'invalid_pass'
      });

      try {
        await invalidSequelize.authenticate();
        fail('Should not connect with invalid credentials');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should close connection properly', async () => {
      try {
        await sequelize.close();
        expect(true).toBe(true); // Connection closed successfully
      } catch (error) {
        fail('Failed to close database connection: ' + error.message);
      }
    });
  });

  describe('Model Synchronization', () => {
    it('should sync models without force', async () => {
      try {
        await sequelize.sync();
        expect(true).toBe(true); // Sync successful
      } catch (error) {
        fail('Model synchronization failed: ' + error.message);
      }
    });

    it('should sync models with force', async () => {
      try {
        await sequelize.sync({ force: true });
        expect(true).toBe(true); // Force sync successful
      } catch (error) {
        fail('Force model synchronization failed: ' + error.message);
      }
    });

    it('should sync models with alter', async () => {
      try {
        await sequelize.sync({ alter: true });
        expect(true).toBe(true); // Alter sync successful
      } catch (error) {
        fail('Alter model synchronization failed: ' + error.message);
      }
    });
  });

  describe('Query Logging', () => {
    it('should log queries in development environment', () => {
      process.env.NODE_ENV = 'development';
      const devConfig = require('../../../config/database');
      
      expect(devConfig.logging).toBeDefined();
      expect(typeof devConfig.logging).toBe('function');
    });

    it('should disable query logging in production environment', () => {
      process.env.NODE_ENV = 'production';
      const prodConfig = require('../../../config/database');
      
      expect(prodConfig.logging).toBe(false);
    });

    it('should log queries with appropriate format', () => {
      const logSpy = jest.spyOn(logger, 'debug');
      const config = require('../../../config/database');
      
      if (typeof config.logging === 'function') {
        config.logging('SELECT * FROM users');
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('SELECT * FROM users')
        );
      }
    });
  });

  describe('Transaction Support', () => {
    it('should support transactions', async () => {
      const transaction = await sequelize.transaction();
      expect(transaction).toBeDefined();
      await transaction.rollback();
    });

    it('should rollback failed transactions', async () => {
      try {
        await sequelize.transaction(async (t) => {
          // Perform some operations
          throw new Error('Test rollback');
        });
        fail('Transaction should have failed');
      } catch (error) {
        expect(error.message).toBe('Test rollback');
      }
    });

    it('should commit successful transactions', async () => {
      try {
        await sequelize.transaction(async (t) => {
          // Perform some operations
          return true;
        });
        expect(true).toBe(true); // Transaction committed successfully
      } catch (error) {
        fail('Transaction should have succeeded');
      }
    });
  });
});
