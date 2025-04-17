const Joi = require('joi');
const { validateSchema, sanitizeData, validatePagination, validateSort, validateSearch } = require('../../../middleware/validationMiddleware');

describe('Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validateSchema', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      age: Joi.number().min(18)
    });

    it('should pass validation with valid data', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25
      };

      const middleware = validateSchema(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        age: 25
      });
    });

    it('should strip unknown fields', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        unknown: 'field'
      };

      const middleware = validateSchema(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).not.toHaveProperty('unknown');
    });

    it('should fail validation with invalid data', async () => {
      req.body = {
        name: 'Test User',
        email: 'invalid-email',
        age: 15
      };

      const middleware = validateSchema(schema);
      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email'
              }),
              expect.objectContaining({
                field: 'age'
              })
            ])
          })
        })
      );
    });

    it('should validate query parameters', async () => {
      const querySchema = Joi.object({
        search: Joi.string(),
        limit: Joi.number().min(1)
      });

      req.query = {
        search: 'test',
        limit: '10'
      };

      const middleware = validateSchema(querySchema, 'query');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({
        search: 'test',
        limit: 10
      });
    });
  });

  describe('sanitizeData', () => {
    const middleware = sanitizeData();

    it('should sanitize HTML tags', async () => {
      req.body = {
        name: '<script>alert("xss")</script>Test User',
        description: '<p>Normal text</p>'
      };

      await middleware(req, res, next);

      expect(req.body.name).toBe('Test User');
      expect(req.body.description).toBe('Normal text');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize nested objects', async () => {
      req.body = {
        user: {
          name: '<script>alert("xss")</script>Test User',
          profile: {
            bio: '<p>Bio text</p>'
          }
        }
      };

      await middleware(req, res, next);

      expect(req.body.user.name).toBe('Test User');
      expect(req.body.user.profile.bio).toBe('Bio text');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize arrays', async () => {
      req.body = {
        tags: ['<script>tag1</script>', '<p>tag2</p>']
      };

      await middleware(req, res, next);

      expect(req.body.tags).toEqual(['tag1', 'tag2']);
      expect(next).toHaveBeenCalled();
    });

    it('should handle null and undefined values', async () => {
      req.body = {
        name: null,
        description: undefined
      };

      await middleware(req, res, next);

      expect(req.body).toEqual({
        name: null,
        description: undefined
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validatePagination', () => {
    const middleware = validatePagination();

    it('should set default pagination values', async () => {
      await middleware(req, res, next);

      expect(req.pagination).toEqual({
        page: 1,
        limit: 10,
        offset: 0
      });
      expect(next).toHaveBeenCalled();
    });

    it('should use provided pagination values', async () => {
      req.query = {
        page: '2',
        limit: '20'
      };

      await middleware(req, res, next);

      expect(req.pagination).toEqual({
        page: 2,
        limit: 20,
        offset: 20
      });
      expect(next).toHaveBeenCalled();
    });

    it('should validate page number', async () => {
      req.query = {
        page: '0'
      };

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate limit', async () => {
      req.query = {
        limit: '101'
      };

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateSort', () => {
    const allowedFields = ['name', 'email', 'createdAt'];
    const middleware = validateSort(allowedFields);

    it('should handle valid sort parameters', async () => {
      req.query = {
        sort: 'name,-email'
      };

      await middleware(req, res, next);

      expect(req.sorting).toEqual([
        ['name', 'ASC'],
        ['email', 'DESC']
      ]);
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid sort fields', async () => {
      req.query = {
        sort: 'invalid,-email'
      };

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle empty sort parameter', async () => {
      await middleware(req, res, next);

      expect(req.sorting).toEqual([]);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateSearch', () => {
    const searchableFields = ['name', 'email', 'description'];
    const middleware = validateSearch(searchableFields);

    it('should handle valid search parameters', async () => {
      req.query = {
        search: 'test',
        searchFields: 'name,email'
      };

      await middleware(req, res, next);

      expect(req.searching).toEqual({
        term: 'test',
        fields: ['name', 'email']
      });
      expect(next).toHaveBeenCalled();
    });

    it('should use all searchable fields if none specified', async () => {
      req.query = {
        search: 'test'
      };

      await middleware(req, res, next);

      expect(req.searching).toEqual({
        term: 'test',
        fields: searchableFields
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid search fields', async () => {
      req.query = {
        search: 'test',
        searchFields: 'invalid,email'
      };

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle empty search parameter', async () => {
      await middleware(req, res, next);

      expect(req.searching).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
});
