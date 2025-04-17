
/**
 * @fileoverview Test Helpers Module
 * @module tests/helpers
 * @version 1.0.0
 * @author Retail Management System Team
 * @license MIT
 * @description 
 * This module provides a comprehensive set of testing utilities and helpers for the retail management system.
 * 
 * The helpers are organized into logical groups:
 * - Factories: Create test entities with default values
 * - Authentication: JWT token management and user authentication
 * - Database: Clean up and initialization utilities
 * - Assertions: Custom response validation helpers
 * - Utilities: General purpose testing functions
 * It includes factories for creating test data, utilities for authentication, database operations,
 * and various assertion helpers.
 * 
 * Key Features:
 * - Factory functions for all models (User, Cliente, Produto, etc.)
 * - Authentication helpers for JWT token management
 * - Database cleanup and initialization utilities
 * - Bulk operations for creating and managing test data
 * - Custom assertions for API responses
 * - Date manipulation helpers
 * - Utility functions for common testing operations
 * 
 * @example
 * // Create test entities
 * const user = await createTestUser();
 * const cliente = await createTestCliente();
 * 
 * // Create complete test environment
 * const env = await createTestEnvironment();
 * 
 * // Clean up after tests
 * await cleanupTestEnvironment(env);
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Cliente, Produto, Venda, ItemVenda, Categoria, Fornecedor, Transportadora, ContaBancaria, NotaFiscal, ContaPagar, ContaReceber } = require('../models');

/**
 * Authentication Helpers
 * @namespace authHelpers
 * @description Helper functions for authentication-related test operations
 */
const authHelpers = {
  /**
   * Creates a JWT token for a user
   * @param {Object} user - User object to create token for
   * @param {string} [expiresIn='1h'] - Token expiration time
   * @returns {Promise<string>} JWT token
   */
  async createToken(user, expiresIn = '1h') {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn }
    );
  },

  /**
   * Creates an Authorization header with Bearer token
   * @param {string} token - JWT token
   * @returns {Object} Header object with Authorization
   */
  getAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
  },

  /**
   * Creates a token for a new admin user
   * @returns {Promise<string>} JWT token for admin
   */
  async getAdminToken() {
    const admin = await this.createAdminUser();
    return this.createToken(admin);
  },

  /**
   * Creates a token for a new manager user
   * @returns {Promise<string>} JWT token for manager
   */
  async getManagerToken() {
    const manager = await this.createManagerUser();
    return this.createToken(manager);
  },

  /**
   * Creates a token for a new employee user
   * @returns {Promise<string>} JWT token for employee
   */
  async getEmployeeToken() {
    const employee = await this.createEmployeeUser();
    return this.createToken(employee);
  }
};

/**
 * User Factory Helpers
 * @namespace userFactory
 * @description Factory functions for creating test user entities
 */
const userFactory = {
  /**
   * Creates a test user record with default values
   * @param {Object} overrides - Override default values
   * @returns {Promise<import('../models').User>} Created user record
   * @example
   * const user = await createUser({ role: 'manager' });
   */
  async createUser(overrides = {}) {
    const defaultUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: await bcrypt.hash('Test@123', 10),
      role: 'employee',
      status: 'active'
    };

    return User.create({ ...defaultUser, ...overrides });
  },

  /**
   * Creates a test admin user record
   * @param {Object} overrides - Override default values
   * @returns {Promise<import('../models').User>} Created admin user record
   * @example
   * const admin = await createAdminUser({ name: 'Admin User' });
   */
  async createAdminUser(overrides = {}) {
    return this.createUser({ role: 'admin', ...overrides });
  },

  /**
   * Creates a test manager user record
   * @param {Object} overrides - Override default values
   * @returns {Promise<import('../models').User>} Created manager user record
   * @example
   * const manager = await createManagerUser({ name: 'Manager User' });
   */
  async createManagerUser(overrides = {}) {
    return this.createUser({ role: 'manager', ...overrides });
  },

  /**
   * Creates a test employee user record
   * @param {Object} overrides - Override default values
   * @returns {Promise<import('../models').User>} Created employee user record
   * @example
   * const employee = await createEmployeeUser({ name: 'Employee User' });
   */
  async createEmployeeUser(overrides = {}) {
    return this.createUser({ role: 'employee', ...overrides });
  }
};

/**
 * Cliente Factory Helpers
 * @namespace clienteFactory
 * @description Factory functions for creating test client entities
 */
const clienteFactory = {
  /**
   * Creates a test client record
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.tipo='PF'] - Client type (PF/PJ)
   * @param {string} [overrides.nome] - Client name
   * @param {string} [overrides.cpf_cnpj] - CPF/CNPJ number
   * @param {string} [overrides.telefone] - Phone number
   * @param {string} [overrides.email] - Email address
   * @param {string} [overrides.status='ativo'] - Client status
   * @returns {Promise<import('../models').Cliente>} Created client record
   * @example
   * const cliente = await createCliente({
   *   nome: 'Test Client',
   *   email: 'client@test.com'
   * });
   */
  async createCliente(overrides = {}) {
    const defaultCliente = {
      tipo: 'PF',
      nome: 'Test Cliente',
      cpf_cnpj: `${Date.now()}`,
      telefone: '1199999999',
      email: `cliente${Date.now()}@example.com`,
      cep: '12345678',
      endereco: 'Test Street',
      numero: '123',
      bairro: 'Test District',
      cidade: 'Test City',
      estado: 'SP',
      status: 'ativo'
    };

    return Cliente.create({ ...defaultCliente, ...overrides });
  }
};

