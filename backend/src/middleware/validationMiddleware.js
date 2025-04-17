const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Middleware to validate request data against a Joi schema
 * @param {Object} schema - Joi schema to validate against
 * @param {String} property - Request property to validate (body, query, params)
 */
const validateSchema = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.context.key,
          message: detail.message.replace(/['"]/g, '')
        }));

        logger.debug('Validation Error:', {
          path: req.path,
          errors
        });

        throw new ValidationError('Erro de validação', errors);
      }

      // Replace request data with validated data
      req[property] = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to sanitize request data
 * Removes any potentially dangerous content
 */
const sanitizeData = () => {
  return (req, res, next) => {
    try {
      // Function to sanitize a single value
      const sanitizeValue = (value) => {
        if (typeof value === 'string') {
          // Remove any script tags
          value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          // Remove any HTML tags
          value = value.replace(/<[^>]*>/g, '');
          // Remove any SQL injection attempts
          value = value.replace(/['";]/g, '');
          // Trim whitespace
          value = value.trim();
        }
        return value;
      };

      // Function to recursively sanitize an object
      const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
          return obj.map(item => sanitizeObject(item));
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = sanitizeValue(value);
          }
        }
        return sanitized;
      };

      // Sanitize body, query, and params
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      if (req.query) {
        req.query = sanitizeObject(req.query);
      }
      if (req.params) {
        req.params = sanitizeObject(req.params);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate pagination parameters
 */
const validatePagination = () => {
  return (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Validate page and limit
      if (page < 1) {
        throw new ValidationError('Página deve ser maior que 0');
      }
      if (limit < 1 || limit > 100) {
        throw new ValidationError('Limite deve estar entre 1 e 100');
      }

      // Add pagination to request
      req.pagination = {
        page,
        limit,
        offset: (page - 1) * limit
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate sorting parameters
 * @param {Array} allowedFields - Array of fields that can be used for sorting
 */
const validateSort = (allowedFields) => {
  return (req, res, next) => {
    try {
      const { sort } = req.query;
      if (!sort) {
        req.sorting = [];
        return next();
      }

      const sortParams = sort.split(',').map(param => {
        const order = param.startsWith('-') ? 'DESC' : 'ASC';
        const field = param.replace(/^-/, '');

        if (!allowedFields.includes(field)) {
          throw new ValidationError(`Campo de ordenação inválido: ${field}`);
        }

        return [field, order];
      });

      req.sorting = sortParams;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate search parameters
 * @param {Array} searchableFields - Array of fields that can be searched
 */
const validateSearch = (searchableFields) => {
  return (req, res, next) => {
    try {
      const { search, searchFields } = req.query;

      if (!search) {
        req.searching = null;
        return next();
      }

      let fields = searchableFields;
      if (searchFields) {
        fields = searchFields.split(',').filter(field => 
          searchableFields.includes(field)
        );

        if (fields.length === 0) {
          throw new ValidationError('Campos de busca inválidos');
        }
      }

      req.searching = {
        term: search,
        fields
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validateSchema,
  sanitizeData,
  validatePagination,
  validateSort,
  validateSearch
};
