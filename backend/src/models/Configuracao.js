const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Configuracao extends Model {}

Configuracao.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chave: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  valor: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
    allowNull: false,
    defaultValue: 'string'
  },
  categoria: {
    type: DataTypes.ENUM(
      'empresa',
      'fiscal',
      'financeiro',
      'vendas',
      'estoque',
      'email',
      'integracao',
      'sistema'
    ),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    comment: 'Descrição da configuração'
  },
  padrao: {
    type: DataTypes.TEXT,
    comment: 'Valor padrão da configuração'
  },
  obrigatorio: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nivel_acesso: {
    type: DataTypes.ENUM('admin', 'gerente', 'usuario'),
    defaultValue: 'admin',
    comment: 'Nível mínimo de acesso necessário para alterar esta configuração'
  },
  editavel: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Indica se a configuração pode ser editada pela interface'
  },
  grupo: {
    type: DataTypes.STRING,
    comment: 'Grupo de configurações relacionadas'
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Ordem de exibição no grupo'
  }
}, {
  sequelize,
  modelName: 'configuracao',
  indexes: [
    {
      unique: true,
      fields: ['chave']
    },
    {
      fields: ['categoria']
    },
    {
      fields: ['grupo']
    }
  ]
});

// Configurações padrão do sistema
const configuracoesDefault = [
  // Configurações da Empresa
  {
    chave: 'empresa.razao_social',
    valor: '',
    tipo: 'string',
    categoria: 'empresa',
    descricao: 'Razão Social da empresa',
    obrigatorio: true,
    grupo: 'Dados da Empresa',
    ordem: 1
  },
  {
    chave: 'empresa.nome_fantasia',
    valor: '',
    tipo: 'string',
    categoria: 'empresa',
    descricao: 'Nome Fantasia da empresa',
    obrigatorio: true,
    grupo: 'Dados da Empresa',
    ordem: 2
  },
  {
    chave: 'empresa.cnpj',
    valor: '',
    tipo: 'string',
    categoria: 'empresa',
    descricao: 'CNPJ da empresa',
    obrigatorio: true,
    grupo: 'Dados da Empresa',
    ordem: 3
  },

  // Configurações Fiscais
  {
    chave: 'fiscal.regime_tributario',
    valor: 'simples',
    tipo: 'string',
    categoria: 'fiscal',
    descricao: 'Regime Tributário',
    padrao: 'simples',
    obrigatorio: true,
    grupo: 'Configurações Fiscais',
    ordem: 1
  },
  {
    chave: 'fiscal.ambiente_nfe',
    valor: 'homologacao',
    tipo: 'string',
    categoria: 'fiscal',
    descricao: 'Ambiente de emissão de NF-e',
    padrao: 'homologacao',
    obrigatorio: true,
    grupo: 'Configurações Fiscais',
    ordem: 2
  },

  // Configurações Financeiras
  {
    chave: 'financeiro.juros_padrao',
    valor: '2',
    tipo: 'number',
    categoria: 'financeiro',
    descricao: 'Percentual de juros padrão para atraso',
    padrao: '2',
    grupo: 'Configurações Financeiras',
    ordem: 1
  },
  {
    chave: 'financeiro.multa_padrao',
    valor: '2',
    tipo: 'number',
    categoria: 'financeiro',
    descricao: 'Percentual de multa padrão para atraso',
    padrao: '2',
    grupo: 'Configurações Financeiras',
    ordem: 2
  },

  // Configurações de Vendas
  {
    chave: 'vendas.desconto_maximo',
    valor: '10',
    tipo: 'number',
    categoria: 'vendas',
    descricao: 'Percentual máximo de desconto permitido',
    padrao: '10',
    grupo: 'Configurações de Vendas',
    ordem: 1
  },
  {
    chave: 'vendas.prazo_maximo',
    valor: '30',
    tipo: 'number',
    categoria: 'vendas',
    descricao: 'Prazo máximo para pagamento em dias',
    padrao: '30',
    grupo: 'Configurações de Vendas',
    ordem: 2
  },

  // Configurações de Estoque
  {
    chave: 'estoque.estoque_minimo_alerta',
    valor: 'true',
    tipo: 'boolean',
    categoria: 'estoque',
    descricao: 'Alertar quando produto atingir estoque mínimo',
    padrao: 'true',
    grupo: 'Configurações de Estoque',
    ordem: 1
  },
  {
    chave: 'estoque.controle_lote',
    valor: 'false',
    tipo: 'boolean',
    categoria: 'estoque',
    descricao: 'Habilitar controle por lote',
    padrao: 'false',
    grupo: 'Configurações de Estoque',
    ordem: 2
  }
];

// Class method to initialize default settings
Configuracao.inicializarConfiguracoes = async function() {
  for (const config of configuracoesDefault) {
    await Configuracao.findOrCreate({
      where: { chave: config.chave },
      defaults: config
    });
  }
};

// Instance method to get typed value
Configuracao.prototype.getValorTipado = function() {
  switch (this.tipo) {
    case 'number':
      return parseFloat(this.valor);
    case 'boolean':
      return this.valor === 'true';
    case 'json':
      try {
        return JSON.parse(this.valor);
      } catch (e) {
        return null;
      }
    case 'array':
      try {
        return JSON.parse(this.valor);
      } catch (e) {
        return [];
      }
    default:
      return this.valor;
  }
};

// Class method to get configuration by key
Configuracao.getValor = async function(chave) {
  const config = await this.findOne({ where: { chave } });
  if (!config) return null;
  return config.getValorTipado();
};

// Class method to set configuration value
Configuracao.setValor = async function(chave, valor) {
  const config = await this.findOne({ where: { chave } });
  if (!config) return false;

  let valorString;
  if (typeof valor === 'object') {
    valorString = JSON.stringify(valor);
  } else {
    valorString = String(valor);
  }

  config.valor = valorString;
  await config.save();
  return true;
};

// Class method to get all configurations by category
Configuracao.getCategoria = async function(categoria) {
  const configs = await this.findAll({
    where: { categoria },
    order: [['grupo', 'ASC'], ['ordem', 'ASC']]
  });

  return configs.reduce((acc, config) => {
    acc[config.chave] = config.getValorTipado();
    return acc;
  }, {});
};

module.exports = Configuracao;