/**
 * Produto Factory Helpers
 * @namespace produtoFactory
 * @description Factory functions for creating test product entities
 */
const produtoFactory = {
  /**
   * Creates a test product record
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.codigo] - Product code
   * @param {string} [overrides.descricao] - Product description
   * @param {string} [overrides.unidade='UN'] - Unit of measure
   * @param {number} [overrides.preco_custo] - Cost price
   * @param {number} [overrides.preco_venda] - Sale price
   * @param {number} [overrides.estoque_minimo] - Minimum stock level
   * @param {number} [overrides.estoque_atual] - Current stock level
   * @param {string} [overrides.status='ativo'] - Product status
   * @returns {Promise<import('../models').Produto>} Created product record
   * @example
   * const produto = await createProduto({
   *   descricao: 'Test Product',
   *   preco_venda: 29.99
   * });
   */
  async createProduto(overrides = {}) {
    const defaultProduto = {
      codigo: `TEST-${Date.now()}`,
      descricao: 'Test Product',
      unidade: 'UN',
      preco_custo: 10.00,
      preco_venda: 20.00,
      estoque_minimo: 5,
      estoque_atual: 10,
      status: 'ativo'
    };

    return Produto.create({ ...defaultProduto, ...overrides });
  }
};

/**
 * Venda Factory Helpers
 * @namespace vendaFactory
 * @description Factory functions for creating test sale entities and related items
 */
const vendaFactory = {
  /**
   * Creates a test sale record
   * @param {Object} cliente - Client record to associate with the sale
   * @param {Object} vendedor - User record (seller) to associate with the sale
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.tipo_venda='balcao'] - Sale type
   * @param {string} [overrides.status='pendente'] - Sale status
   * @param {number} [overrides.subtotal] - Sale subtotal
   * @param {number} [overrides.valor_total] - Sale total value
   * @param {string} [overrides.forma_pagamento='dinheiro'] - Payment method
   * @returns {Promise<import('../models').Venda>} Created sale record
   * @example
   * const venda = await createVenda(cliente, vendedor, {
   *   valor_total: 150.00,
   *   forma_pagamento: 'cartao'
   * });
   */
  async createVenda(cliente, vendedor, overrides = {}) {
    const defaultVenda = {
      cliente_id: cliente.id,
      vendedor_id: vendedor.id,
      tipo_venda: 'balcao',
      status: 'pendente',
      subtotal: 100.00,
      valor_total: 100.00,
      forma_pagamento: 'dinheiro'
    };

    return Venda.create({ ...defaultVenda, ...overrides });
  },

  /**
   * Creates a test sale item record
   * @param {Object} venda - Sale record to associate with the item
   * @param {Object} produto - Product record to associate with the item
   * @param {Object} overrides - Override default values
   * @param {number} [overrides.quantidade=1] - Item quantity
   * @param {number} [overrides.preco_unitario] - Unit price
   * @param {number} [overrides.valor_total] - Total value
   * @returns {Promise<import('../models').ItemVenda>} Created sale item record
   * @example
   * const item = await createItemVenda(venda, produto, {
   *   quantidade: 2,
   *   preco_unitario: 25.00
   * });
   */
  async createItemVenda(venda, produto, overrides = {}) {
    const defaultItem = {
      venda_id: venda.id,
      produto_id: produto.id,
      quantidade: 1,
      preco_unitario: produto.preco_venda,
      valor_total: produto.preco_venda
    };

    return ItemVenda.create({ ...defaultItem, ...overrides });
  }
};

/**
 * Categoria Factory Helpers
 * @namespace categoriaFactory
 * @description Factory functions for creating test category entities
 */
const categoriaFactory = {
  /**
   * Creates a test category record
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.nome] - Category name
   * @param {string} [overrides.codigo] - Category code
   * @param {string} [overrides.status='ativa'] - Category status
   * @returns {Promise<import('../models').Categoria>} Created category record
   * @example
   * const categoria = await createCategoria({
   *   nome: 'Electronics',
   *   codigo: 'ELEC-001'
   * });
   */
  async createCategoria(overrides = {}) {
    const defaultCategoria = {
      nome: `Test Category ${Date.now()}`,
      codigo: `CAT-${Date.now()}`,
      status: 'ativa'
    };

    return Categoria.create({ ...defaultCategoria, ...overrides });
  }
};

/**
 * Database Operation Helpers
 * @namespace dbHelpers
 * @description Helper functions for database operations in tests
 * @example
 * // Clean all test data
 * await dbHelpers.cleanDb();
 * 
 * // Truncate specific tables
 * await dbHelpers.truncateTables();
 */
const dbHelpers = {
  /**
   * Cleans up all test data from the database
   * @returns {Promise<void>}
   * @example
   * // Clean up before/after tests
   * await cleanDb();
   */
  async cleanDb() {
    await Promise.all([
      User.destroy({ where: {}, force: true }),
      Cliente.destroy({ where: {}, force: true }),
      Produto.destroy({ where: {}, force: true }),
      Venda.destroy({ where: {}, force: true }),
      ItemVenda.destroy({ where: {}, force: true }),
      Categoria.destroy({ where: {}, force: true }),
      Fornecedor.destroy({ where: {}, force: true }),
      Transportadora.destroy({ where: {}, force: true }),
      ContaBancaria.destroy({ where: {}, force: true }),
      NotaFiscal.destroy({ where: {}, force: true }),
      ContaPagar.destroy({ where: {}, force: true }),
      ContaReceber.destroy({ where: {}, force: true })
    ]);
  },

  /**
   * Truncates all tables in the database
   * @returns {Promise<void>}
   * @example
   * // Reset all tables before tests
   * await truncateTables();
   */
  async truncateTables() {
    const models = [
      User, 
      Cliente, 
      Produto, 
      Venda, 
      ItemVenda, 
      Categoria,
      Fornecedor,
      Transportadora,
      ContaBancaria,
      NotaFiscal,
      ContaPagar,
      ContaReceber
    ];
    for (const model of models) {
      await model.truncate({ cascade: true, force: true });
    }
  }
};

