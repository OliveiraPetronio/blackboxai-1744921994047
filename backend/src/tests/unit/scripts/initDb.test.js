const { sequelize } = require('../../../models');
const initDb = require('../../../scripts/initDb');
const seeder = require('../../../utils/seeder');
const logger = require('../../../utils/logger');

jest.mock('../../../utils/seeder');
jest.mock('../../../utils/logger');

describe('Database Initialization Script', () => {
  const originalArgv = process.argv;
  const originalExit = process.exit;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock process.exit
    process.exit = jest.fn();

    // Mock sequelize methods
    sequelize.authenticate = jest.fn().mockResolvedValue();
    sequelize.sync = jest.fn().mockResolvedValue();
    sequelize.close = jest.fn().mockResolvedValue();

    // Mock seeder
    seeder.seedAll = jest.fn().mockResolvedValue();
  });

  afterEach(() => {
    // Restore process.argv and process.exit
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  describe('Database Connection', () => {
    it('should authenticate database connection', async () => {
      await initDb();
      expect(sequelize.authenticate).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database connection established successfully');
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Connection failed');
      sequelize.authenticate.mockRejectedValue(error);

      await initDb();

      expect(logger.error).toHaveBeenCalledWith('Unable to connect to database:', error);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Database Synchronization', () => {
    it('should sync database without force by default', async () => {
      await initDb();

      expect(sequelize.sync).toHaveBeenCalledWith({ force: false });
      expect(logger.info).toHaveBeenCalledWith('Database synchronized successfully');
    });

    it('should force sync when --force flag is used', async () => {
      process.argv = [...originalArgv, '--force'];
      await initDb();

      expect(sequelize.sync).toHaveBeenCalledWith({ force: true });
      expect(logger.warn).toHaveBeenCalledWith('Forcing database synchronization...');
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      sequelize.sync.mockRejectedValue(error);

      await initDb();

      expect(logger.error).toHaveBeenCalledWith('Unable to sync database:', error);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Database Seeding', () => {
    it('should not seed by default', async () => {
      await initDb();

      expect(seeder.seedAll).not.toHaveBeenCalled();
    });

    it('should seed when --seed flag is used', async () => {
      process.argv = [...originalArgv, '--seed'];
      await initDb();

      expect(seeder.seedAll).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Seeding database...');
    });

    it('should handle seeding errors', async () => {
      process.argv = [...originalArgv, '--seed'];
      const error = new Error('Seeding failed');
      seeder.seedAll.mockRejectedValue(error);

      await initDb();

      expect(logger.error).toHaveBeenCalledWith('Unable to seed database:', error);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Command Line Arguments', () => {
    it('should handle --help flag', async () => {
      process.argv = [...originalArgv, '--help'];
      await initDb();

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should handle --version flag', async () => {
      process.argv = [...originalArgv, '--version'];
      await initDb();

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Version:'));
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should handle invalid flags', async () => {
      process.argv = [...originalArgv, '--invalid'];
      await initDb();

      expect(logger.error).toHaveBeenCalledWith('Invalid argument: --invalid');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Force and Seed Combination', () => {
    it('should handle both --force and --seed flags', async () => {
      process.argv = [...originalArgv, '--force', '--seed'];
      await initDb();

      expect(sequelize.sync).toHaveBeenCalledWith({ force: true });
      expect(seeder.seedAll).toHaveBeenCalled();
    });

    it('should execute in correct order', async () => {
      process.argv = [...originalArgv, '--force', '--seed'];
      const executionOrder = [];

      sequelize.sync.mockImplementation(() => {
        executionOrder.push('sync');
        return Promise.resolve();
      });

      seeder.seedAll.mockImplementation(() => {
        executionOrder.push('seed');
        return Promise.resolve();
      });

      await initDb();

      expect(executionOrder).toEqual(['sync', 'seed']);
    });
  });

  describe('Cleanup', () => {
    it('should close database connection on success', async () => {
      await initDb();

      expect(sequelize.close).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database connection closed');
    });

    it('should close database connection on error', async () => {
      const error = new Error('Test error');
      sequelize.sync.mockRejectedValue(error);

      await initDb();

      expect(sequelize.close).toHaveBeenCalled();
    });

    it('should handle connection close errors', async () => {
      const error = new Error('Close failed');
      sequelize.close.mockRejectedValue(error);

      await initDb();

      expect(logger.error).toHaveBeenCalledWith('Error closing database connection:', error);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Environment Handling', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should warn in production environment with force flag', async () => {
      process.env.NODE_ENV = 'production';
      process.argv = [...originalArgv, '--force'];

      await initDb();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Forcing sync in production')
      );
    });

    it('should handle different database configurations per environment', async () => {
      // Test environment
      process.env.NODE_ENV = 'test';
      await initDb();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initializing database in test environment')
      );

      // Development environment
      process.env.NODE_ENV = 'development';
      await initDb();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initializing database in development environment')
      );

      // Production environment
      process.env.NODE_ENV = 'production';
      await initDb();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initializing database in production environment')
      );
    });
  });
});
