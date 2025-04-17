const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessError,
  DatabaseError,
  IntegrationError,
  formatError,
  errorHandler
} = require('../../../utils/errors');

describe('Error Utilities', () => {
  describe('Custom Error Classes', () => {
    describe('AppError', () => {
      it('should create base error with default status code', () => {
        const error = new AppError('Test error');
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(500);
        expect(error.name).toBe('AppError');
      });

      it('should create base error with custom status code', () => {
        const error = new AppError('Test error', 418);
        expect(error.statusCode).toBe(418);
      });

      it('should capture stack trace', () => {
        const error = new AppError('Test error');
        expect(error.stack).toBeDefined();
      });
    });

    describe('ValidationError', () => {
      it('should create validation error', () => {
        const error = new ValidationError('Invalid input');
        expect(error.message).toBe('Invalid input');
        expect(error.statusCode).toBe(400);
        expect(error.type).toBe('ValidationError');
      });
    });

    describe('AuthenticationError', () => {
      it('should create authentication error with default message', () => {
        const error = new AuthenticationError();
        expect(error.message).toBe('Não autorizado');
        expect(error.statusCode).toBe(401);
        expect(error.type).toBe('AuthenticationError');
      });

      it('should create authentication error with custom message', () => {
        const error = new AuthenticationError('Custom auth error');
        expect(error.message).toBe('Custom auth error');
      });
    });

    describe('AuthorizationError', () => {
      it('should create authorization error', () => {
        const error = new AuthorizationError();
        expect(error.statusCode).toBe(403);
        expect(error.type).toBe('AuthorizationError');
      });
    });

    describe('NotFoundError', () => {
      it('should create not found error', () => {
        const error = new NotFoundError();
        expect(error.statusCode).toBe(404);
        expect(error.type).toBe('NotFoundError');
      });
    });

    describe('ConflictError', () => {
      it('should create conflict error', () => {
        const error = new ConflictError('Resource conflict');
        expect(error.statusCode).toBe(409);
        expect(error.type).toBe('ConflictError');
      });
    });

    describe('BusinessError', () => {
      it('should create business error', () => {
        const error = new BusinessError('Business rule violation');
        expect(error.statusCode).toBe(422);
        expect(error.type).toBe('BusinessError');
      });
    });

    describe('DatabaseError', () => {
      it('should create database error', () => {
        const error = new DatabaseError();
        expect(error.statusCode).toBe(500);
        expect(error.type).toBe('DatabaseError');
      });
    });

    describe('IntegrationError', () => {
      it('should create integration error', () => {
        const error = new IntegrationError('API timeout', 'ExternalService');
        expect(error.statusCode).toBe(502);
        expect(error.type).toBe('IntegrationError');
        expect(error.service).toBe('ExternalService');
      });
    });
  });

  describe('formatError', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should format basic error', () => {
      const error = new Error('Test error');
      const formatted = formatError(error);

      expect(formatted).toEqual({
        success: false,
        error: {
          message: 'Test error',
          type: 'Error'
        }
      });
    });

    it('should include validation details', () => {
      const error = new ValidationError('Validation failed');
      error.errors = [
        { field: 'email', message: 'Invalid email' }
      ];

      const formatted = formatError(error);
      expect(formatted.error.details).toEqual(error.errors);
    });

    it('should include service name for integration errors', () => {
      const error = new IntegrationError('API error', 'PaymentService');
      const formatted = formatError(error);
      expect(formatted.error.service).toBe('PaymentService');
    });

    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      const formatted = formatError(error);
      expect(formatted.error.stack).toBeDefined();
    });

    it('should not include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      const formatted = formatError(error);
      expect(formatted.error.stack).toBeUndefined();
    });
  });

  describe('errorHandler middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        path: '/test',
        method: 'GET',
        user: { id: '123' }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should handle AppError', () => {
      const error = new AppError('Test error', 400);
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Test error'
        })
      }));
    });

    it('should handle Sequelize validation error', () => {
      const error = {
        name: 'SequelizeValidationError',
        errors: [
          { path: 'email', message: 'Invalid email' }
        ]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email'
            })
          ])
        })
      }));
    });

    it('should handle Sequelize unique constraint error', () => {
      const error = {
        name: 'SequelizeUniqueConstraintError',
        errors: [
          { path: 'email', message: 'Email must be unique' }
        ]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should handle JWT errors', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'Invalid token'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle token expiration', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'Token expired'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Erro interno do servidor'
        })
      }));
    });
  });
});