/**
 * Mock Request/Response Helpers
 * @namespace mockHelpers
 * @description Helper functions for mocking Express request/response objects in tests
 * @example
 * const req = mockHelpers.mockRequest({ user: testUser });
 * const res = mockHelpers.mockResponse();
 * const next = mockHelpers.mockNext;
 * 
 * await controller.method(req, res, next);
 */
const mockHelpers = {
  /**
   * Creates a mock Express request object
   * @param {Object} overrides - Override default request properties
   * @returns {Object} Mock request object with common properties
   * @example
   * const req = mockRequest({
   *   user: testUser,
   *   params: { id: '123' }
   * });
   */
  mockRequest(overrides = {}) {
    return {
      body: {},
      query: {},
      params: {},
      headers: {},
      user: null,
      ...overrides
    };
  },

  /**
   * Creates a mock Express response object with jest spy functions
   * @returns {Object} Mock response object with common methods
   * @example
   * const res = mockResponse();
   * expect(res.status).toHaveBeenCalledWith(200);
   * expect(res.json).toHaveBeenCalledWith({ success: true });
   */
  mockResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  },

  /**
   * Mock Express next middleware function
   * @type {jest.Mock}
   * @example
   * await middleware(req, res, mockNext);
   * expect(mockNext).toHaveBeenCalledWith(error);
   */
  mockNext: jest.fn()
};

/**
 * Test Data
 * @namespace testData
 * @description Predefined test data for various entities
 * @example
 * // Use predefined user data
 * const user = await User.create(testData.validUserData);
 * 
 * // Use predefined client data
 * const cliente = await Cliente.create(testData.validClienteData);
 */
const testData = {
  validUserData: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@123',
    confirmPassword: 'Test@123'
  },

  validClienteData: {
    tipo: 'PF',
    nome: 'Test Cliente',
    cpf_cnpj: '12345678901',
    telefone: '1199999999',
    email: 'cliente@example.com'
  },

  validProdutoData: {
    codigo: 'TEST-001',
    descricao: 'Test Product',
    unidade: 'UN',
    preco_custo: 10.00,
    preco_venda: 20.00
  },

  validFornecedorData: {
    razao_social: 'Test Fornecedor LTDA',
    nome_fantasia: 'Test Fornecedor',
    cnpj: '12345678901234',
    telefone: '1199999999',
    email: 'fornecedor@example.com',
    status: 'ativo'
  },

  validTransportadoraData: {
    razao_social: 'Test Transportadora LTDA',
    nome_fantasia: 'Test Transportadora',
    cnpj: '12345678901234',
    telefone: '1199999999',
    email: 'transportadora@example.com',
    status: 'ativo'
  },

  validContaBancariaData: {
    banco: 'Test Bank',
    agencia: '1234',
    conta: '123456',
    tipo: 'corrente',
    status: 'ativa'
  },

  validNotaFiscalData: {
    numero: 'NF001',
    serie: '1',
    valor_total: 100.00,
    status: 'emitida'
  },

  validContaPagarData: {
    descricao: 'Test Conta a Pagar',
    valor: 100.00,
    data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'pendente'
  },

  validContaReceberData: {
    descricao: 'Test Conta a Receber',
    valor: 100.00,
    data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'pendente'
  }
};

/**
 * Response Assertion Helpers
 * @namespace assertHelpers
 * @description Helper functions for asserting API response structures and values
 * @example
 * // Assert successful response
 * assertSuccess(response, 201);
 * 
 * // Assert error response
 * assertError(response, 400, 'Invalid input');
 * 
 * // Assert validation error
 * assertValidationError(response, 'email');
 */
const assertHelpers = {
  /**
   * Asserts that a response contains an error with the expected status and message
   * @param {Object} response - Express response object
   * @param {number} status - Expected HTTP status code
   * @param {string} [message] - Expected error message
   * @throws {Error} When assertions fail
   * @example
   * assertError(response, 404, 'User not found');
   */
  assertError(response, status, message) {
    expect(response.status).toBe(status);
    expect(response.body.success).toBe(false);
    if (message) {
      expect(response.body.error.message).toBe(message);
    }
  },

  /**
   * Asserts that a response indicates success with the expected status
   * @param {Object} response - Express response object
   * @param {number} [status=200] - Expected HTTP status code
   * @throws {Error} When assertions fail
   * @example
   * assertSuccess(response);
   * assertSuccess(response, 201);
   */
  assertSuccess(response, status = 200) {
    expect(response.status).toBe(status);
    expect(response.body.success).toBe(true);
  },

  /**
   * Asserts that a response contains validation errors
   * @param {Object} response - Express response object
   * @param {string} [field] - Specific field to check for validation errors
   * @throws {Error} When assertions fail
   * @example
   * assertValidationError(response);
   * assertValidationError(response, 'email');
   */
  assertValidationError(response, field) {
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.details).toBeDefined();
    if (field) {
      expect(response.body.error.details.some(error => error.field === field)).toBe(true);
    }
  }
};

