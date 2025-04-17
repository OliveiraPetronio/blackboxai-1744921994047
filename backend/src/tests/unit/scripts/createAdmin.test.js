const { User } = require('../../../models');
const createAdmin = require('../../../scripts/createAdmin');
const logger = require('../../../utils/logger');
const bcrypt = require('bcryptjs');

jest.mock('../../../utils/logger');
jest.mock('bcryptjs');

describe('Create Admin Script', () => {
  const originalArgv = process.argv;
  const originalExit = process.exit;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock process.exit
    process.exit = jest.fn();

    // Mock bcrypt
    bcrypt.hash = jest.fn().mockResolvedValue('hashed_password');
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    // Clear users before each test
    return User.destroy({ where: {}, force: true });
  });

  afterEach(() => {
    // Restore process.argv and process.exit
    process.argv = originalArgv;
    process.exit = originalExit;
  });

  describe('Command Line Arguments', () => {
    it('should handle --help flag', async () => {
      process.argv = [...originalArgv, '--help'];
      await createAdmin();

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should require email argument', async () => {
      process.argv = [...originalArgv];
      await createAdmin();

      expect(logger.error).toHaveBeenCalledWith('Email is required');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should require password argument', async () => {
      process.argv = [...originalArgv, '--email', 'admin@example.com'];
      await createAdmin();

      expect(logger.error).toHaveBeenCalledWith('Password is required');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should validate email format', async () => {
      process.argv = [...originalArgv, '--email', 'invalid-email', '--password', 'Admin@123'];
      await createAdmin();

      expect(logger.error).toHaveBeenCalledWith('Invalid email format');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should validate password strength', async () => {
      process.argv = [...originalArgv, '--email', 'admin@example.com', '--password', 'weak'];
      await createAdmin();

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Password must'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Admin Creation', () => {
    it('should create new admin user', async () => {
      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123'
      ];

      await createAdmin();

      const admin = await User.findOne({ where: { email: 'admin@example.com' } });
      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
      expect(admin.status).toBe('active');
      expect(logger.info).toHaveBeenCalledWith('Admin user created successfully');
    });

    it('should not create duplicate admin', async () => {
      // Create first admin
      await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'hashed_password',
        role: 'admin',
        status: 'active'
      });

      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123'
      ];

      await createAdmin();

      expect(logger.error).toHaveBeenCalledWith('User already exists');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle creation errors', async () => {
      // Mock User.create to throw error
      const error = new Error('Database error');
      jest.spyOn(User, 'create').mockRejectedValue(error);

      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123'
      ];

      await createAdmin();

      expect(logger.error).toHaveBeenCalledWith('Error creating admin user:', error);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Password Handling', () => {
    it('should hash password before saving', async () => {
      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123'
      ];

      await createAdmin();

      expect(bcrypt.hash).toHaveBeenCalledWith('Admin@123', expect.any(Number));
      const admin = await User.findOne({ where: { email: 'admin@example.com' } });
      expect(admin.password).toBe('hashed_password');
    });

    it('should handle password hashing errors', async () => {
      bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123'
      ];

      await createAdmin();

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Hashing failed'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Optional Arguments', () => {
    it('should accept name argument', async () => {
      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123',
        '--name',
        'Test Admin'
      ];

      await createAdmin();

      const admin = await User.findOne({ where: { email: 'admin@example.com' } });
      expect(admin.name).toBe('Test Admin');
    });

    it('should use default name if not provided', async () => {
      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123'
      ];

      await createAdmin();

      const admin = await User.findOne({ where: { email: 'admin@example.com' } });
      expect(admin.name).toBe('System Admin');
    });

    it('should handle force flag', async () => {
      // Create existing admin
      await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'old_password',
        role: 'admin',
        status: 'active'
      });

      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123',
        '--force'
      ];

      await createAdmin();

      const admin = await User.findOne({ where: { email: 'admin@example.com' } });
      expect(admin.password).toBe('hashed_password');
      expect(logger.info).toHaveBeenCalledWith('Admin user updated successfully');
    });
  });

  describe('Environment Handling', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should warn in production environment', async () => {
      process.env.NODE_ENV = 'production';
      process.argv = [
        ...originalArgv,
        '--email',
        'admin@example.com',
        '--password',
        'Admin@123'
      ];

      await createAdmin();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Creating admin user in production')
      );
    });

    it('should handle different environments', async () => {
      const environments = ['development', 'test', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        process.argv = [
          ...originalArgv,
          '--email',
          `admin-${env}@example.com`,
          '--password',
          'Admin@123'
        ];

        await createAdmin();

        const admin = await User.findOne({ where: { email: `admin-${env}@example.com` } });
        expect(admin).toBeDefined();
      }
    });
  });
});
