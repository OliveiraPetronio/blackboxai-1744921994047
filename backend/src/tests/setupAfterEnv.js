const { sequelize } = require('../models');

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeISODate(received) {
    const pass = !isNaN(Date.parse(received));
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass: false,
      };
    }
  }
});

// Test helpers
global.createTestUser = async (overrides = {}) => {
  const { User } = require('../models');
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@123',
    role: 'employee',
    status: 'active'
  };

  return User.create({ ...defaultUser, ...overrides });
};

global.createTestCliente = async (overrides = {}) => {
  const { Cliente } = require('../models');
  const defaultCliente = {
    tipo: 'PF',
    nome: 'Test Cliente',
    cpf_cnpj: '12345678901',
    telefone: '1199999999',
    email: 'cliente@example.com',
    cep: '12345678',
    endereco: 'Test Street',
    numero: '123',
    bairro: 'Test District',
    cidade: 'Test City',
    estado: 'SP',
    status: 'ativo'
  };

  return Cliente.create({ ...defaultCliente, ...overrides });
};

global.createTestProduto = async (overrides = {}) => {
  const { Produto } = require('../models');
  const defaultProduto = {
    codigo: 'TEST-001',
    descricao: 'Test Product',
    unidade: 'UN',
    preco_custo: 10.00,
    preco_venda: 20.00,
    estoque_minimo: 5,
    estoque_atual: 10,
    status: 'ativo'
  };

  return Produto.create({ ...defaultProduto, ...overrides });
};

global.createTestVenda = async (cliente, vendedor, overrides = {}) => {
  const { Venda } = require('../models');
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
};

// Test utilities
global.getAuthToken = async (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

global.clearDatabase = async () => {
  const models = sequelize.models;
  const promises = Object.values(models).map(model => 
    model.destroy({ where: {}, force: true })
  );
  await Promise.all(promises);
};

// Request helpers
global.testRequest = require('supertest')(require('../server'));

// Mock date and time
global.mockDate = (date) => {
  const RealDate = Date;
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length) {
        return new RealDate(...args);
      }
      return new RealDate(date);
    }
    static now() {
      return new RealDate(date).getTime();
    }
  };
};

// Restore real date
global.restoreDate = () => {
  global.Date = RealDate;
};

// Error handler for async tests
global.catchError = async (promise) => {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
};

// Console output capture
global.captureConsole = () => {
  const output = {
    log: [],
    info: [],
    warn: [],
    error: []
  };

  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  beforeEach(() => {
    console.log = (...args) => output.log.push(args);
    console.info = (...args) => output.info.push(args);
    console.warn = (...args) => output.warn.push(args);
    console.error = (...args) => output.error.push(args);
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    output.log = [];
    output.info = [];
    output.warn = [];
    output.error = [];
  });

  return output;
};

// Set default timeout
jest.setTimeout(10000);