/**
 * Date Manipulation Helpers
 * @namespace dateHelpers
 * @description Helper functions for manipulating dates in tests
 * @example
 * // Get future date
 * const nextWeek = dateHelpers.futureDate(7);
 * 
 * // Get past date
 * const lastWeek = dateHelpers.pastDate(7);
 */
const dateHelpers = {
  /**
   * Creates a date in the future
   * @param {number} [days=1] - Number of days in the future
   * @returns {Date} Future date
   * @example
   * const nextWeek = futureDate(7);
   * const tomorrow = futureDate();
   */
  futureDate(days = 1) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  },

  /**
   * Creates a date in the past
   * @param {number} [days=1] - Number of days in the past
   * @returns {Date} Past date
   * @example
   * const lastWeek = pastDate(7);
   * const yesterday = pastDate();
   */
  pastDate(days = 1) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
};

/**
 * Fornecedor Factory Helpers
 * @namespace fornecedorFactory
 * @description Factory functions for creating test supplier entities
 */
const fornecedorFactory = {
  /**
   * Creates a test supplier record
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.razao_social] - Company legal name
   * @param {string} [overrides.nome_fantasia] - Company trade name
   * @param {string} [overrides.cnpj] - CNPJ number
   * @param {string} [overrides.telefone] - Phone number
   * @param {string} [overrides.email] - Email address
   * @param {string} [overrides.status='ativo'] - Supplier status
   * @returns {Promise<import('../models').Fornecedor>} Created supplier record
   * @example
   * const fornecedor = await createFornecedor({
   *   nome_fantasia: 'Test Supplier',
   *   email: 'supplier@test.com'
   * });
   */
  async createFornecedor(overrides = {}) {
    const defaultFornecedor = {
      razao_social: 'Test Fornecedor LTDA',
      nome_fantasia: 'Test Fornecedor',
      cnpj: `${Date.now()}`,
      telefone: '1199999999',
      email: `fornecedor${Date.now()}@example.com`,
      status: 'ativo'
    };
    return Fornecedor.create({ ...defaultFornecedor, ...overrides });
  }
};

/**
 * Transportadora Factory Helpers
 * @namespace transportadoraFactory
 * @description Factory functions for creating test carrier entities
 */
const transportadoraFactory = {
  /**
   * Creates a test carrier record
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.razao_social] - Company legal name
   * @param {string} [overrides.nome_fantasia] - Company trade name
   * @param {string} [overrides.cnpj] - CNPJ number
   * @param {string} [overrides.telefone] - Phone number
   * @param {string} [overrides.email] - Email address
   * @param {string} [overrides.status='ativo'] - Carrier status
   * @returns {Promise<import('../models').Transportadora>} Created carrier record
   * @example
   * const transportadora = await createTransportadora({
   *   nome_fantasia: 'Test Carrier',
   *   email: 'carrier@test.com'
   * });
   */
  async createTransportadora(overrides = {}) {
    const defaultTransportadora = {
      razao_social: 'Test Transportadora LTDA',
      nome_fantasia: 'Test Transportadora',
      cnpj: `${Date.now()}`,
      telefone: '1199999999',
      email: `transportadora${Date.now()}@example.com`,
      status: 'ativo'
    };
    return Transportadora.create({ ...defaultTransportadora, ...overrides });
  }
};

/**
 * ContaBancaria Factory Helpers
 * @namespace contaBancariaFactory
 * @description Factory functions for creating test bank account entities
 */
const contaBancariaFactory = {
  /**
   * Creates a test bank account record
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.banco] - Bank name
   * @param {string} [overrides.agencia] - Branch number
   * @param {string} [overrides.conta] - Account number
   * @param {string} [overrides.tipo='corrente'] - Account type
   * @param {string} [overrides.status='ativa'] - Account status
   * @returns {Promise<import('../models').ContaBancaria>} Created bank account record
   * @example
   * const conta = await createContaBancaria({
   *   banco: 'Test Bank',
   *   agencia: '1234'
   * });
   */
  async createContaBancaria(overrides = {}) {
    const defaultConta = {
      banco: 'Test Bank',
      agencia: '1234',
      conta: '123456',
      tipo: 'corrente',
      status: 'ativa'
    };
    return ContaBancaria.create({ ...defaultConta, ...overrides });
  }
};

/**
 * NotaFiscal Factory Helpers
 * @namespace notaFiscalFactory
 * @description Factory functions for creating test invoice entities
 */
const notaFiscalFactory = {
  /**
   * Creates a test invoice record
   * @param {Object} venda - Sale record to associate with the invoice
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.numero] - Invoice number
   * @param {string} [overrides.serie] - Invoice series
   * @param {number} [overrides.valor_total] - Total value
   * @param {string} [overrides.status='emitida'] - Invoice status
   * @returns {Promise<import('../models').NotaFiscal>} Created invoice record
   * @example
   * const nota = await createNotaFiscal(venda, {
   *   numero: 'NF001',
   *   valor_total: 150.00
   * });
   */
  async createNotaFiscal(venda, overrides = {}) {
    const defaultNota = {
      venda_id: venda.id,
      numero: `NF${Date.now()}`,
      serie: '1',
      valor_total: venda.valor_total,
      status: 'emitida'
    };
    return NotaFiscal.create({ ...defaultNota, ...overrides });
  }
};

/**
 * Conta Factory Helpers
 * @namespace contaFactory
 * @description Factory functions for creating test financial record entities
 */
