const express = require('express');
const request = require('supertest');
const BaseRoutes = require('../../../routes/baseRoutes');
const BaseController = require('../../../controllers/baseController');
const authMiddleware = require('../../../middleware/authMiddleware');
const validationMiddleware = require('../../../middleware/validationMiddleware');
const { ValidationError } = require('../../../utils/errors');

jest.mock('../../../middleware/authMiddleware');
jest.mock('../../../middleware/validationMiddleware');

describe('Base Routes', () => {
  let app;
  let controller;
  let routes;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create express app
    app = express();
    app.use(express.json());

    // Mock controller methods
    controller = {
      list: jest.fn().mockImplementation((req, res) => res.json({ success: true })),
      getById: jest.fn().mockImplementation((req, res) => res.json({ success: true })),
      create: jest.fn().mockImplementation((req, res) => res.status(201).json({ success: true })),
      update: jest.fn().mockImplementation((req, res) => res.json({ success: true })),
      delete: jest.fn().mockImplementation((req, res) => res.json({ success: true }))
    };

    // Mock middleware
    authMiddleware.required.mockImplementation((req, res, next) => next());
    authMiddleware.hasRole.mockImplementation(() => (req, res, next) => next());
    validationMiddleware.validateSchema.mockImplementation(() => (req, res, next) => next());
    validationMiddleware.validatePagination.mockImplementation((req, res, next) => next());
    validationMiddleware.validateSort.mockImplementation(() => (req, res, next) => next());
    validationMiddleware.validateSearch.mockImplementation(() => (req, res, next) => next());
  });

  describe('Route Configuration', () => {
    beforeEach(() => {
      routes = new BaseRoutes(controller);
      app.use('/api/test', routes.getRouter());
    });

    it('should set up all CRUD routes by default', () => {
      const routes = app._router.stack
        .filter(layer => layer.route)
        .map(layer => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods)
        }));

      expect(routes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/', methods: ['get', 'post'] }),
          expect.objectContaining({ path: '/:id', methods: ['get', 'put', 'delete'] })
        ])
      );
    });

    it('should apply authentication middleware by default', async () => {
      await request(app).get('/api/test');
      expect(authMiddleware.required).toHaveBeenCalled();
    });

    it('should apply validation middleware', async () => {
      await request(app).post('/api/test').send({});
      expect(validationMiddleware.validateSchema).toHaveBeenCalled();
    });
  });

  describe('Route Options', () => {
    it('should disable routes based on options', () => {
      routes = new BaseRoutes(controller, {}, {
        routes: {
          list: false,
          create: false
        }
      });
      app.use('/api/test', routes.getRouter());

      const enabledRoutes = app._router.stack
        .filter(layer => layer.route)
        .map(layer => layer.route.path);

      expect(enabledRoutes).not.toContain('/');
      expect(enabledRoutes).toContain('/:id');
    });

    it('should apply role-based authentication', async () => {
      routes = new BaseRoutes(controller, {}, {
        auth: true,
        roles: {
          list: ['admin'],
          create: ['admin', 'manager']
        }
      });
      app.use('/api/test', routes.getRouter());

      await request(app).get('/api/test');
      expect(authMiddleware.hasRole).toHaveBeenCalledWith(['admin']);

      await request(app).post('/api/test');
      expect(authMiddleware.hasRole).toHaveBeenCalledWith(['admin', 'manager']);
    });
  });

  describe('List Route', () => {
    beforeEach(() => {
      routes = new BaseRoutes(controller);
      app.use('/api/test', routes.getRouter());
    });

    it('should handle pagination', async () => {
      await request(app)
        .get('/api/test')
        .query({ page: 2, limit: 10 });

      expect(validationMiddleware.validatePagination).toHaveBeenCalled();
      expect(controller.list).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ page: '2', limit: '10' })
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should handle sorting', async () => {
      await request(app)
        .get('/api/test')
        .query({ sort: '-name,email' });

      expect(validationMiddleware.validateSort).toHaveBeenCalled();
    });

    it('should handle searching', async () => {
      await request(app)
        .get('/api/test')
        .query({ search: 'test', searchFields: 'name,email' });

      expect(validationMiddleware.validateSearch).toHaveBeenCalled();
    });

    it('should handle filtering', async () => {
      await request(app)
        .get('/api/test')
        .query({ filter: JSON.stringify({ status: 'active' }) });

      expect(controller.list).toHaveBeenCalled();
    });
  });

  describe('Get By ID Route', () => {
    beforeEach(() => {
      routes = new BaseRoutes(controller);
      app.use('/api/test', routes.getRouter());
    });

    it('should handle valid ID', async () => {
      await request(app).get('/api/test/123');

      expect(controller.getById).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ id: '123' })
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should validate ID parameter', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid ID');
      });

      const response = await request(app).get('/api/test/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('Create Route', () => {
    beforeEach(() => {
      routes = new BaseRoutes(controller);
      app.use('/api/test', routes.getRouter());
    });

    it('should handle valid creation request', async () => {
      const data = { name: 'Test', email: 'test@example.com' };
      await request(app)
        .post('/api/test')
        .send(data);

      expect(controller.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: data
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should validate request body', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid data');
      });

      const response = await request(app)
        .post('/api/test')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Update Route', () => {
    beforeEach(() => {
      routes = new BaseRoutes(controller);
      app.use('/api/test', routes.getRouter());
    });

    it('should handle valid update request', async () => {
      const data = { name: 'Updated' };
      await request(app)
        .put('/api/test/123')
        .send(data);

      expect(controller.update).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '123' },
          body: data
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should validate request body', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid data');
      });

      const response = await request(app)
        .put('/api/test/123')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Delete Route', () => {
    beforeEach(() => {
      routes = new BaseRoutes(controller);
      app.use('/api/test', routes.getRouter());
    });

    it('should handle delete request', async () => {
      await request(app).delete('/api/test/123');

      expect(controller.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '123' }
        }),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should validate ID parameter', async () => {
      validationMiddleware.validateSchema.mockImplementationOnce(() => {
        throw new ValidationError('Invalid ID');
      });

      const response = await request(app).delete('/api/test/invalid');

      expect(response.status).toBe(400);
    });
  });

  describe('Custom Routes', () => {
    it('should allow adding custom routes', () => {
      const customHandler = jest.fn((req, res) => res.json({ custom: true }));
      
      routes = new BaseRoutes(controller);
      routes.addRoute('get', '/custom', [], customHandler);
      app.use('/api/test', routes.getRouter());

      const hasCustomRoute = app._router.stack
        .filter(layer => layer.route)
        .some(layer => layer.route.path === '/custom');

      expect(hasCustomRoute).toBe(true);
    });

    it('should apply middleware to custom routes', async () => {
      const customHandler = jest.fn((req, res) => res.json({ custom: true }));
      const customMiddleware = jest.fn((req, res, next) => next());
      
      routes = new BaseRoutes(controller);
      routes.addRoute('get', '/custom', [customMiddleware], customHandler);
      app.use('/api/test', routes.getRouter());

      await request(app).get('/api/test/custom');

      expect(customMiddleware).toHaveBeenCalled();
      expect(customHandler).toHaveBeenCalled();
    });
  });
});
