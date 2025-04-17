/**
 * Response Handler Utility
 * Standardizes API responses across the application
 */

class ResponseHandler {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {String} message - Success message
   * @param {Number} statusCode - HTTP status code
   */
  static success(res, data = null, message = null, statusCode = 200) {
    const response = {
      success: true
    };

    if (data !== null) {
      response.data = data;
    }

    if (message !== null) {
      response.message = message;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   * @param {Object} errors - Detailed error information
   */
  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      error: {
        message
      }
    };

    if (errors !== null) {
      response.error.details = errors;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && errors?.stack) {
      response.error.stack = errors.stack;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {Object} pagination - Pagination information
   * @param {String} message - Success message
   */
  static paginated(res, data, pagination, message = null) {
    const response = {
      success: true,
      data,
      pagination: {
        page: parseInt(pagination.page),
        limit: parseInt(pagination.limit),
        total: pagination.total,
        pages: Math.ceil(pagination.total / pagination.limit)
      }
    };

    if (message !== null) {
      response.message = message;
    }

    return res.status(200).json(response);
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {Object} data - Created resource data
   * @param {String} message - Success message
   */
  static created(res, data, message = 'Recurso criado com sucesso') {
    return this.success(res, data, message, 201);
  }

  /**
   * Send no content response
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send bad request response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Object} errors - Validation errors
   */
  static badRequest(res, message = 'Requisição inválida', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static unauthorized(res, message = 'Não autorizado') {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static forbidden(res, message = 'Acesso negado') {
    return this.error(res, message, 403);
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static notFound(res, message = 'Recurso não encontrado') {
    return this.error(res, message, 404);
  }

  /**
   * Send conflict response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   */
  static conflict(res, message = 'Conflito detectado') {
    return this.error(res, message, 409);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {Object} errors - Validation errors
   * @param {String} message - Error message
   */
  static validationError(res, errors, message = 'Erro de validação') {
    return this.error(res, message, 422, errors);
  }

  /**
   * Send file response
   * @param {Object} res - Express response object
   * @param {Buffer} file - File buffer
   * @param {String} filename - File name
   * @param {String} mimetype - File MIME type
   */
  static file(res, file, filename, mimetype) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', mimetype);
    return res.send(file);
  }

  /**
   * Send stream response
   * @param {Object} res - Express response object
   * @param {Stream} stream - Data stream
   * @param {String} filename - File name
   * @param {String} mimetype - File MIME type
   */
  static stream(res, stream, filename, mimetype) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', mimetype);
    return stream.pipe(res);
  }

  /**
   * Send PDF response
   * @param {Object} res - Express response object
   * @param {Buffer} pdf - PDF buffer
   * @param {String} filename - File name
   */
  static pdf(res, pdf, filename) {
    return this.file(res, pdf, filename, 'application/pdf');
  }

  /**
   * Send Excel response
   * @param {Object} res - Express response object
   * @param {Buffer} excel - Excel buffer
   * @param {String} filename - File name
   */
  static excel(res, excel, filename) {
    return this.file(res, excel, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  /**
   * Send CSV response
   * @param {Object} res - Express response object
   * @param {Buffer} csv - CSV buffer
   * @param {String} filename - File name
   */
  static csv(res, csv, filename) {
    return this.file(res, csv, filename, 'text/csv');
  }
}

module.exports = ResponseHandler;