const contaFactory = {
  /**
   * Creates a test accounts payable record
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.descricao] - Description
   * @param {number} [overrides.valor] - Amount
   * @param {Date} [overrides.data_vencimento] - Due date
   * @param {string} [overrides.status='pendente'] - Payment status
   * @returns {Promise<import('../models').ContaPagar>} Created accounts payable record
   * @example
   * const conta = await createContaPagar({
   *   descricao: 'Test Payment',
   *   valor: 500.00
   * });
   */
  async createContaPagar(overrides = {}) {
    const defaultConta = {
      descricao: 'Test Conta a Pagar',
      valor: 100.00,
      data_vencimento: dateHelpers.futureDate(30),
      status: 'pendente'
    };
    return ContaPagar.create({ ...defaultConta, ...overrides });
  },

  /**
   * Creates a test accounts receivable record
   * @param {Object} overrides - Override default values
   * @param {string} [overrides.descricao] - Description
   * @param {number} [overrides.valor] - Amount
   * @param {Date} [overrides.data_vencimento] - Due date
   * @param {string} [overrides.status='pendente'] - Payment status
   * @returns {Promise<import('../models').ContaReceber>} Created accounts receivable record
   * @example
   * const conta = await createContaReceber({
   *   descricao: 'Test Receipt',
   *   valor: 500.00
   * });
   */
  async createContaReceber(overrides = {}) {
    const defaultConta = {
      descricao: 'Test Conta a Receber',
      valor: 100.00,
      data_vencimento: dateHelpers.futureDate(30),
      status: 'pendente'
    };
    return ContaReceber.create({ ...defaultConta, ...overrides });
  }
};

/**
 * Relation Helpers
 * @namespace relationHelpers
 * @description Helper functions for creating and managing related test entities
 * @example
 * // Create complete test environment
 * const env = await relationHelpers.createTestEnvironment();
 * 
 * // Create complete sale with related entities
 * const { cliente, vendedor, venda, produto } = await relationHelpers.createVendaCompleta();
 * 
 * // Clean up test environment
 * await relationHelpers.cleanupTestEnvironment(env);
 */
