const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Produto extends Model {}

Produto.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  codigo_barras: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      len: [8, 14]
    }
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  descricao_completa: {
    type: DataTypes.TEXT
  },
  unidade: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'UN',
    validate: {
      isIn: [['UN', 'KG', 'MT', 'LT', 'CX', 'PC']]
    }
  },
  categoria_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categoria',
      key: 'id'
    }
  },
  fornecedor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'fornecedor',
      key: 'id'
    }
  },
  marca: {
    type: DataTypes.STRING
  },
  modelo: {
    type: DataTypes.STRING
  },
  preco_custo: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  preco_venda: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  margem_lucro: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0
    }
  },
  preco_promocional: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  data_inicio_promocao: {
    type: DataTypes.DATE
  },
  data_fim_promocao: {
    type: DataTypes.DATE
  },
  estoque_minimo: {
    type: DataTypes.DECIMAL(15, 3),
    defaultValue: 0
  },
  estoque_maximo: {
    type: DataTypes.DECIMAL(15, 3),
    defaultValue: 0
  },
  estoque_atual: {
    type: DataTypes.DECIMAL(15, 3),
    defaultValue: 0
  },
  localizacao: {
    type: DataTypes.STRING,
    comment: 'Localização física do produto no estoque'
  },
  peso_bruto: {
    type: DataTypes.DECIMAL(10, 3),
    comment: 'Peso em kg'
  },
  peso_liquido: {
    type: DataTypes.DECIMAL(10, 3),
    comment: 'Peso em kg'
  },
  dimensoes: {
    type: DataTypes.JSON,
    comment: 'Dimensões do produto (altura, largura, comprimento)'
  },
  ncm: {
    type: DataTypes.STRING(8),
    validate: {
      len: [8, 8]
    }
  },
  cest: {
    type: DataTypes.STRING(7),
    validate: {
      len: [7, 7]
    }
  },
  origem: {
    type: DataTypes.CHAR(1),
    validate: {
      isIn: [['0', '1', '2', '3', '4', '5', '6', '7', '8']]
    },
    comment: 'Origem da mercadoria (0-Nacional, 1-Estrangeira Importação Direta, etc)'
  },
  status: {
    type: DataTypes.ENUM('ativo', 'inativo', 'em_promocao', 'esgotado'),
    defaultValue: 'ativo'
  },
  imagem_url: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  observacoes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'produto',
  indexes: [
    {
      unique: true,
      fields: ['codigo']
    },
    {
      unique: true,
      fields: ['codigo_barras']
    },
    {
      fields: ['descricao']
    },
    {
      fields: ['categoria_id']
    },
    {
      fields: ['fornecedor_id']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance method to check stock
Produto.prototype.verificarEstoque = function(quantidade) {
  return {
    disponivel: this.estoque_atual >= quantidade,
    saldo: this.estoque_atual - quantidade
  };
};

// Instance method to update stock
Produto.prototype.atualizarEstoque = async function(quantidade, tipo) {
  const oldStock = this.estoque_atual;
  
  if (tipo === 'entrada') {
    this.estoque_atual = parseFloat(this.estoque_atual) + parseFloat(quantidade);
  } else if (tipo === 'saida') {
    if (parseFloat(this.estoque_atual) < parseFloat(quantidade)) {
      throw new Error('Estoque insuficiente');
    }
    this.estoque_atual = parseFloat(this.estoque_atual) - parseFloat(quantidade);
  } else {
    throw new Error('Tipo de operação inválido');
  }

  // Atualiza status baseado no estoque
  if (this.estoque_atual <= 0) {
    this.status = 'esgotado';
  } else if (this.status === 'esgotado') {
    this.status = 'ativo';
  }

  await this.save();

  return {
    oldStock,
    newStock: this.estoque_atual,
    difference: this.estoque_atual - oldStock
  };
};

// Instance method to check if product is on sale
Produto.prototype.emPromocao = function() {
  const now = new Date();
  return this.preco_promocional && 
         this.data_inicio_promocao <= now && 
         this.data_fim_promocao >= now;
};

// Instance method to get current price
Produto.prototype.getPrecoAtual = function() {
  return this.emPromocao() ? this.preco_promocional : this.preco_venda;
};

// Instance method to calculate margin
Produto.prototype.calcularMargem = function(precoVenda = null) {
  const preco = precoVenda || this.preco_venda;
  this.margem_lucro = ((preco - this.preco_custo) / this.preco_custo) * 100;
  return this.margem_lucro;
};

module.exports = Produto;
