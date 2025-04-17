const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSchema, validatePagination, validateSort, validateSearch } = require('../middleware/validationMiddleware');

class BaseRoutes {
  /**
   * Create base routes with common CRUD operations
   * @param {Object} controller - Controller instance
   * @param {Object} validations - Validation schemas
   * @param {Object} options - Route options
   */
  constructor(controller, validations = {}, options = {}) {
    this.router = express.Router();
    this.controller = controller;
    this.validations = validations;
    this.options = {
      // Default options
      auth: true,
      roles: {
        list: ['admin', 'manager', 'employee'],
        create: ['admin', 'manager'],
        update: ['admin', 'manager'],
        delete: ['admin']
      },
      searchableFields: [],
      sortableFields: ['createdAt', 'updatedAt'],
      ...options
    };

    this.setupRoutes();
  }

  /**
   * Setup default CRUD routes
   */
  setupRoutes() {
    // List route
    if (this.options.routes?.list !== false) {
      const listMiddleware = [
        validatePagination(),
        validateSort(this.options.sortableFields),
        validateSearch(this.options.searchableFields)
      ];

      if (this.options.auth) {
        listMiddleware.unshift(
          authMiddleware.hasRole(this.options.roles.list)
        );
      }

      if (this.validations.list) {
        listMiddleware.push(
          validateSchema(this.validations.list, 'query')
        );
      }

      this.router.get('/', listMiddleware, this.controller.list.bind(this.controller));
    }

    // Get by ID route
    if (this.options.routes?.getById !== false) {
      const getByIdMiddleware = [];

      if (this.options.auth) {
        getByIdMiddleware.push(
          authMiddleware.hasRole(this.options.roles.list)
        );
      }

      if (this.validations.getById) {
        getByIdMiddleware.push(
          validateSchema(this.validations.getById, 'params')
        );
      }

      this.router.get('/:id', getByIdMiddleware, this.controller.getById.bind(this.controller));
    }

    // Create route
    if (this.options.routes?.create !== false) {
      const createMiddleware = [];

      if (this.options.auth) {
        createMiddleware.push(
          authMiddleware.hasRole(this.options.roles.create)
        );
      }

      if (this.validations.create) {
        createMiddleware.push(
          validateSchema(this.validations.create)
        );
      }

      this.router.post('/', createMiddleware, this.controller.create.bind(this.controller));
    }

    // Update route
    if (this.options.routes?.update !== false) {
      const updateMiddleware = [];

      if (this.options.auth) {
        updateMiddleware.push(
          authMiddleware.hasRole(this.options.roles.update)
        );
      }

      if (this.validations.update) {
        updateMiddleware.push(
          validateSchema(this.validations.update)
        );
      }

      this.router.put('/:id', updateMiddleware, this.controller.update.bind(this.controller));
    }

    // Delete route
    if (this.options.routes?.delete !== false) {
      const deleteMiddleware = [];

      if (this.options.auth) {
        deleteMiddleware.push(
          authMiddleware.hasRole(this.options.roles.delete)
        );
      }

      if (this.validations.delete) {
        deleteMiddleware.push(
          validateSchema(this.validations.delete, 'params')
        );
      }

      this.router.delete('/:id', deleteMiddleware, this.controller.delete.bind(this.controller));
    }
  }

  /**
   * Add a custom route
   * @param {String} method - HTTP method
   * @param {String} path - Route path
   * @param {Array} middleware - Array of middleware
   * @param {Function} handler - Route handler
   */
  addRoute(method, path, middleware = [], handler) {
    this.router[method.toLowerCase()](path, middleware, handler);
  }

  /**
   * Add multiple custom routes
   * @param {Array} routes - Array of route configurations
   */
  addRoutes(routes) {
    routes.forEach(route => {
      const { method, path, middleware = [], handler } = route;
      this.addRoute(method, path, middleware, handler);
    });
  }

  /**
   * Get the configured router
   */
  getRouter() {
    return this.router;
  }

  /**
   * Add middleware to all routes
   * @param {Function} middleware - Middleware function
   */
  useMiddleware(middleware) {
    this.router.use(middleware);
  }

  /**
   * Add error handling middleware
   * @param {Function} errorHandler - Error handling middleware
   */
  useErrorHandler(errorHandler) {
    this.router.use(errorHandler);
  }

  /**
   * Add prefix to all routes
   * @param {String} prefix - Route prefix
   */
  usePrefix(prefix) {
    const router = express.Router();
    router.use(prefix, this.router);
    this.router = router;
  }

  /**
   * Add rate limiting to routes
   * @param {Object} options - Rate limiting options
   */
  useRateLimit(options) {
    const rateLimit = require('express-rate-limit');
    this.router.use(rateLimit(options));
  }

  /**
   * Add caching to routes
   * @param {String} duration - Cache duration
   */
  useCache(duration) {
    const cache = require('express-cache-middleware');
    const cacheManager = require('cache-manager');

    const cacheMiddleware = cache({
      cacheManager: cacheManager.caching({
        store: 'memory',
        max: 100,
        ttl: duration
      })
    });

    this.router.use(cacheMiddleware);
  }
}

module.exports = BaseRoutes;
