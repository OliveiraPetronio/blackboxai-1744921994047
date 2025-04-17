const request = require('supertest');
const express = require('express');
const app = require('../../server');
const { sequelize } = require('../../models');
const logger = require('../../utils/logger');

describe('Server Configuration', () => {
  beforeAll(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    await sequelize.close();
    jest.clearAllMocks();
  });

  describe('Express App Configuration', () => {
    it('should be an express application', () => {
      expect(app).toBeInstanceOf(express.application.constructor);
    });

    it('should use JSON middleware', async () => {
      const response = await request(app)
        .post('/api/test-json')
        .send({ test: 'data' });

      expect(response.status).not.toBe(415); // Unsupported Media Type
    });

    it('should use URL-encoded middleware', async () => {
      const response = await request(app)
        .post('/api/test-urlencoded')
        .send('test=data');

      expect(response.status).not.toBe(415); // Unsupported Media Type
    });

    it('should use CORS middleware', async () => {
      const response = await request(app)
        .options('/api/test-cors')
        .set('Origin', 'http://localhost:8000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should use security middleware', async () => {
      const response = await request(app).get('/');

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use default port when not specified', () => {
      delete process.env.PORT;
      const { PORT } = require('../../config/environment');
      expect(PORT).toBe(3000);
    });

    it('should use environment port when specified', () => {
      process.env.PORT = '4000';
      const { PORT } = require('../../config/environment');
      expect(PORT).toBe(4000);
    });

    it('should use correct node environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('API Routes', () => {
    it('should handle /api/health endpoint', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle /api/version endpoint', async () => {
      const response = await request(app).get('/api/version');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          version: expect.any(String)
        })
      );
    });

    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/undefined-route');

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.any(String)
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle synchronous errors', async () => {
      const response = await request(app).get('/api/test-error');

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.any(String)
          })
        })
      );
    });

    it('should handle asynchronous errors', async () => {
      const response = await request(app).get('/api/test-async-error');

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.any(String)
          })
        })
      );
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            details: expect.any(Array)
          })
        })
      );
    });
  });

  describe('Middleware Order', () => {
    it('should apply security headers before routes', async () => {
      const response = await request(app).get('/');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
    });

    it('should apply CORS headers before routes', async () => {
      const response = await request(app)
        .options('/')
        .set('Origin', 'http://localhost:8000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should parse JSON before handling routes', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ test: 'data' });

      expect(response.status).not.toBe(415);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API routes', async () => {
      const requests = Array(101).fill().map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.some(r => r.status === 429);

      expect(tooManyRequests).toBe(true);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('Static Files', () => {
    it('should serve static files', async () => {
      // Assuming you have a test.html file in your public directory
      const response = await request(app).get('/test.html');
      expect(response.status).not.toBe(404);
    });

    it('should set correct content type for static files', async () => {
      const response = await request(app).get('/test.html');
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('Request Logging', () => {
    it('should log API requests', async () => {
      const logSpy = jest.spyOn(logger, 'info');
      
      await request(app).get('/api/health');

      expect(logSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/health')
      );
    });

    it('should log request errors', async () => {
      const logSpy = jest.spyOn(logger, 'error');
      
      await request(app).get('/api/undefined-route');

      expect(logSpy).toHaveBeenCalled();
    });
  });
});
