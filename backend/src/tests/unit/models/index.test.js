const { Sequelize } = require('sequelize');
const {
  sequelize,
  User,
  Cliente,
  Fornecedor,
  Transportadora,
  ContaBancaria,
  Venda,
  ItemVenda,
  Produto,
  NotaFiscal,
  ContaPagar,
  ContaReceber,
  Categoria,
  Configuracao
} = require('../../../models');

describe('Model Index', () => {
  describe('Database Connection', () => {
    it('should export a valid Sequelize instance', () => {
      expect(sequelize).toBeInstanceOf(Sequelize);
    });

    it('should have all models registered', () => {
      const models = [
        User,
        Cliente,
        Fornecedor,
        Transportadora,
        ContaBancaria,
        Venda,
        ItemVenda,
        Produto,
        NotaFiscal,
        ContaPagar,
        ContaReceber,
        Categoria,
        Configuracao
      ];

      models.forEach(model => {
        expect(model.sequelize).toBe(sequelize);
      });
    });
  });

  describe('Model Associations', () => {
    describe('User Associations', () => {
      it('should have correct associations', () => {
        const associations = User.associations;

        expect(associations.vendas).toBeDefined();
        expect(associations.vendas.associationType).toBe('HasMany');
        expect(associations.vendas.target).toBe(Venda);
      });
    });

    describe('Cliente Associations', () => {
      it('should have correct associations', () => {
        const associations = Cliente.associations;

        expect(associations.vendas).toBeDefined();
        expect(associations.vendas.associationType).toBe('HasMany');
        expect(associations.vendas.target).toBe(Venda);

        expect(associations.contas_receber).toBeDefined();
        expect(associations.contas_receber.associationType).toBe('HasMany');
        expect(associations.contas_receber.target).toBe(ContaReceber);
      });
    });

    describe('Fornecedor Associations', () => {
      it('should have correct associations', () => {
        const associations = Fornecedor.associations;

        expect(associations.produtos).toBeDefined();
        expect(associations.produtos.associationType).toBe('HasMany');
        expect(associations.produtos.target).toBe(Produto);

        expect(associations.contas_pagar).toBeDefined();
        expect(associations.contas_pagar.associationType).toBe('HasMany');
        expect(associations.contas_pagar.target).toBe(ContaPagar);
      });
    });

    describe('Venda Associations', () => {
      it('should have correct associations', () => {
        const associations = Venda.associations;

        expect(associations.cliente).toBeDefined();
        expect(associations.cliente.associationType).toBe('BelongsTo');
        expect(associations.cliente.target).toBe(Cliente);

        expect(associations.vendedor).toBeDefined();
        expect(associations.vendedor.associationType).toBe('BelongsTo');
        expect(associations.vendedor.target).toBe(User);

        expect(associations.itens).toBeDefined();
        expect(associations.itens.associationType).toBe('HasMany');
        expect(associations.itens.target).toBe(ItemVenda);

        expect(associations.nota_fiscal).toBeDefined();
        expect(associations.nota_fiscal.associationType).toBe('HasOne');
        expect(associations.nota_fiscal.target).toBe(NotaFiscal);
      });
    });

    describe('Produto Associations', () => {
      it('should have correct associations', () => {
        const associations = Produto.associations;

        expect(associations.categoria).toBeDefined();
        expect(associations.categoria.associationType).toBe('BelongsTo');
        expect(associations.categoria.target).toBe(Categoria);

        expect(associations.fornecedor).toBeDefined();
        expect(associations.fornecedor.associationType).toBe('BelongsTo');
        expect(associations.fornecedor.target).toBe(Fornecedor);

        expect(associations.itens_venda).toBeDefined();
        expect(associations.itens_venda.associationType).toBe('HasMany');
        expect(associations.itens_venda.target).toBe(ItemVenda);
      });
    });
  });

  describe('Model Initialization', () => {
    it('should initialize all models with correct table names', () => {
      expect(User.tableName).toBe('users');
      expect(Cliente.tableName).toBe('clientes');
      expect(Fornecedor.tableName).toBe('fornecedores');
      expect(Transportadora.tableName).toBe('transportadoras');
      expect(ContaBancaria.tableName).toBe('contas_bancarias');
      expect(Venda.tableName).toBe('vendas');
      expect(ItemVenda.tableName).toBe('itens_venda');
      expect(Produto.tableName).toBe('produtos');
      expect(NotaFiscal.tableName).toBe('notas_fiscais');
      expect(ContaPagar.tableName).toBe('contas_pagar');
      expect(ContaReceber.tableName).toBe('contas_receber');
      expect(Categoria.tableName).toBe('categorias');
      expect(Configuracao.tableName).toBe('configuracoes');
    });

    it('should initialize all models with timestamps', () => {
      const models = [
        User,
        Cliente,
        Fornecedor,
        Transportadora,
        ContaBancaria,
        Venda,
        ItemVenda,
        Produto,
        NotaFiscal,
        ContaPagar,
        ContaReceber,
        Categoria,
        Configuracao
      ];

      models.forEach(model => {
        expect(model.options.timestamps).toBe(true);
        expect(model.rawAttributes.createdAt).toBeDefined();
        expect(model.rawAttributes.updatedAt).toBeDefined();
      });
    });

    it('should initialize models with correct paranoid setting', () => {
      const paranoidModels = [
        User,
        Cliente,
        Fornecedor,
        Transportadora,
        Produto,
        Categoria
      ];

      paranoidModels.forEach(model => {
        expect(model.options.paranoid).toBe(true);
        expect(model.rawAttributes.deletedAt).toBeDefined();
      });
    });
  });

  describe('Model Validation', () => {
    it('should validate model schemas', async () => {
      const models = [
        User,
        Cliente,
        Fornecedor,
        Transportadora,
        ContaBancaria,
        Venda,
        ItemVenda,
        Produto,
        NotaFiscal,
        ContaPagar,
        ContaReceber,
        Categoria,
        Configuracao
      ];

      for (const Model of models) {
        const instance = Model.build();
        try {
          await instance.validate();
          fail(`Validation should fail for empty ${Model.name}`);
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.name).toBe('SequelizeValidationError');
        }
      }
    });
  });

  describe('Model Hooks', () => {
    it('should have beforeCreate hooks where necessary', () => {
      expect(User.options.hooks.beforeCreate).toBeDefined();
      expect(ContaBancaria.options.hooks.beforeCreate).toBeDefined();
      expect(NotaFiscal.options.hooks.beforeCreate).toBeDefined();
    });

    it('should have beforeUpdate hooks where necessary', () => {
      expect(User.options.hooks.beforeUpdate).toBeDefined();
      expect(Venda.options.hooks.beforeUpdate).toBeDefined();
      expect(ContaPagar.options.hooks.beforeUpdate).toBeDefined();
      expect(ContaReceber.options.hooks.beforeUpdate).toBeDefined();
    });
  });

  describe('Model Scopes', () => {
    it('should define default scopes where necessary', () => {
      expect(User.options.defaultScope).toBeDefined();
      expect(Cliente.options.defaultScope).toBeDefined();
      expect(Fornecedor.options.defaultScope).toBeDefined();
      expect(Produto.options.defaultScope).toBeDefined();
    });

    it('should define named scopes where necessary', () => {
      expect(User.options.scopes).toBeDefined();
      expect(Venda.options.scopes).toBeDefined();
      expect(Produto.options.scopes).toBeDefined();
      expect(ContaPagar.options.scopes).toBeDefined();
      expect(ContaReceber.options.scopes).toBeDefined();
    });
  });
});
