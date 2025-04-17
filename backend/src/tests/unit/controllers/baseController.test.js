const BaseController = require('../../../controllers/baseController');
const { User } = require('../../../models');
const { NotFoundError } = require('../../../utils/errors');

describe('Base Controller', () => {
  let controller;
  let req;
  let res;
  let next;

  beforeEach(() => {
    controller = new BaseController(User, 'User');
    
    req = {
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  afterEach(async () => {
    await User.destroy({ where: {}, force: true });
  });

  describe('list', () => {
    beforeEach(async () => {
      await User.bulkCreate([
        { name: 'User 1', email: 'user1@test.com', password: 'password1' },
        { name: 'User 2', email: 'user2@test.com', password: 'password2' },
        { name: 'User 3', email: 'user3@test.com', password: 'password3' }
      ]);
    });

    it('should list records with pagination', async () => {
      req.query = { page: 1, limit: 2 };
      await controller.list(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 2,
            total: 3
          })
        })
      );
      expect(res.json.mock.calls[0][0].data).toHaveLength(2);
    });

    it('should filter records', async () => {
      req.query = { filter: JSON.stringify({ name: 'User 1' }) };
      await controller.list(req, res, next);

      expect(res.json.mock.calls[0][0].data).toHaveLength(1);
      expect(res.json.mock.calls[0][0].data[0].name).toBe('User 1');
    });

    it('should search records', async () => {
      req.query = { search: 'user2' };
      await controller.list(req, res, next);

      expect(res.json.mock.calls[0][0].data).toHaveLength(1);
      expect(res.json.mock.calls[0][0].data[0].email).toBe('user2@test.com');
    });

    it('should sort records', async () => {
      req.query = { sort: '-name' };
      await controller.list(req, res, next);

      const data = res.json.mock.calls[0][0].data;
      expect(data[0].name).toBe('User 3');
      expect(data[2].name).toBe('User 1');
    });

    it('should handle invalid filter JSON', async () => {
      req.query = { filter: 'invalid-json' };
      await controller.list(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Filtro inválido'
        })
      );
    });
  });

  describe('getById', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password'
      });
    });

    it('should get record by id', async () => {
      req.params.id = testUser.id;
      await controller.getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: testUser.id,
          name: testUser.name
        })
      });
    });

    it('should handle non-existent record', async () => {
      req.params.id = 'non-existent-id';
      await controller.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.any(NotFoundError)
      );
    });
  });

  describe('create', () => {
    it('should create new record', async () => {
      req.body = {
        name: 'New User',
        email: 'new@test.com',
        password: 'password'
      };

      await controller.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: 'New User',
            email: 'new@test.com'
          })
        })
      );
    });

    it('should handle validation errors', async () => {
      req.body = {
        name: 'New User'
        // missing required email
      };

      await controller.create(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password'
      });
    });

    it('should update existing record', async () => {
      req.params.id = testUser.id;
      req.body = {
        name: 'Updated User'
      };

      await controller.update(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: 'Updated User'
          })
        })
      );
    });

    it('should handle non-existent record', async () => {
      req.params.id = 'non-existent-id';
      req.body = { name: 'Updated User' };

      await controller.update(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.any(NotFoundError)
      );
    });
  });

  describe('delete', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password'
      });
    });

    it('should delete existing record', async () => {
      req.params.id = testUser.id;
      await controller.delete(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User excluído com sucesso'
      });

      const deletedUser = await User.findByPk(testUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should handle non-existent record', async () => {
      req.params.id = 'non-existent-id';
      await controller.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.any(NotFoundError)
      );
    });
  });

  describe('Helper Methods', () => {
    describe('_buildSearchCriteria', () => {
      it('should build search criteria for default fields', () => {
        const criteria = controller._buildSearchCriteria('test');
        expect(criteria).toHaveProperty('$or');
      });
    });

    describe('_buildFilterCriteria', () => {
      it('should handle simple filters', () => {
        const filters = { name: 'test' };
        const criteria = controller._buildFilterCriteria(filters);
        expect(criteria).toEqual({ name: 'test' });
      });

      it('should handle array filters', () => {
        const filters = { id: ['1', '2'] };
        const criteria = controller._buildFilterCriteria(filters);
        expect(criteria.id).toHaveProperty('$in');
      });

      it('should handle operator filters', () => {
        const filters = { age: { gt: 18 } };
        const criteria = controller._buildFilterCriteria(filters);
        expect(criteria.age).toHaveProperty('$gt');
      });
    });

    describe('_buildOrderCriteria', () => {
      it('should handle ascending sort', () => {
        const order = controller._buildOrderCriteria('name');
        expect(order).toEqual([['name', 'ASC']]);
      });

      it('should handle descending sort', () => {
        const order = controller._buildOrderCriteria('-name');
        expect(order).toEqual([['name', 'DESC']]);
      });

      it('should handle multiple sort fields', () => {
        const order = controller._buildOrderCriteria('name,-email');
        expect(order).toEqual([
          ['name', 'ASC'],
          ['email', 'DESC']
        ]);
      });
    });
  });
});
