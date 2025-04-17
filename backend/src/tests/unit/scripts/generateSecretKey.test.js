const fs = require('fs').promises;
const path = require('path');
const generateSecretKey = require('../../../scripts/generateSecretKey');
const logger = require('../../../utils/logger');
const crypto = require('crypto');

jest.mock('../../../utils/logger');
jest.mock('crypto');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    access: jest.fn()
  }
}));

describe('Generate Secret Key Script', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;
  const originalExit = process.exit;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock process.exit
    process.exit = jest.fn();

    // Mock crypto.randomBytes
    crypto.randomBytes.mockImplementation((size) => {
      return Buffer.from('a'.repeat(size));
    });

    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore process.argv and process.exit
    process.argv = originalArgv;
    process.exit = originalExit;
    process.env = originalEnv;
  });

  describe('Command Line Arguments', () => {
    it('should handle --help flag', async () => {
      process.argv = [...originalArgv, '--help'];
      await generateSecretKey();

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should handle --length flag', async () => {
      process.argv = [...originalArgv, '--length', '64'];
      await generateSecretKey();

      expect(crypto.randomBytes).toHaveBeenCalledWith(64);
    });

    it('should handle --force flag', async () => {
      process.argv = [...originalArgv, '--force'];
      fs.access.mockRejectedValue(new Error()); // File doesn't exist

      await generateSecretKey();

      expect(fs.writeFile).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('generated'));
    });

    it('should validate length argument', async () => {
      process.argv = [...originalArgv, '--length', 'invalid'];
      await generateSecretKey();

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('must be a number'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Secret Key Generation', () => {
    it('should generate key with default length', async () => {
      fs.access.mockRejectedValue(new Error()); // File doesn't exist
      await generateSecretKey();

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    });

    it('should generate key with custom length', async () => {
      process.argv = [...originalArgv, '--length', '64'];
      fs.access.mockRejectedValue(new Error()); // File doesn't exist

      await generateSecretKey();

      expect(crypto.randomBytes).toHaveBeenCalledWith(64);
    });

    it('should handle crypto errors', async () => {
      crypto.randomBytes.mockImplementation(() => {
        throw new Error('Crypto error');
      });

      await generateSecretKey();

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Crypto error'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('File Operations', () => {
    it('should create .env file if it doesn\'t exist', async () => {
      fs.access.mockRejectedValue(new Error()); // File doesn't exist
      fs.readFile.mockResolvedValue('');

      await generateSecretKey();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('JWT_SECRET=')
      );
    });

    it('should update existing .env file', async () => {
      fs.access.mockResolvedValue(); // File exists
      fs.readFile.mockResolvedValue('EXISTING_VAR=value\nJWT_SECRET=old_secret');

      await generateSecretKey();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('EXISTING_VAR=value')
      );
    });

    it('should not overwrite existing secret without force flag', async () => {
      fs.access.mockResolvedValue(); // File exists
      fs.readFile.mockResolvedValue('JWT_SECRET=existing_secret');

      await generateSecretKey();

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('already exists'));
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should handle file write errors', async () => {
      fs.access.mockRejectedValue(new Error()); // File doesn't exist
      fs.writeFile.mockRejectedValue(new Error('Write error'));

      await generateSecretKey();

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Write error'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Environment Handling', () => {
    it('should warn in production environment', async () => {
      process.env.NODE_ENV = 'production';
      fs.access.mockRejectedValue(new Error()); // File doesn't exist

      await generateSecretKey();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Generating secret key in production')
      );
    });

    it('should handle different environments', async () => {
      const environments = ['development', 'test', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        fs.access.mockRejectedValue(new Error()); // File doesn't exist
        fs.readFile.mockResolvedValue('');

        await generateSecretKey();

        expect(fs.writeFile).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(`\\.env${env === 'test' ? '\\.test' : ''}`)),
          expect.any(String)
        );
      }
    });
  });

  describe('Secret Key Format', () => {
    it('should generate base64 encoded key', async () => {
      fs.access.mockRejectedValue(new Error()); // File doesn't exist
      fs.readFile.mockResolvedValue('');

      await generateSecretKey();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/JWT_SECRET=[A-Za-z0-9+/=]+/)
      );
    });

    it('should generate key with minimum length', async () => {
      process.argv = [...originalArgv, '--length', '16'];
      fs.access.mockRejectedValue(new Error()); // File doesn't exist

      await generateSecretKey();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('recommended minimum length')
      );
    });

    it('should validate maximum length', async () => {
      process.argv = [...originalArgv, '--length', '1024'];
      await generateSecretKey();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('maximum allowed length')
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
