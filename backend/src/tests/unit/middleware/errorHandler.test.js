const errorHandler = require('../../../middleware/errorHandler');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessError,
  DatabaseError,
  IntegrationError
} = require('../../../utils/errors');
const logger = require('../../../utils/logger');

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Mock request object
    req = {
      path: '/test',
      method: 'GET',
      user: { id: '123' }
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock next function
    next = jest.fn();

    // Mock logger
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Custom Errors', () => {
    it('should handle ValidationError', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email' }
      ]);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Validation failed',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Invalid email'
              })
            ])
          })
        })
      );
    });

    it('should handle AuthenticationError', () => {
      const error = new AuthenticationError('Invalid token');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid token'
          })
        })
      );
    });

    it('should handle AuthorizationError', () => {
      const error = new AuthorizationError('Insufficient permissions');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Insufficient permissions'
          })
        })
      );
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('Resource not found');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Resource not found'
          })
        })
      );
    });

    it('should handle ConflictError', () => {
      const error = new ConflictError('Resource already exists');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Resource already exists'
          })
        })
      );
    });

    it('should handle BusinessError', () => {
      const error = new BusinessError('Business rule violation');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Business rule violation'
          })
        })
      );
    });

    it('should handle DatabaseError', () => {
      const error = new DatabaseError('Database operation failed');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Database operation failed'
          })
        })
      );
    });

    it('should handle IntegrationError', () => {
      const error = new IntegrationError('API call failed', 'ExternalService');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('ExternalService'),
            service: 'ExternalService'
          })
        })
      );
    });
  });

  describe('Sequelize Errors', () => {
    it('should handle SequelizeValidationError', () => {
      const error = {
        name: 'SequelizeValidationError',
        errors: [
          {
            path: 'email',
            message: 'Email is required'
          }
        ]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: 'Email is required'
              })
            ])
          })
        })
      );
    });

    it('should handle SequelizeUniqueConstraintError', () => {
      const error = {
        name: 'SequelizeUniqueConstraintError',
        errors: [
          {
            path: 'email',
            message: 'Email must be unique'
          }
        ]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Registro duplicado'
          })
        })
      );
    });
  });

  describe('JWT Errors', () => {
    it('should handle JsonWebTokenError', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'invalid token'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Token inválido'
          })
        })
      );
    });

    it('should handle TokenExpiredError', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'jwt expired'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Token expirado'
          })
        })
      );
    });
  });

  describe('Generic Errors', () => {
    it('should handle unknown errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Erro interno do servidor'
          })
        })
      );
    });

    it('should log errors', () => {
      const error = new Error('Test error');
      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          message: 'Test error',
          stack: expect.any(String),
          path: '/test',
          method: 'GET',
          userId: '123'
        })
      );
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String)
          })
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String)
          })
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