const relationHelpers = {
  /**
   * Creates a complete test environment with related entities
   * @param {Object} overrides - Override default values for any entity
   * @param {Object} overrides.admin - Admin user overrides
   * @param {Object} overrides.manager - Manager user overrides
   * @param {Object} overrides.employee - Employee user overrides
   * @param {Object} overrides.categoria - Category overrides
   * @param {Object} overrides.fornecedor - Supplier overrides
   * @param {Object} overrides.transportadora - Carrier overrides
   * @param {Object} overrides.contaBancaria - Bank account overrides
   * @param {Object} overrides.produto - Product overrides
   * @param {Object} overrides.cliente - Client overrides
   * @param {Object} overrides.venda - Sale overrides
   * @param {Object} overrides.itemVenda - Sale item overrides
   * @param {Object} overrides.notaFiscal - Invoice overrides
   * @param {Object} overrides.contaPagar - Accounts payable overrides
   * @param {Object} overrides.contaReceber - Accounts receivable overrides
   * @param {number} overrides.numProdutos - Number of products to create
   * @param {number} overrides.numClientes - Number of clients to create
   * @param {boolean} overrides.skipNotaFiscal - Skip creating invoices
   * @returns {Promise<Object>} Created test environment
   * @example
   * const env = await createTestEnvironment({
   *   numProdutos: 5,
   *   numClientes: 3,
   *   skipNotaFiscal: true
   * });
   */
  async createTestEnvironment(overrides = {}) {
    // Create basic entities
    const admin = await userFactory.createAdminUser(overrides.admin);
    const manager = await userFactory.createManagerUser(overrides.manager);
    const employee = await userFactory.createEmployeeUser(overrides.employee);
    
    const categoria = await categoriaFactory.createCategoria(overrides.categoria);
    const fornecedor = await fornecedorFactory.createFornecedor(overrides.fornecedor);
    const transportadora = await transportadoraFactory.createTransportadora(overrides.transportadora);
    const contaBancaria = await contaBancariaFactory.createContaBancaria(overrides.contaBancaria);
    
    // Create products
    const produtos = [];
    for (let i = 0; i < (overrides.numProdutos || 3); i++) {
      const produto = await produtoFactory.createProduto({
        categoria_id: categoria.id,
        fornecedor_id: fornecedor.id,
        ...overrides.produto
      });
      produtos.push(produto);
    }

    // Create clients
    const clientes = [];
    for (let i = 0; i < (overrides.numClientes || 2); i++) {
      const cliente = await clienteFactory.createCliente(overrides.cliente);
      clientes.push(cliente);
    }

    // Create sales with items
    const vendas = [];
    for (const cliente of clientes) {
      const venda = await vendaFactory.createVenda(cliente, employee, overrides.venda);
      
      // Add random products to sale
      for (const produto of produtos.slice(0, 2)) {
        await vendaFactory.createItemVenda(venda, produto, overrides.itemVenda);
      }

      if (!overrides.skipNotaFiscal) {
        await notaFiscalFactory.createNotaFiscal(venda, overrides.notaFiscal);
      }

      vendas.push(venda);
    }

    // Create financial records
    const contasPagar = await contaFactory.createContaPagar({
      fornecedor_id: fornecedor.id,
      ...overrides.contaPagar
    });

    const contasReceber = await contaFactory.createContaReceber({
      cliente_id: clientes[0].id,
      ...overrides.contaReceber
    });

    return {
      users: { admin, manager, employee },
      categoria,
      fornecedor,
      transportadora,
      contaBancaria,
      produtos,
      clientes,
      vendas,
      contasPagar,
      contasReceber
    };
  },

  /**
   * Creates a complete sale with related entities
   * @param {Object} overrides - Override default values
   * @param {Object} overrides.venda - Sale overrides
   * @param {Object} overrides.itemVenda - Sale item overrides
   * @param {Object} overrides.notaFiscal - Invoice overrides
   * @param {boolean} overrides.skipNotaFiscal - Skip creating invoice
   * @returns {Promise<Object>} Created sale and related entities
   * @example
   * const { cliente, vendedor, venda, produto } = await createVendaCompleta({
   *   skipNotaFiscal: true
   * });
   */
  async createVendaCompleta(overrides = {}) {
    const cliente = await clienteFactory.createCliente();
    const vendedor = await userFactory.createUser();
    const venda = await vendaFactory.createVenda(cliente, vendedor, overrides.venda);
    
    const produto = await produtoFactory.createProduto();
    await vendaFactory.createItemVenda(venda, produto, overrides.itemVenda);
    
    if (!overrides.skipNotaFiscal) {
      await notaFiscalFactory.createNotaFiscal(venda, overrides.notaFiscal);
    }

    return { cliente, vendedor, venda, produto };
  },

  /**
   * Creates a complete product with related entities
   * @param {Object} overrides - Override default values
   * @param {Object} overrides.categoria - Category overrides
   * @param {Object} overrides.fornecedor - Supplier overrides
   * @param {Object} overrides.produto - Product overrides
   * @returns {Promise<Object>} Created product and related entities
   * @example
   * const { categoria, fornecedor, produto } = await createProdutoCompleto({
   *   produto: { preco_venda: 50.00 }
   * });
   */
  async createProdutoCompleto(overrides = {}) {
    const categoria = await categoriaFactory.createCategoria(overrides.categoria);
    const fornecedor = await fornecedorFactory.createFornecedor(overrides.fornecedor);
    const produto = await produtoFactory.createProduto({
      categoria_id: categoria.id,
      fornecedor_id: fornecedor.id,
      ...overrides.produto
    });

    return { categoria, fornecedor, produto };
  },

  /**
   * Creates multiple accounts payable records with supplier
   * @param {number} quantidade - Number of records to create
   * @param {Object} overrides - Override default values
   * @param {Object} overrides.fornecedor - Supplier overrides
   * @param {Object} overrides.conta - Account overrides
   * @returns {Promise<Object>} Created accounts and supplier
   * @example
   * const { fornecedor, contas } = await createContasPagar(3);
   */
  async createContasPagar(quantidade = 1, overrides = {}) {
    const contas = [];
    const fornecedor = await fornecedorFactory.createFornecedor(overrides.fornecedor);
    
    for (let i = 0; i < quantidade; i++) {
      const conta = await contaFactory.createContaPagar({
        fornecedor_id: fornecedor.id,
        ...overrides.conta
      });
      contas.push(conta);
    }

    return { fornecedor, contas };
  },

  /**
   * Creates multiple accounts receivable records with client
   * @param {number} quantidade - Number of records to create
   * @param {Object} overrides - Override default values
   * @param {Object} overrides.cliente - Client overrides
   * @param {Object} overrides.conta - Account overrides
   * @returns {Promise<Object>} Created accounts and client
   * @example
   * const { cliente, contas } = await createContasReceber(3);
   */
  async createContasReceber(quantidade = 1, overrides = {}) {
    const contas = [];
    const cliente = await clienteFactory.createCliente(overrides.cliente);
    
    for (let i = 0; i < quantidade; i++) {
      const conta = await contaFactory.createContaReceber({
        cliente_id: cliente.id,
        ...overrides.conta
      });
      contas.push(conta);
    }

    return { cliente, contas };
  },

  /**
   * Cleans up all entities created by createTestEnvironment
   * @param {Object} env - Environment object returned by createTestEnvironment
   * @param {Object} env.users - Created user records
   * @param {Object} env.categoria - Created category record
   * @param {Object} env.fornecedor - Created supplier record
   * @param {Object} env.transportadora - Created carrier record
   * @param {Object} env.contaBancaria - Created bank account record
   * @param {Object[]} env.produtos - Created product records
   * @param {Object[]} env.clientes - Created client records
   * @param {Object[]} env.vendas - Created sale records
   * @param {Object} env.contasPagar - Created accounts payable record
   * @param {Object} env.contasReceber - Created accounts receivable record
   * @returns {Promise<void>}
   * @example
   * const env = await createTestEnvironment();
   * // ... run tests ...
   * await cleanupTestEnvironment(env);
   */
  async cleanupTestEnvironment(env) {
    if (!env) return;

    // Delete in reverse order of dependencies
    const deletePromises = [];

    // Delete financial records
    if (env.contasReceber) {
      deletePromises.push(ContaReceber.destroy({ where: { id: env.contasReceber.id }, force: true }));
    }
    if (env.contasPagar) {
      deletePromises.push(ContaPagar.destroy({ where: { id: env.contasPagar.id }, force: true }));
    }

    // Delete sales and related records
    if (env.vendas) {
      for (const venda of env.vendas) {
        deletePromises.push(NotaFiscal.destroy({ where: { venda_id: venda.id }, force: true }));
        deletePromises.push(ItemVenda.destroy({ where: { venda_id: venda.id }, force: true }));
      }
      deletePromises.push(Venda.destroy({ 
        where: { id: env.vendas.map(v => v.id) }, 
        force: true 
      }));
    }

    // Delete products and related entities
    if (env.produtos) {
      deletePromises.push(Produto.destroy({ 
        where: { id: env.produtos.map(p => p.id) }, 
        force: true 
      }));
    }

    // Delete clients
    if (env.clientes) {
      deletePromises.push(Cliente.destroy({ 
        where: { id: env.clientes.map(c => c.id) }, 
        force: true 
      }));
    }

    // Delete basic entities
    if (env.contaBancaria) {
      deletePromises.push(ContaBancaria.destroy({ where: { id: env.contaBancaria.id }, force: true }));
    }
    if (env.transportadora) {
      deletePromises.push(Transportadora.destroy({ where: { id: env.transportadora.id }, force: true }));
    }
    if (env.fornecedor) {
      deletePromises.push(Fornecedor.destroy({ where: { id: env.fornecedor.id }, force: true }));
    }
    if (env.categoria) {
      deletePromises.push(Categoria.destroy({ where: { id: env.categoria.id }, force: true }));
    }

    // Delete users
    if (env.users) {
      const userIds = Object.values(env.users).map(user => user.id);
      deletePromises.push(User.destroy({ where: { id: userIds }, force: true }));
    }

    await Promise.all(deletePromises);
  }
};

