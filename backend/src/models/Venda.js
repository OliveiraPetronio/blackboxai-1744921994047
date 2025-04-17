const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Venda extends Model {}

Venda.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_venda: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true
  },
  data_venda: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  cliente_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'cliente',
      key: 'id'
    }
  },
  vendedor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  tipo_venda: {
    type: DataTypes.ENUM('balcao', 'delivery', 'online'),
    allowNull: false,
    defaultValue: 'balcao'
  },
  status: {
    type: DataTypes.ENUM(
      'pendente',
      'aprovada',
      'em_separacao',
      'faturada',
      'em_transporte',
      'entregue',
      'cancelada'
    ),
    defaultValue: 'pendente'
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  desconto_percentual: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  desconto_valor: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  acrescimo_percentual: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  acrescimo_valor: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_frete: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  forma_pagamento: {
    type: DataTypes.ENUM(
      'dinheiro',
      'cartao_credito',
      'cartao_debito',
      'pix',
      'boleto',
      'transferencia',
      'crediario'
    ),
    allowNull: false
  },
  parcelas: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  condicao_pagamento: {
    type: DataTypes.STRING,
    comment: 'Descrição da condição de pagamento'
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  nfe_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'nota_fiscal',
      key: 'id'
    }
  },
  transportadora_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'transportadora',
      key: 'id'
    }
  },
  data_entrega_prevista: {
    type: DataTypes.DATE
  },
  data_entrega_realizada: {
    type: DataTypes.DATE
  },
  endereco_entrega: {
    type: DataTypes.JSON,
    comment: 'Endereço de entrega se diferente do cadastro'
  }
}, {
  sequelize,
  modelName: 'venda',
  indexes: [
    {
      unique: true,
      fields: ['numero_venda']
    },
    {
      fields: ['cliente_id']
    },
    {
      fields: ['vendedor_id']
    },
    {
      fields: ['data_venda']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance method to calculate totals
Venda.prototype.calcularTotais = function() {
  // Calcula desconto
  const valorDesconto = this.desconto_percentual > 0 
    ? (this.subtotal * this.desconto_percentual / 100)
    : this.desconto_valor;

  // Calcula acréscimo
  const valorAcrescimo = this.acrescimo_percentual > 0
    ? (this.subtotal * this.acrescimo_percentual / 100)
    : this.acrescimo_valor;

  // Calcula valor total
  this.valor_total = parseFloat(this.subtotal) 
    - parseFloat(valorDesconto)
    + parseFloat(valorAcrescimo)
    + parseFloat(this.valor_frete);

  return {
    subtotal: this.subtotal,
    desconto: valorDesconto,
    acrescimo: valorAcrescimo,
    frete: this.valor_frete,
    total: this.valor_total
  };
};

// Instance method to update status
Venda.prototype.atualizarStatus = async function(novoStatus, userId) {
  const statusValidos = {
    'pendente': ['aprovada', 'cancelada'],
    'aprovada': ['em_separacao', 'cancelada'],
    'em_separacao': ['faturada', 'cancelada'],
    'faturada': ['em_transporte', 'entregue', 'cancelada'],
    'em_transporte': ['entregue', 'cancelada'],
    'entregue': [],
    'cancelada': []
  };

  if (!statusValidos[this.status].includes(novoStatus)) {
    throw new Error(`Não é possível alterar o status de ${this.status} para ${novoStatus}`);
  }

  this.status = novoStatus;
  if (novoStatus === 'entregue') {
    this.data_entrega_realizada = new Date();
  }
  
  await this.save();

  // Aqui poderia disparar eventos/notificações baseado na mudança de status
  return true;
};

// Instance method to check if can be cancelled
Venda.prototype.podeSerCancelada = function() {
  const statusNaoCancelaveis = ['entregue', 'cancelada'];
  return !statusNaoCancelaveis.includes(this.status);
};

module.exports = Venda;
