const express = require('express');
const request = require('supertest');
const authRoutes = require('../../../routes/auth');
const authController = require('../../../controllers/authController');
const authMiddleware = require('../../../middleware/authMiddleware');
const validationMiddleware = require('../../../middleware/validationMiddleware');
const { ValidationError } = require('../../../utils/errors');

jest.mock('../../../controllers/authController');
jest.mock('../../../middleware/authMiddleware');
jest.mock('../../../middleware/validationMiddleware');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Mock middleware
    authMiddleware.required.mockImplementation((req, res, next) => next());
    authMiddleware.hasRole.mockImplementation(() => (req, res, next) => next());
    validationMiddleware.validateSchema.mockImplementation(() => (req, res, next) => next());
  });

  describe('Route Configuration', () => {
    it('should set up all auth routes', () => {
      const routes = app._router.stack
        .filter(layer => layer.route)
        .map(layer => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods)
        }));

      expect(routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/register', methods: ['post'] }),
          expect.objectContaining({ path: '/login', methods: ['post'] }),
          expect.objectContaining({ path: '/me', methods: ['get', 'put'] }),
          expect.objectContaining({ path: '/logout', methods: ['post'] }),
          expect.objectContaining({ path: '/forgot-password', methods: ['post'] }),
          expect.objectContaining({ path: '/reset-password', methods: ['post'] })
        ])
      );
    });

    it('should apply validation middleware to routes', () => {
      expect(validationMiddleware.validateSchema).toHaveBeenCalledTimes(6);
    });
  });

  describe('POST /register', () => {
    beforeEach(() => {
      authController.register.mockImplementation((req, res) => {
        res.status(201).json({ success: true });
      });
    });

    it('should handle registration request', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@123'
        });

      expect(response.status).toBe(201);
      expect(authController.register).toHaveBeenCalled();
    });

    it('should validate registration data', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid data');
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should require admin role for registration', async () => {
      const hasRoleSpy = jest.spyOn(authMiddleware, 'hasRole');
      await request(app).post('/api/auth/register');
      
      expect(hasRoleSpy).toHaveBeenCalledWith(['admin']);
    });
  });

  describe('POST /login', () => {
    beforeEach(() => {
      authController.login.mockImplementation((req, res) => {
        res.json({ success: true });
      });
    });

    it('should handle login request', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        });

      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
    });

    it('should validate login data', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid credentials');
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /me', () => {
    beforeEach(() => {
      authController.getProfile.mockImplementation((req, res) => {
        res.json({ success: true });
      });
    });

    it('should require authentication', async () => {
      await request(app).get('/api/auth/me');
      expect(authMiddleware.required).toHaveBeenCalled();
    });

    it('should return user profile', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(authController.getProfile).toHaveBeenCalled();
    });
  });

  describe('PUT /me', () => {
    beforeEach(() => {
      authController.updateProfile.mockImplementation((req, res) => {
        res.json({ success: true });
      });
    });

    it('should require authentication', async () => {
      await request(app).put('/api/auth/me');
      expect(authMiddleware.required).toHaveBeenCalled();
    });

    it('should validate update data', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid data');
      });

      const response = await request(app)
        .put('/api/auth/me')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/me')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(authController.updateProfile).toHaveBeenCalled();
    });
  });

  describe('POST /logout', () => {
    beforeEach(() => {
      authController.logout.mockImplementation((req, res) => {
        res.json({ success: true });
      });
    });

    it('should require authentication', async () => {
      await request(app).post('/api/auth/logout');
      expect(authMiddleware.required).toHaveBeenCalled();
    });

    it('should handle logout request', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(authController.logout).toHaveBeenCalled();
    });
  });

  describe('POST /forgot-password', () => {
    beforeEach(() => {
      authController.forgotPassword.mockImplementation((req, res) => {
        res.json({ success: true });
      });
    });

    it('should validate email', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid email');
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should handle forgot password request', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(authController.forgotPassword).toHaveBeenCalled();
    });
  });

  describe('POST /reset-password', () => {
    beforeEach(() => {
      authController.resetPassword.mockImplementation((req, res) => {
        res.json({ success: true });
      });
    });

    it('should validate reset password data', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid data');
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should handle reset password request', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-token',
          password: 'NewPassword@123',
          confirmPassword: 'NewPassword@123'
        });

      expect(response.status).toBe(200);
      expect(authController.resetPassword).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle controller errors', async () => {
      authController.login.mockImplementation(() => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle validation errors', async () => {
      validationMiddleware.validateSchema.mockImplementation(() => {
        throw new ValidationError('Validation failed');
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle authentication errors', async () => {
      authMiddleware.required.mockImplementation(() => {
        throw new Error('Unauthorized');
      });

      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