/**
 * Bulk Operation Helpers
 * @namespace bulkHelpers
 * @description Helper functions for bulk creation and cleanup of test data
 * @example
 * // Create multiple users
 * const users = await bulkHelpers.createBulkUsers(5, 'employee');
 * 
 * // Create multiple products with related entities
 * const produtos = await bulkHelpers.createBulkProdutos(3);
 * 
 * // Create multiple sales with items
 * const vendas = await bulkHelpers.createBulkVendas(3);
 * 
 * // Clean up bulk created data
 * await bulkHelpers.cleanupBulkData({ users, produtos, vendas });
 */
const bulkHelpers = {
  /**
   * Creates multiple user records
   * @param {number} count - Number of users to create
   * @param {string} role - Role to assign to users
   * @param {Object} overrides - Override default values
   * @returns {Promise<Array>} Array of created users
   */
  async createBulkUsers(count = 5, role = 'employee', overrides = {}) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        name: `Test User ${i + 1}`,
        email: `test${Date.now()}-${i}@example.com`,
        password: await bcrypt.hash('Test@123', 10),
        role,
        status: 'active',
        ...overrides
      });
    }
    return User.bulkCreate(users);
  },

  /**
   * Creates multiple client records
   * @param {number} count - Number of clients to create
   * @param {Object} overrides - Override default values
   * @returns {Promise<Array>} Array of created clients
   */
  async createBulkClientes(count = 5, overrides = {}) {
    const clientes = [];
    for (let i = 0; i < count; i++) {
      clientes.push({
        tipo: 'PF',
        nome: `Test Cliente ${i + 1}`,
        cpf_cnpj: `${Date.now()}-${i}`,
        telefone: '1199999999',
        email: `cliente${Date.now()}-${i}@example.com`,
        status: 'ativo',
        ...overrides
      });
    }
    return Cliente.bulkCreate(clientes);
  },

  /**
   * Creates multiple product records with optional category and supplier
   * @param {number} count - Number of products to create
   * @param {Object} options - Options including categoria_id and fornecedor_id
   * @returns {Promise<Array>} Array of created products
   */
  async createBulkProdutos(count = 5, { categoria_id, fornecedor_id, ...overrides } = {}) {
    if (!categoria_id) {
      const categoria = await categoriaFactory.createCategoria();
      categoria_id = categoria.id;
    }
    if (!fornecedor_id) {
      const fornecedor = await fornecedorFactory.createFornecedor();
      fornecedor_id = fornecedor.id;
    }

    const produtos = [];
    for (let i = 0; i < count; i++) {
      produtos.push({
        codigo: `TEST-${Date.now()}-${i}`,
        descricao: `Test Product ${i + 1}`,
        unidade: 'UN',
        preco_custo: 10.00 + i,
        preco_venda: 20.00 + i,
        estoque_minimo: 5,
        estoque_atual: 10,
        status: 'ativo',
        categoria_id,
        fornecedor_id,
        ...overrides
      });
    }
    return Produto.bulkCreate(produtos);
  },

  /**
   * Creates multiple sale records with items
   * @param {number} count - Number of sales to create
   * @param {Object} options - Options including cliente_id, vendedor_id, and produtos
   * @returns {Promise<Array>} Array of created sales
   */
  async createBulkVendas(count = 5, { cliente_id, vendedor_id, produtos, ...overrides } = {}) {
    if (!cliente_id) {
      const cliente = await clienteFactory.createCliente();
      cliente_id = cliente.id;
    }
    if (!vendedor_id) {
      const vendedor = await userFactory.createUser();
      vendedor_id = vendedor.id;
    }
    if (!produtos) {
      produtos = await this.createBulkProdutos(2);
    }

    const vendas = [];
    const itensVenda = [];
    
    for (let i = 0; i < count; i++) {
      const venda = {
        cliente_id,
        vendedor_id,
        tipo_venda: 'balcao',
        status: 'pendente',
        subtotal: 100.00,
        valor_total: 100.00,
        forma_pagamento: 'dinheiro',
        ...overrides
      };
      vendas.push(venda);
    }

    const vendasCriadas = await Venda.bulkCreate(vendas);

    // Create items for each sale
    for (const venda of vendasCriadas) {
      for (const produto of produtos) {
        itensVenda.push({
          venda_id: venda.id,
          produto_id: produto.id,
          quantidade: 1,
          preco_unitario: produto.preco_venda,
          valor_total: produto.preco_venda
        });
      }
    }

    await ItemVenda.bulkCreate(itensVenda);
    return vendasCriadas;
  },

  /**
   * Cleans up bulk created data
   * @param {Object} data - Object containing arrays of created records to clean up
   * @returns {Promise<void>}
   */
  async cleanupBulkData(data) {
    if (!data) return;

    const deletePromises = [];

    // Helper function to safely delete records
    const safeDestroy = async (model, ids) => {
      if (ids && ids.length > 0) {
        await model.destroy({
          where: { id: ids },
          force: true
        });
      }
    };

    // Clean up vendas and related data
    if (data.vendas) {
      const vendaIds = data.vendas.map(v => v.id);
      deletePromises.push(
        ItemVenda.destroy({ where: { venda_id: vendaIds }, force: true }),
        NotaFiscal.destroy({ where: { venda_id: vendaIds }, force: true }),
        Venda.destroy({ where: { id: vendaIds }, force: true })
      );
    }

    // Clean up produtos
    if (data.produtos) {
      deletePromises.push(safeDestroy(Produto, data.produtos.map(p => p.id)));
    }

    // Clean up clientes
    if (data.clientes) {
      deletePromises.push(safeDestroy(Cliente, data.clientes.map(c => c.id)));
    }

    // Clean up users
    if (data.users) {
      deletePromises.push(safeDestroy(User, data.users.map(u => u.id)));
    }

    // Clean up categorias
    if (data.categorias) {
      deletePromises.push(safeDestroy(Categoria, data.categorias.map(c => c.id)));
    }

    // Clean up fornecedores
    if (data.fornecedores) {
      deletePromises.push(safeDestroy(Fornecedor, data.fornecedores.map(f => f.id)));
    }

    await Promise.all(deletePromises);
  }
};

