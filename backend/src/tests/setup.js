const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({
  path: path.join(__dirname, '../../.env.test')
});

// Set test environment
process.env.NODE_ENV = 'test';

// Set default test timeout
jest.setTimeout(30000);

// Suppress console output during tests
global.console = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock Date
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date = class extends Date {
  constructor(...args) {
    if (args.length) {
      return super(...args);
    }
    return mockDate;
  }
};

// Mock crypto for consistent values in tests
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('test-random-bytes')),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('test-hash')
  })
}));

// Mock bcryptjs for consistent password hashing in tests
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('test_salt')
}));

// Mock jsonwebtoken for consistent token generation in tests
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test.jwt.token'),
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com' })
}));

// Set test database configuration
process.env.DB_NAME = 'retail_management_test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASS = 'test_password';
process.env.DB_PORT = '3306';

// Set test JWT configuration
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRATION = '1h';

// Set test application configuration
process.env.PORT = '3001';
process.env.API_VERSION = 'v1';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Set test rate limiting configuration
process.env.RATE_LIMIT_WINDOW = '15';
process.env.RATE_LIMIT_MAX = '100';

// Set test logging configuration
process.env.LOG_LEVEL = 'error';
process.env.LOG_FORMAT = 'simple';
