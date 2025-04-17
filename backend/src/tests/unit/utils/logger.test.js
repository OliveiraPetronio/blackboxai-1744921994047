const winston = require('winston');
const logger = require('../../../utils/logger');

describe('Logger Utility', () => {
  let consoleOutput;
  const originalEnv = process.env.NODE_ENV;
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    // Capture console output
    consoleOutput = {
      log: [],
      info: [],
      warn: [],
      error: []
    };

    // Mock console methods
    const mockConsole = (method) => (...args) => {
      consoleOutput[method].push(args);
    };

    jest.spyOn(console, 'log').mockImplementation(mockConsole('log'));
    jest.spyOn(console, 'info').mockImplementation(mockConsole('info'));
    jest.spyOn(console, 'warn').mockImplementation(mockConsole('warn'));
    jest.spyOn(console, 'error').mockImplementation(mockConsole('error'));
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.info.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();

    // Restore environment variables
    process.env.NODE_ENV = originalEnv;
    process.env.LOG_LEVEL = originalLogLevel;
  });

  describe('Logger Configuration', () => {
    it('should create a winston logger instance', () => {
      expect(logger).toBeInstanceOf(winston.Logger);
    });

    it('should have all log levels', () => {
      expect(logger.levels).toEqual(winston.config.npm.levels);
    });

    it('should have console transport', () => {
      const consoleTransport = logger.transports.find(
        t => t instanceof winston.transports.Console
      );
      expect(consoleTransport).toBeDefined();
    });

    it('should have file transport in production', () => {
      process.env.NODE_ENV = 'production';
      const productionLogger = require('../../../utils/logger');
      
      const fileTransport = productionLogger.transports.find(
        t => t instanceof winston.transports.File
      );
      expect(fileTransport).toBeDefined();
    });
  });

  describe('Logging Methods', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      logger.info(message);

      expect(consoleOutput.info.length).toBeGreaterThan(0);
      expect(consoleOutput.info[0].join(' ')).toContain(message);
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(consoleOutput.error.length).toBeGreaterThan(0);
      expect(consoleOutput.error[0].join(' ')).toContain('Error occurred');
      expect(consoleOutput.error[0].join(' ')).toContain('Test error');
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      logger.warn(message);

      expect(consoleOutput.warn.length).toBeGreaterThan(0);
      expect(consoleOutput.warn[0].join(' ')).toContain(message);
    });

    it('should log debug messages', () => {
      process.env.LOG_LEVEL = 'debug';
      const message = 'Test debug message';
      logger.debug(message);

      expect(consoleOutput.log.length).toBeGreaterThan(0);
      expect(consoleOutput.log[0].join(' ')).toContain(message);
    });
  });

  describe('Log Formatting', () => {
    it('should include timestamp in logs', () => {
      logger.info('Test message');
      
      const logOutput = consoleOutput.info[0].join(' ');
      expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format
      expect(logOutput).toMatch(/\d{2}:\d{2}:\d{2}/); // Time format
    });

    it('should include log level in logs', () => {
      logger.info('Test message');
      
      const logOutput = consoleOutput.info[0].join(' ');
      expect(logOutput).toContain('info');
    });

    it('should format error objects properly', () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      logger.error('Error occurred', error);

      const logOutput = consoleOutput.error[0].join(' ');
      expect(logOutput).toContain('Test error');
      expect(logOutput).toContain('TEST_ERROR');
      expect(logOutput).toContain('Error occurred');
    });

    it('should handle objects in logs', () => {
      const obj = { key: 'value', nested: { test: true } };
      logger.info('Test object', obj);

      const logOutput = consoleOutput.info[0].join(' ');
      expect(logOutput).toContain('key');
      expect(logOutput).toContain('value');
      expect(logOutput).toContain('nested');
    });
  });

  describe('Log Levels', () => {
    it('should respect log level configuration', () => {
      process.env.LOG_LEVEL = 'error';
      const testLogger = require('../../../utils/logger');

      testLogger.info('This should not be logged');
      testLogger.error('This should be logged');

      expect(consoleOutput.info.length).toBe(0);
      expect(consoleOutput.error.length).toBeGreaterThan(0);
    });

    it('should use default log level if not configured', () => {
      delete process.env.LOG_LEVEL;
      const testLogger = require('../../../utils/logger');

      testLogger.info('This should be logged');
      expect(consoleOutput.info.length).toBeGreaterThan(0);
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should use json format in production', () => {
      const productionLogger = require('../../../utils/logger');
      productionLogger.info('Test message');

      const logOutput = consoleOutput.info[0].join(' ');
      expect(() => JSON.parse(logOutput)).not.toThrow();
    });

    it('should include additional metadata in production', () => {
      const productionLogger = require('../../../utils/logger');
      productionLogger.info('Test message', { userId: '123' });

      const logOutput = JSON.parse(consoleOutput.info[0].join(' '));
      expect(logOutput.userId).toBe('123');
    });
  });
});