/**
 * Utility Helpers
 * @namespace utilHelpers
 * @description General utility functions for testing
 * @example
 * // Wait for a specific duration
 * await utilHelpers.wait(1000);
 * 
 * // Catch and return error
 * const error = await utilHelpers.catchError(promiseThatMightFail);
 * 
 * // Generate random test data
 * const email = utilHelpers.generateRandomEmail();
 * const cpf = utilHelpers.generateRandomCPF();
 */
const utilHelpers = {
  /**
   * Waits for a specified number of milliseconds
   * @param {number} ms - Number of milliseconds to wait
   * @returns {Promise<void>}
   * @example
   * await wait(1000); // wait for 1 second
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Catches and returns an error from a promise
   * @param {Promise} promise - Promise that might reject
   * @returns {Promise<Error|null>} Error object if promise rejects, null if resolves
   * @example
   * const error = await catchError(someAsyncOperation());
   * expect(error).toBeInstanceOf(ValidationError);
   */
  catchError: async (promise) => {
    try {
      await promise;
      return null;
    } catch (error) {
      return error;
    }
  },

  /**
   * Generates a random string of specified length
   * @param {number} [length=10] - Length of string to generate
   * @returns {string} Random string
   * @example
   * const str = generateRandomString(15);
   */
  generateRandomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  /**
   * Generates a random email address
   * @returns {string} Random email address
   * @example
   * const email = generateRandomEmail();
   * // => 'test1234567890@example.com'
   */
  generateRandomEmail: () => {
    return `test${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
  },

  /**
   * Generates a random CPF number
   * @returns {string} Random CPF number (11 digits)
   * @example
   * const cpf = generateRandomCPF();
   * // => '12345678901'
   */
  generateRandomCPF: () => {
    return Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
  },

  /**
   * Generates a random CNPJ number
   * @returns {string} Random CNPJ number (14 digits)
   * @example
   * const cnpj = generateRandomCNPJ();
   * // => '12345678901234'
   */
  generateRandomCNPJ: () => {
    return Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  }
};

/**
 * @exports
 * @type {Object} Combined test helpers
 * @property {Object} authHelpers - Authentication related helpers
 * @property {Object} userFactory - User creation factory functions
 * @property {Object} clienteFactory - Client creation factory functions
 * @property {Object} produtoFactory - Product creation factory functions
 * @property {Object} vendaFactory - Sale creation factory functions
 * @property {Object} categoriaFactory - Category creation factory functions
 * @property {Object} fornecedorFactory - Supplier creation factory functions
 * @property {Object} transportadoraFactory - Carrier creation factory functions
 * @property {Object} contaBancariaFactory - Bank account creation factory functions
 * @property {Object} notaFiscalFactory - Invoice creation factory functions
 * @property {Object} contaFactory - Financial record creation factory functions
 * @property {Object} dbHelpers - Database operation helpers
 * @property {Object} assertHelpers - Test assertion helpers
 * @property {Object} dateHelpers - Date manipulation helpers
 * @property {Object} mockHelpers - Request/Response mocking helpers
 * @property {Object} utilHelpers - General utility functions
 * @property {Object} relationHelpers - Related entities creation helpers
 * @property {Object} bulkHelpers - Bulk operations helpers
 * @property {Object} testData - Predefined test data
 */
module.exports = {
  ...authHelpers,
  ...userFactory,
  ...clienteFactory,
  ...produtoFactory,
  ...vendaFactory,
  ...categoriaFactory,
  ...fornecedorFactory,
  ...transportadoraFactory,
  ...contaBancariaFactory,
  ...notaFiscalFactory,
  ...contaFactory,
  ...dbHelpers,
  ...assertHelpers,
  ...dateHelpers,
  ...mockHelpers,
  ...utilHelpers,
  ...relationHelpers,
  ...bulkHelpers,
  testData
};
