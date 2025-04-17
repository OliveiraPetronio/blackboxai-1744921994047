const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../../models');
const { ValidationError } = require('../../../utils/errors');

describe('User Model', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe('Validations', () => {
    it('should create a valid user', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee',
        status: 'active'
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });

    it('should not create user without required fields', async () => {
      const user = User.build({});
      
      try {
        await user.validate();
        fail('Should not validate');
      } catch (error) {
        expect(error.errors.length).toBeGreaterThan(0);
        expect(error.errors.some(e => e.path === 'name')).toBe(true);
        expect(error.errors.some(e => e.path === 'email')).toBe(true);
        expect(error.errors.some(e => e.path === 'password')).toBe(true);
      }
    });

    it('should not create user with invalid email', async () => {
      try {
        await User.create({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Test@123',
          role: 'employee'
        });
        fail('Should not create user');
      } catch (error) {
        expect(error.errors.some(e => e.path === 'email')).toBe(true);
      }
    });

    it('should not create user with duplicate email', async () => {
      await User.create({
        name: 'Test User 1',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee'
      });

      try {
        await User.create({
          name: 'Test User 2',
          email: 'test@example.com',
          password: 'Test@123',
          role: 'employee'
        });
        fail('Should not create user');
      } catch (error) {
        expect(error.name).toBe('SequelizeUniqueConstraintError');
      }
    });

    it('should validate password length', async () => {
      try {
        await User.create({
          name: 'Test User',
          email: 'test@example.com',
          password: 'short',
          role: 'employee'
        });
        fail('Should not create user');
      } catch (error) {
        expect(error.errors.some(e => e.path === 'password')).toBe(true);
      }
    });

    it('should validate role enum values', async () => {
      try {
        await User.create({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123',
          role: 'invalid-role'
        });
        fail('Should not create user');
      } catch (error) {
        expect(error.errors.some(e => e.path === 'role')).toBe(true);
      }
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee',
        status: 'active'
      });
    });

    describe('generateAuthToken', () => {
      it('should generate valid JWT token', () => {
        const token = user.generateAuthToken();
        expect(token).toBeDefined();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.id).toBe(user.id);
        expect(decoded.email).toBe(user.email);
        expect(decoded.role).toBe(user.role);
      });
    });

    describe('checkPassword', () => {
      it('should return true for correct password', async () => {
        const isValid = await user.checkPassword('Test@123');
        expect(isValid).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isValid = await user.checkPassword('WrongPassword');
        expect(isValid).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should remove sensitive fields', () => {
        const json = user.toJSON();
        expect(json.password).toBeUndefined();
        expect(json.reset_password_token).toBeUndefined();
        expect(json.reset_password_expires).toBeUndefined();
      });

      it('should include non-sensitive fields', () => {
        const json = user.toJSON();
        expect(json.id).toBeDefined();
        expect(json.name).toBeDefined();
        expect(json.email).toBeDefined();
        expect(json.role).toBeDefined();
        expect(json.status).toBeDefined();
      });
    });
  });

  describe('Hooks', () => {
    it('should hash password before saving', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee'
      });

      expect(user.password).not.toBe('Test@123');
      expect(await bcrypt.compare('Test@123', user.password)).toBe(true);
    });

    it('should hash password when updating', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee'
      });

      const originalHash = user.password;

      await user.update({ password: 'NewTest@123' });
      expect(user.password).not.toBe(originalHash);
      expect(user.password).not.toBe('NewTest@123');
      expect(await bcrypt.compare('NewTest@123', user.password)).toBe(true);
    });

    it('should not hash password if not modified', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee'
      });

      const originalHash = user.password;

      await user.update({ name: 'Updated Name' });
      expect(user.password).toBe(originalHash);
    });
  });

  describe('Class Methods', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee'
      });
    });

    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const user = await User.findByEmail('test@example.com');
        expect(user).toBeDefined();
        expect(user.email).toBe('test@example.com');
      });

      it('should return null for non-existent email', async () => {
        const user = await User.findByEmail('nonexistent@example.com');
        expect(user).toBeNull();
      });
    });
  });
});
