const jwt = require('jsonwebtoken');
const authMiddleware = require('../../../middleware/authMiddleware');
const { User } = require('../../../models');
const { createUser, getAuthHeader } = require('../../helpers');

describe('Auth Middleware', () => {
  let user;
  let token;
  let req;
  let res;
  let next;

  beforeEach(async () => {
    // Clean up users
    await User.destroy({ where: {}, force: true });

    // Create test user
    user = await createUser();
    token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Mock request object
    req = {
      header: jest.fn(),
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

  describe('required middleware', () => {
    it('should pass with valid token', async () => {
      req.header.mockReturnValue(`Bearer ${token}`);

      await authMiddleware.required(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
    });

    it('should fail without token', async () => {
      req.header.mockReturnValue(null);

      await authMiddleware.required(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
    });

    it('should fail with invalid token format', async () => {
      req.header.mockReturnValue('InvalidFormat token');

      await authMiddleware.required(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should fail with invalid token', async () => {
      req.header.mockReturnValue('Bearer invalid-token');

      await authMiddleware.required(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should fail if user not found', async () => {
      // Create token with non-existent user ID
      const invalidToken = jwt.sign(
        { id: 'non-existent-id', email: 'test@example.com', role: 'employee' },
        process.env.JWT_SECRET
      );
      req.header.mockReturnValue(`Bearer ${invalidToken}`);

      await authMiddleware.required(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should fail if user is inactive', async () => {
      await user.update({ status: 'inactive' });
      req.header.mockReturnValue(`Bearer ${token}`);

      await authMiddleware.required(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('checkRole middleware', () => {
    beforeEach(() => {
      req.user = user;
    });

    it('should pass if user has required role', async () => {
      await user.update({ role: 'admin' });
      const middleware = authMiddleware.hasRole('admin');

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should pass if user has higher role', async () => {
      await user.update({ role: 'admin' });
      const middleware = authMiddleware.hasRole('employee');

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail if user has lower role', async () => {
      await user.update({ role: 'employee' });
      const middleware = authMiddleware.hasRole('admin');

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle multiple roles', async () => {
      await user.update({ role: 'manager' });
      const middleware = authMiddleware.hasRole(['admin', 'manager']);

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('refreshToken middleware', () => {
    beforeEach(() => {
      req.user = user;
    });

    it('should add new token to response header', async () => {
      await authMiddleware.withRefreshToken[1](req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'X-New-Token',
        expect.any(String)
      );
      expect(next).toHaveBeenCalled();
    });

    it('should continue on error', async () => {
      req.user = null;

      await authMiddleware.withRefreshToken[1](req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateSession middleware', () => {
    beforeEach(() => {
      req.user = user;
    });

    it('should pass for recent login', async () => {
      await user.update({ last_login: new Date() });

      await authMiddleware.withSessionValidation[1](req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail for old login', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 days ago
      await user.update({ last_login: oldDate });

      await authMiddleware.withSessionValidation[1](req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('updateLastLogin middleware', () => {
    beforeEach(() => {
      req.user = user;
    });

    it('should update last login timestamp', async () => {
      const oldLogin = user.last_login;

      await authMiddleware.withLastLogin[1](req, res, next);

      await user.reload();
      expect(user.last_login).not.toEqual(oldLogin);
      expect(next).toHaveBeenCalled();
    });

    it('should continue on error', async () => {
      req.user = null;

      await authMiddleware.withLastLogin[1](req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('fullSession middleware', () => {
    it('should combine all session middleware', () => {
      expect(authMiddleware.fullSession).toHaveLength(4);
      expect(authMiddleware.fullSession).toContain(authMiddleware.required);
    });
  });
});
