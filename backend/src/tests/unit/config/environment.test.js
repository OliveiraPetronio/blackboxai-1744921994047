const path = require('path');
const dotenv = require('dotenv');
const logger = require('../../../utils/logger');

describe('Environment Configuration', () => {
  const originalEnv = process.env;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Environment Loading', () => {
    it('should load environment variables from .env file', () => {
      const envPath = path.join(__dirname, '../../../..', '.env');
      const result = dotenv.config({ path: envPath });
      
      expect(result.error).toBeUndefined();
    });

    it('should load test environment variables in test mode', () => {
      process.env.NODE_ENV = 'test';
      const envPath = path.join(__dirname, '../../../..', '.env.test');
      const result = dotenv.config({ path: envPath });
      
      expect(result.error).toBeUndefined();
    });

    it('should warn when .env file is missing', () => {
      const invalidPath = path.join(__dirname, '.env.invalid');
      dotenv.config({ path: invalidPath });
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No .env file found')
      );
    });
  });

  describe('Required Variables', () => {
    it('should validate required environment variables', () => {
      const requiredVars = [
        'NODE_ENV',
        'PORT',
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASS',
        'JWT_SECRET'
      ];

      requiredVars.forEach(variable => {
        expect(process.env[variable]).toBeDefined();
      });
    });

    it('should use default values when variables are not set', () => {
      delete process.env.PORT;
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;

      const config = require('../../../config/environment');

      expect(config.PORT).toBe(3000);
      expect(config.DB_HOST).toBe('localhost');
      expect(config.DB_PORT).toBe(3306);
    });
  });

  describe('Environment Specific Configuration', () => {
    it('should load development configuration', () => {
      process.env.NODE_ENV = 'development';
      const config = require('../../../config/environment');

      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isTest).toBe(false);
    });

    it('should load production configuration', () => {
      process.env.NODE_ENV = 'production';
      const config = require('../../../config/environment');

      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(true);
      expect(config.isTest).toBe(false);
    });

    it('should load test configuration', () => {
      process.env.NODE_ENV = 'test';
      const config = require('../../../config/environment');

      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(false);
      expect(config.isTest).toBe(true);
    });
  });

  describe('Security Variables', () => {
    it('should have JWT configuration', () => {
      const config = require('../../../config/environment');

      expect(config.JWT_SECRET).toBeDefined();
      expect(config.JWT_EXPIRATION).toBeDefined();
    });

    it('should have CORS configuration', () => {
      const config = require('../../../config/environment');

      expect(config.CORS_ORIGIN).toBeDefined();
      expect(config.CORS_METHODS).toBeDefined();
    });

    it('should have rate limiting configuration', () => {
      const config = require('../../../config/environment');

      expect(config.RATE_LIMIT_WINDOW).toBeDefined();
      expect(config.RATE_LIMIT_MAX).toBeDefined();
    });
  });

  describe('Database Configuration', () => {
    it('should have database configuration', () => {
      const config = require('../../../config/environment');

      expect(config.DB_HOST).toBeDefined();
      expect(config.DB_PORT).toBeDefined();
      expect(config.DB_NAME).toBeDefined();
      expect(config.DB_USER).toBeDefined();
      expect(config.DB_PASS).toBeDefined();
    });

    it('should use test database in test environment', () => {
      process.env.NODE_ENV = 'test';
      const config = require('../../../config/environment');

      expect(config.DB_NAME).toContain('test');
    });
  });

  describe('Logging Configuration', () => {
    it('should have logging configuration', () => {
      const config = require('../../../config/environment');

      expect(config.LOG_LEVEL).toBeDefined();
      expect(config.LOG_FORMAT).toBeDefined();
    });

    it('should adjust log level based on environment', () => {
      process.env.NODE_ENV = 'production';
      const prodConfig = require('../../../config/environment');
      expect(prodConfig.LOG_LEVEL).toBe('info');

      process.env.NODE_ENV = 'development';
      const devConfig = require('../../../config/environment');
      expect(devConfig.LOG_LEVEL).toBe('debug');
    });
  });

  describe('File Upload Configuration', () => {
    it('should have file upload configuration', () => {
      const config = require('../../../config/environment');

      expect(config.MAX_FILE_SIZE).toBeDefined();
      expect(config.ALLOWED_FILE_TYPES).toBeDefined();
    });

    it('should parse file size to number', () => {
      process.env.MAX_FILE_SIZE = '5242880'; // 5MB
      const config = require('../../../config/environment');

      expect(typeof config.MAX_FILE_SIZE).toBe('number');
      expect(config.MAX_FILE_SIZE).toBe(5242880);
    });

    it('should parse allowed file types to array', () => {
      process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,application/pdf';
      const config = require('../../../config/environment');

      expect(Array.isArray(config.ALLOWED_FILE_TYPES)).toBe(true);
      expect(config.ALLOWED_FILE_TYPES).toContain('image/jpeg');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid environment', () => {
      process.env.NODE_ENV = 'invalid';
      
      expect(() => {
        require('../../../config/environment');
      }).toThrow();
    });

    it('should throw error for missing required variables in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      expect(() => {
        require('../../../config/environment');
      }).toThrow();
    });
  });
});
