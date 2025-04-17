const { NotFoundError, ValidationError } = require('../utils/errors');
const { Op } = require('sequelize');

class BaseController {
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Get paginated list of records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async list(req, res, next) {
    try {
      const { page = 1, limit = 10, search, sort, filter } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause for filtering
      let where = {};
      if (filter) {
        try {
          const filterObj = JSON.parse(filter);
          where = this._buildFilterCriteria(filterObj);
        } catch (error) {
          throw new ValidationError('Filtro inválido');
        }
      }

      // Add search criteria if provided
      if (search) {
        where = {
          ...where,
          ...this._buildSearchCriteria(search)
        };
      }

      // Build order array for sorting
      const order = this._buildOrderCriteria(sort);

      const { rows, count } = await this.model.findAndCountAll({
        where,
        order,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single record by ID
   */
  async getById(req, res, next) {
    try {
      const record = await this.model.findByPk(req.params.id);
      
      if (!record) {
        throw new NotFoundError(`${this.modelName} não encontrado`);
      }

      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new record
   */
  async create(req, res, next) {
    try {
      const record = await this.model.create(req.body);

      res.status(201).json({
        success: true,
        data: record,
        message: `${this.modelName} criado com sucesso`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a record
   */
  async update(req, res, next) {
    try {
      const record = await this.model.findByPk(req.params.id);
      
      if (!record) {
        throw new NotFoundError(`${this.modelName} não encontrado`);
      }

      await record.update(req.body);

      res.json({
        success: true,
        data: record,
        message: `${this.modelName} atualizado com sucesso`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a record
   */
  async delete(req, res, next) {
    try {
      const record = await this.model.findByPk(req.params.id);
      
      if (!record) {
        throw new NotFoundError(`${this.modelName} não encontrado`);
      }

      await record.destroy();

      res.json({
        success: true,
        message: `${this.modelName} excluído com sucesso`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Build search criteria for query
   * @private
   */
  _buildSearchCriteria(search) {
    const searchableFields = this.model.searchableFields || ['nome', 'descricao'];
    
    return {
      [Op.or]: searchableFields.map(field => ({
        [field]: {
          [Op.like]: `%${search}%`
        }
      }))
    };
  }

  /**
   * Build filter criteria for query
   * @private
   */
  _buildFilterCriteria(filters) {
    const where = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        where[key] = {
          [Op.in]: value
        };
      } else if (typeof value === 'object') {
        where[key] = this._buildOperatorCriteria(value);
      } else {
        where[key] = value;
      }
    });

    return where;
  }

  /**
   * Build operator criteria for filters
   * @private
   */
  _buildOperatorCriteria(operators) {
    const criteria = {};

    Object.entries(operators).forEach(([op, value]) => {
      switch (op) {
        case 'eq':
          criteria[Op.eq] = value;
          break;
        case 'ne':
          criteria[Op.ne] = value;
          break;
        case 'gt':
          criteria[Op.gt] = value;
          break;
        case 'gte':
          criteria[Op.gte] = value;
          break;
        case 'lt':
          criteria[Op.lt] = value;
          break;
        case 'lte':
          criteria[Op.lte] = value;
          break;
        case 'between':
          criteria[Op.between] = value;
          break;
        case 'like':
          criteria[Op.like] = `%${value}%`;
          break;
        case 'in':
          criteria[Op.in] = Array.isArray(value) ? value : [value];
          break;
        case 'notIn':
          criteria[Op.notIn] = Array.isArray(value) ? value : [value];
          break;
      }
    });

    return criteria;
  }

  /**
   * Build order criteria for sorting
   * @private
   */
  _buildOrderCriteria(sort) {
    if (!sort) return undefined;

    return sort.split(',').map(field => {
      if (field.startsWith('-')) {
        return [field.substring(1), 'DESC'];
      }
      return [field, 'ASC'];
    });
  }

  /**
   * Check if record exists
   * @protected
   */
  async _checkExists(id) {
    const record = await this.model.findByPk(id);
    
    if (!record) {
      throw new NotFoundError(`${this.modelName} não encontrado`);
    }

    return record;
  }

  /**
   * Format success response
   * @protected
   */
  _success(data = null, message = null, statusCode = 200) {
    const response = {
      success: true
    };

    if (data) response.data = data;
    if (message) response.message = message;

    return response;
  }

  /**
   * Handle bulk operations
   * @protected
   */
  async _handleBulkOperation(records, operation) {
    const results = {
      success: [],
      errors: []
    };

    for (const record of records) {
      try {
        const result = await operation(record);
        results.success.push(result);
      } catch (error) {
        results.errors.push({
          record,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = BaseController;
