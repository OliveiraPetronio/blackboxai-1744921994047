const Seeder = require('../../../utils/seeder');
const {
  User,
  Cliente,
  Fornecedor,
  Transportadora,
  Categoria,
  Produto,
  Configuracao
} = require('../../../models');
const logger = require('../../../utils/logger');

describe('Database Seeder', () => {
  // Mock logger to prevent console output during tests
  beforeAll(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  // Clean up after all tests
  afterAll(async () => {
    await Promise.all([
      User.destroy({ where: {}, force: true }),
      Cliente.destroy({ where: {}, force: true }),
      Fornecedor.destroy({ where: {}, force: true }),
      Transportadora.destroy({ where: {}, force: true }),
      Categoria.destroy({ where: {}, force: true }),
      Produto.destroy({ where: {}, force: true }),
      Configuracao.destroy({ where: {}, force: true })
    ]);
    
    jest.restoreAllMocks();
  });

  // Clean up before each test
  beforeEach(async () => {
    await Promise.all([
      User.destroy({ where: {}, force: true }),
      Cliente.destroy({ where: {}, force: true }),
      Fornecedor.destroy({ where: {}, force: true }),
      Transportadora.destroy({ where: {}, force: true }),
      Categoria.destroy({ where: {}, force: true }),
      Produto.destroy({ where: {}, force: true }),
      Configuracao.destroy({ where: {}, force: true })
    ]);
  });

  describe('seedAll', () => {
    it('should seed all entities successfully', async () => {
      await Seeder.seedAll();

      const counts = await Promise.all([
        User.count(),
        Cliente.count(),
        Fornecedor.count(),
        Transportadora.count(),
        Categoria.count(),
        Produto.count(),
        Configuracao.count()
      ]);

      counts.forEach(count => expect(count).toBeGreaterThan(0));
    });

    it('should log success message on completion', async () => {
      await Seeder.seedAll();
      expect(logger.info).toHaveBeenCalledWith('Database seeding completed successfully');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Seeding failed');
      jest.spyOn(User, 'findOrCreate').mockRejectedValue(error);

      await expect(Seeder.seedAll()).rejects.toThrow('Seeding failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('seedUsers', () => {
    it('should create default users', async () => {
      await Seeder.seedUsers();
      const users = await User.findAll();

      expect(users).toHaveLength(3);
      expect(users.map(u => u.role)).toContain('admin');
      expect(users.map(u => u.role)).toContain('manager');
      expect(users.map(u => u.role)).toContain('employee');
    });

    it('should not duplicate existing users', async () => {
      await Seeder.seedUsers();
      await Seeder.seedUsers();
      
      const users = await User.findAll();
      expect(users).toHaveLength(3);
    });
  });

  describe('seedCategorias', () => {
    it('should create default categories', async () => {
      await Seeder.seedCategorias();
      const categorias = await Categoria.findAll();

      expect(categorias.length).toBeGreaterThan(0);
      expect(categorias.map(c => c.codigo)).toContain('ELE');
      expect(categorias.map(c => c.codigo)).toContain('INF');
    });

    it('should set correct default values', async () => {
      await Seeder.seedCategorias();
      const categoria = await Categoria.findOne({ where: { codigo: 'ELE' } });

      expect(categoria.status).toBe('ativa');
      expect(categoria.margem_lucro_padrao).toBe(30);
    });
  });

  describe('seedFornecedores', () => {
    it('should create default suppliers', async () => {
      await Seeder.seedFornecedores();
      const fornecedores = await Fornecedor.findAll();

      expect(fornecedores.length).toBeGreaterThan(0);
      expect(fornecedores[0].status).toBe('ativo');
    });

    it('should set correct contact information', async () => {
      await Seeder.seedFornecedores();
      const fornecedor = await Fornecedor.findOne({
        where: { nome_fantasia: 'Eletro BR' }
      });

      expect(fornecedor.email).toBeDefined();
      expect(fornecedor.telefone).toBeDefined();
    });
  });

  describe('seedTransportadoras', () => {
    it('should create default shipping companies', async () => {
      await Seeder.seedTransportadoras();
      const transportadoras = await Transportadora.findAll();

      expect(transportadoras.length).toBeGreaterThan(0);
      expect(transportadoras[0].status).toBe('ativo');
    });

    it('should set correct shipping type', async () => {
      await Seeder.seedTransportadoras();
      const transportadora = await Transportadora.findOne();

      expect(transportadora.tipo_transporte).toBe('rodoviario');
    });
  });

  describe('seedClientes', () => {
    it('should create default customers', async () => {
      await Seeder.seedClientes();
      const clientes = await Cliente.findAll();

      expect(clientes.length).toBeGreaterThan(0);
      expect(clientes.map(c => c.tipo)).toContain('PF');
      expect(clientes.map(c => c.tipo)).toContain('PJ');
    });

    it('should set correct customer status', async () => {
      await Seeder.seedClientes();
      const cliente = await Cliente.findOne();

      expect(cliente.status).toBe('ativo');
    });
  });

  describe('seedProdutos', () => {
    beforeEach(async () => {
      await Seeder.seedCategorias();
      await Seeder.seedFornecedores();
    });

    it('should create default products', async () => {
      await Seeder.seedProdutos();
      const produtos = await Produto.findAll();

      expect(produtos.length).toBeGreaterThan(0);
      expect(produtos[0].status).toBe('ativo');
    });

    it('should link products to categories and suppliers', async () => {
      await Seeder.seedProdutos();
      const produto = await Produto.findOne({
        include: ['categoria', 'fornecedor']
      });

      expect(produto.categoria).toBeDefined();
      expect(produto.fornecedor).toBeDefined();
    });

    it('should set correct product pricing', async () => {
      await Seeder.seedProdutos();
      const produto = await Produto.findOne();

      expect(produto.preco_custo).toBeLessThan(produto.preco_venda);
      expect(produto.estoque_atual).toBeGreaterThanOrEqual(produto.estoque_minimo);
    });
  });

  describe('seedConfiguracoes', () => {
    it('should create default configurations', async () => {
      await Seeder.seedConfiguracoes();
      const configuracoes = await Configuracao.findAll();

      expect(configuracoes.length).toBeGreaterThan(0);
    });

    it('should set configurations for different categories', async () => {
      await Seeder.seedConfiguracoes();
      const configs = await Configuracao.findAll();
      
      const categories = configs.map(c => c.categoria);
      expect(categories).toContain('empresa');
      expect(categories).toContain('fiscal');
      expect(categories).toContain('financeiro');
    });

    it('should not duplicate existing configurations', async () => {
      await Seeder.seedConfiguracoes();
      await Seeder.seedConfiguracoes();
      
      const configuracoes = await Configuracao.findAll();
      const uniqueKeys = new Set(configuracoes.map(c => c.chave));
      
      expect(configuracoes.length).toBe(uniqueKeys.size);
    });
  });
});
