const authController = require('../../../controllers/authController');
const { User } = require('../../../models');
const { ValidationError } = require('../../../utils/errors');
const bcrypt = require('bcryptjs');

describe('Auth Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(async () => {
    // Clean up users
    await User.destroy({ where: {}, force: true });

    // Mock request object
    req = {
      body: {},
      user: null
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };

    // Mock next function
    next = jest.fn();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee'
      };

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              name: 'Test User',
              email: 'test@example.com'
            }),
            token: expect.any(String)
          })
        })
      );

      // Verify user was created in database
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user).toBeDefined();
      expect(user.role).toBe('employee');
    });

    it('should not create user with existing email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee'
      });

      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123'
      };

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email já cadastrado'
        })
      );
    });

    it('should validate required fields', async () => {
      req.body = {
        name: 'Test User'
        // Missing email and password
      };

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
    });
  });

  describe('login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('Test@123', 10),
        role: 'employee',
        status: 'active'
      });
    });

    it('should login successfully with valid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Test@123'
      };

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'test@example.com'
            }),
            token: expect.any(String)
          })
        })
      );

      // Verify last_login was updated
      await testUser.reload();
      expect(testUser.last_login).toBeDefined();
    });

    it('should not login with incorrect password', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Credenciais inválidas'
        })
      );
    });

    it('should not login inactive user', async () => {
      await testUser.update({ status: 'inactive' });

      req.body = {
        email: 'test@example.com',
        password: 'Test@123'
      };

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuário inativo'
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        role: 'employee'
      });

      req.user = user;

      await authController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              name: 'Test User',
              email: 'test@example.com'
            })
          })
        })
      );
    });
  });

  describe('updateProfile', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('Test@123', 10),
        role: 'employee'
      });

      req.user = testUser;
    });

    it('should update basic info', async () => {
      req.body = {
        name: 'Updated Name'
      };

      await authController.updateProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              name: 'Updated Name'
            })
          })
        })
      );
    });

    it('should update email if not taken', async () => {
      req.body = {
        email: 'new@example.com'
      };

      await authController.updateProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'new@example.com'
            })
          })
        })
      );
    });

    it('should not update to existing email', async () => {
      await User.create({
        name: 'Other User',
        email: 'taken@example.com',
        password: 'Test@123'
      });

      req.body = {
        email: 'taken@example.com'
      };

      await authController.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email já cadastrado'
        })
      );
    });

    it('should update password with correct current password', async () => {
      req.body = {
        currentPassword: 'Test@123',
        newPassword: 'NewTest@123'
      };

      await authController.updateProfile(req, res, next);

      await testUser.reload();
      const isNewPasswordValid = await testUser.checkPassword('NewTest@123');
      expect(isNewPasswordValid).toBe(true);
    });

    it('should not update password with incorrect current password', async () => {
      req.body = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewTest@123'
      };

      await authController.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Senha atual incorreta'
        })
      );
    });
  });

  describe('forgotPassword', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123'
      });
    });

    it('should generate reset token for valid email', async () => {
      req.body = {
        email: 'test@example.com'
      };

      await authController.forgotPassword(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );

      await testUser.reload();
      expect(testUser.reset_password_token).toBeDefined();
      expect(testUser.reset_password_expires).toBeDefined();
    });

    it('should not reveal user existence for invalid email', async () => {
      req.body = {
        email: 'nonexistent@example.com'
      };

      await authController.forgotPassword(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });
  });

  describe('resetPassword', () => {
    let testUser;
    const resetToken = 'valid-reset-token';

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123',
        reset_password_token: resetToken,
        reset_password_expires: new Date(Date.now() + 3600000) // 1 hour from now
      });
    });

    it('should reset password with valid token', async () => {
      req.body = {
        token: resetToken,
        password: 'NewTest@123'
      };

      await authController.resetPassword(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Senha alterada com sucesso'
        })
      );

      await testUser.reload();
      const isNewPasswordValid = await testUser.checkPassword('NewTest@123');
      expect(isNewPasswordValid).toBe(true);
      expect(testUser.reset_password_token).toBeNull();
      expect(testUser.reset_password_expires).toBeNull();
    });

    it('should not reset password with invalid token', async () => {
      req.body = {
        token: 'invalid-token',
        password: 'NewTest@123'
      };

      await authController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token inválido ou expirado'
        })
      );
    });

    it('should not reset password with expired token', async () => {
      await testUser.update({
        reset_password_expires: new Date(Date.now() - 3600000) // 1 hour ago
      });

      req.body = {
        token: resetToken,
        password: 'NewTest@123'
      };

      await authController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token inválido ou expirado'
        })
      );
    });
  });
});
