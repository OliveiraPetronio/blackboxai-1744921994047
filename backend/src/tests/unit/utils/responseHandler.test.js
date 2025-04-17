const ResponseHandler = require('../../../utils/responseHandler');

describe('Response Handler', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
  });

  describe('success', () => {
    it('should send basic success response', () => {
      ResponseHandler.success(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true
      });
    });

    it('should include data in success response', () => {
      const data = { id: 1, name: 'Test' };
      ResponseHandler.success(res, data);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data
      });
    });

    it('should include message in success response', () => {
      ResponseHandler.success(res, null, 'Operation successful');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operation successful'
      });
    });

    it('should use custom status code', () => {
      ResponseHandler.success(res, null, null, 201);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('error', () => {
    it('should send basic error response', () => {
      ResponseHandler.error(res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal Server Error'
        }
      });
    });

    it('should include custom error message', () => {
      ResponseHandler.error(res, 'Custom error');

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Custom error'
        }
      });
    });

    it('should include error details', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      ResponseHandler.error(res, 'Validation failed', 400, errors);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
    });
  });

  describe('paginated', () => {
    it('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 20
      };

      ResponseHandler.paginated(res, data, pagination);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 20,
          pages: 2
        }
      });
    });

    it('should include optional message', () => {
      ResponseHandler.paginated(res, [], { page: 1, limit: 10, total: 0 }, 'No records found');

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'No records found'
      }));
    });
  });

  describe('created', () => {
    it('should send created response', () => {
      const data = { id: 1 };
      ResponseHandler.created(res, data);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Recurso criado com sucesso'
      });
    });
  });

  describe('noContent', () => {
    it('should send no content response', () => {
      ResponseHandler.noContent(res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('error responses', () => {
    it('should send bad request response', () => {
      ResponseHandler.badRequest(res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Requisição inválida'
        })
      }));
    });

    it('should send unauthorized response', () => {
      ResponseHandler.unauthorized(res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should send forbidden response', () => {
      ResponseHandler.forbidden(res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should send not found response', () => {
      ResponseHandler.notFound(res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should send conflict response', () => {
      ResponseHandler.conflict(res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('file responses', () => {
    it('should send file response', () => {
      const buffer = Buffer.from('test');
      ResponseHandler.file(res, buffer, 'test.txt', 'text/plain');

      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="test.txt"');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
      expect(res.send).toHaveBeenCalledWith(buffer);
    });

    it('should send PDF response', () => {
      const buffer = Buffer.from('pdf content');
      ResponseHandler.pdf(res, buffer, 'document.pdf');

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    });

    it('should send Excel response', () => {
      const buffer = Buffer.from('excel content');
      ResponseHandler.excel(res, buffer, 'report.xlsx');

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('should send CSV response', () => {
      const buffer = Buffer.from('csv content');
      ResponseHandler.csv(res, buffer, 'data.csv');

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    });
  });

  describe('validation error', () => {
    it('should send validation error response', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' }
      ];

      ResponseHandler.validationError(res, errors);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Erro de validação',
          details: errors
        }
      });
    });
  });
});
