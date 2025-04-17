/**
 * Base Error class for custom application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - Used for input validation errors (400)
 */
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.type = 'ValidationError';
  }
}

/**
 * Authentication Error - Used for authentication failures (401)
 */
class AuthenticationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
    this.type = 'AuthenticationError';
  }
}

/**
 * Authorization Error - Used for permission/access denied errors (403)
 */
class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
    this.type = 'AuthorizationError';
  }
}

/**
 * Not Found Error - Used when resource is not found (404)
 */
class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
    this.type = 'NotFoundError';
  }
}

/**
 * Conflict Error - Used for resource conflicts (409)
 */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.type = 'ConflictError';
  }
}

/**
 * Business Logic Error - Used for business rule violations (422)
 */
class BusinessError extends AppError {
  constructor(message) {
    super(message, 422);
    this.type = 'BusinessError';
  }
}

/**
 * Database Error - Used for database operation errors (500)
 */
class DatabaseError extends AppError {
  constructor(message = 'Erro no banco de dados') {
    super(message, 500);
    this.type = 'DatabaseError';
  }
}

/**
 * Integration Error - Used for external service/API errors (502)
 */
class IntegrationError extends AppError {
  constructor(message, service) {
    super(`Erro na integração com ${service}: ${message}`, 502);
    this.type = 'IntegrationError';
    this.service = service;
  }
}

/**
 * Format error response for consistent error handling
 */
const formatError = (error) => {
  const response = {
    success: false,
    error: {
      message: error.message || 'Erro interno do servidor',
      type: error.type || 'Error'
    }
  };

  // Add validation errors if available
  if (error.errors) {
    response.error.details = error.errors;
  }

  // Add service name for integration errors
  if (error.service) {
    response.error.service = error.service;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    type: err.type,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const validationError = new ValidationError('Erro de validação');
    validationError.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json(formatError(validationError));
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const conflictError = new ConflictError('Registro duplicado');
    conflictError.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(409).json(formatError(conflictError));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(formatError(
      new AuthenticationError('Token inválido')
    ));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(formatError(
      new AuthenticationError('Token expirado')
    ));
  }

  // Handle custom errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(formatError(err));
  }

  // Handle unknown errors
  const serverError = new AppError(
    'Erro interno do servidor',
    500
  );
  return res.status(500).json(formatError(serverError));
};

module.exports = {
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
};
