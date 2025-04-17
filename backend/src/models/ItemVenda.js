const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class ItemVenda extends Model {}

ItemVenda.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  venda_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'venda',
      key: 'id'
    }
  },
  produto_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'produto',
      key: 'id'
    }
  },
  sequencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Número sequencial do item na venda'
  },
  codigo_produto: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Código do produto no momento da venda'
  },
  descricao_produto: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Descrição do produto no momento da venda'
  },
  unidade: {
    type: DataTypes.STRING(3),
    allowNull: false,
    comment: 'Unidade de medida (UN, KG, MT, etc)'
  },
  quantidade: {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: false,
    validate: {
      min: 0.001
    }
  },
  preco_unitario: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  preco_original: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    comment: 'Preço original antes de descontos'
  },
  desconto_percentual: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  desconto_valor: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  acrescimo_percentual: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  acrescimo_valor: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  valor_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  custo_unitario: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    comment: 'Custo unitário no momento da venda'
  },
  margem_lucro: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Margem de lucro em percentual'
  },
  ncm: {
    type: DataTypes.STRING(8),
    comment: 'Código NCM do produto'
  },
  cfop: {
    type: DataTypes.STRING(4),
    comment: 'Código CFOP da operação'
  },
  cst_icms: {
    type: DataTypes.STRING(3),
    comment: 'Código da Situação Tributária do ICMS'
  },
  aliquota_icms: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Alíquota do ICMS'
  },
  cst_pis: {
    type: DataTypes.STRING(2),
    comment: 'Código da Situação Tributária do PIS'
  },
  aliquota_pis: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Alíquota do PIS'
  },
  cst_cofins: {
    type: DataTypes.STRING(2),
    comment: 'Código da Situação Tributária do COFINS'
  },
  aliquota_cofins: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Alíquota do COFINS'
  },
  observacoes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'item_venda',
  indexes: [
    {
      fields: ['venda_id']
    },
    {
      fields: ['produto_id']
    },
    {
      fields: ['venda_id', 'sequencia'],
      unique: true
    }
  ]
});

// Instance method to calculate totals
ItemVenda.prototype.calcularTotais = function() {
  // Calcula desconto
  const valorDesconto = this.desconto_percentual > 0
    ? (this.preco_unitario * this.quantidade * this.desconto_percentual / 100)
    : this.desconto_valor;

  // Calcula acréscimo
  const valorAcrescimo = this.acrescimo_percentual > 0
    ? (this.preco_unitario * this.quantidade * this.acrescimo_percentual / 100)
    : this.acrescimo_valor;

  // Calcula valor total
  this.valor_total = (this.preco_unitario * this.quantidade) 
    - valorDesconto 
    + valorAcrescimo;

  // Calcula margem de lucro
  const custoTotal = this.custo_unitario * this.quantidade;
  this.margem_lucro = ((this.valor_total - custoTotal) / custoTotal) * 100;

  return {
    subtotal: this.preco_unitario * this.quantidade,
    desconto: valorDesconto,
    acrescimo: valorAcrescimo,
    total: this.valor_total,
    margem_lucro: this.margem_lucro
  };
};

// Instance method to validate quantities
ItemVenda.prototype.validarQuantidade = function(estoqueDisponivel) {
  return this.quantidade <= estoqueDisponivel;
};

// Instance method to get tax information
ItemVenda.prototype.getInformacoesFiscais = function() {
  return {
    ncm: this.ncm,
    cfop: this.cfop,
    icms: {
      cst: this.cst_icms,
      aliquota: this.aliquota_icms
    },
    pis: {
      cst: this.cst_pis,
      aliquota: this.aliquota_pis
    },
    cofins: {
      cst: this.cst_cofins,
      aliquota: this.aliquota_cofins
    }
  };
};

module.exports = ItemVenda;
