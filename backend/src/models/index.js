const { sequelize } = require('../config/database');
const User = require('./User');
const Cliente = require('./Cliente');
const Fornecedor = require('./Fornecedor');
const Transportadora = require('./Transportadora');
const ContaBancaria = require('./ContaBancaria');
const Venda = require('./Venda');
const ItemVenda = require('./ItemVenda');
const Produto = require('./Produto');
const Categoria = require('./Categoria');
const NotaFiscal = require('./NotaFiscal');
const ContaPagar = require('./ContaPagar');
const ContaReceber = require('./ContaReceber');
const Configuracao = require('./Configuracao');

// User Associations
User.hasMany(Venda, { foreignKey: 'vendedor_id', as: 'vendas' });
Venda.belongsTo(User, { foreignKey: 'vendedor_id', as: 'vendedor' });

// Cliente Associations
Cliente.hasMany(Venda, { foreignKey: 'cliente_id', as: 'vendas' });
Venda.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Cliente.hasMany(ContaReceber, { foreignKey: 'cliente_id', as: 'contas_receber' });
ContaReceber.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

// Fornecedor Associations
Fornecedor.hasMany(Produto, { foreignKey: 'fornecedor_id', as: 'produtos' });
Produto.belongsTo(Fornecedor, { foreignKey: 'fornecedor_id', as: 'fornecedor' });

Fornecedor.hasMany(ContaPagar, { foreignKey: 'fornecedor_id', as: 'contas_pagar' });
ContaPagar.belongsTo(Fornecedor, { foreignKey: 'fornecedor_id', as: 'fornecedor' });

// Transportadora Associations
Transportadora.hasMany(Venda, { foreignKey: 'transportadora_id', as: 'vendas' });
Venda.belongsTo(Transportadora, { foreignKey: 'transportadora_id', as: 'transportadora' });

// Venda Associations
Venda.hasMany(ItemVenda, { foreignKey: 'venda_id', as: 'itens' });
ItemVenda.belongsTo(Venda, { foreignKey: 'venda_id', as: 'venda' });

Venda.hasOne(NotaFiscal, { foreignKey: 'venda_id', as: 'nota_fiscal' });
NotaFiscal.belongsTo(Venda, { foreignKey: 'venda_id', as: 'venda' });

Venda.hasMany(ContaReceber, { foreignKey: 'venda_id', as: 'contas_receber' });
ContaReceber.belongsTo(Venda, { foreignKey: 'venda_id', as: 'venda' });

// Produto Associations
Produto.hasMany(ItemVenda, { foreignKey: 'produto_id', as: 'itens_venda' });
ItemVenda.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

Produto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Produto, { foreignKey: 'categoria_id', as: 'produtos' });

// Categoria Associations (Self-referencing)
Categoria.belongsTo(Categoria, { foreignKey: 'categoria_pai_id', as: 'categoria_pai' });
Categoria.hasMany(Categoria, { foreignKey: 'categoria_pai_id', as: 'subcategorias' });

// ContaBancaria Associations
ContaBancaria.hasMany(ContaPagar, { foreignKey: 'conta_bancaria_id', as: 'contas_pagar' });
ContaPagar.belongsTo(ContaBancaria, { foreignKey: 'conta_bancaria_id', as: 'conta_bancaria' });

ContaBancaria.hasMany(ContaReceber, { foreignKey: 'conta_bancaria_id', as: 'contas_receber' });
ContaReceber.belongsTo(ContaBancaria, { foreignKey: 'conta_bancaria_id', as: 'conta_bancaria' });

// Export models
module.exports = {
  sequelize,
  User,
  Cliente,
  Fornecedor,
  Transportadora,
  ContaBancaria,
  Venda,
  ItemVenda,
  Produto,
  Categoria,
  NotaFiscal,
  ContaPagar,
  ContaReceber,
  Configuracao,
  
  // Function to sync all models with database
  async syncModels(force = false) {
    try {
      await sequelize.sync({ force });
      if (force) {
        // Initialize default configurations if forcing sync
        await Configuracao.inicializarConfiguracoes();
      }
      console.log('Database synced successfully');
    } catch (error) {
      console.error('Error syncing database:', error);
      throw error;
    }
  }
};
