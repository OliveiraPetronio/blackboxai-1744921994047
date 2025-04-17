const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class ContaReceber extends Model {}

ContaReceber.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  numero_documento: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cliente_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'cliente',
      key: 'id'
    }
  },
  venda_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'venda',
      key: 'id'
    }
  },
  data_emissao: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  data_vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  data_recebimento: {
    type: DataTypes.DATEONLY
  },
  valor_original: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  valor_juros: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_multa: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_desconto: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_recebido: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_restante: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM(
      'em_aberto',
      'parcialmente_recebido',
      'recebido',
      'cancelado',
      'vencido',
      'protestado'
    ),
    defaultValue: 'em_aberto'
  },
  forma_recebimento: {
    type: DataTypes.ENUM(
      'dinheiro',
      'cheque',
      'cartao_credito',
      'cartao_debito',
      'transferencia',
      'boleto',
      'pix'
    )
  },
  conta_bancaria_id: {
    type: DataTypes.UUID,
    references: {
      model: 'conta_bancaria',
      key: 'id'
    }
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Categoria da receita (ex: Vendas, Serviços, Outros)'
  },
  centro_custo: {
    type: DataTypes.STRING,
    comment: 'Centro de custo para controle financeiro'
  },
  recorrente: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica se é uma conta recorrente'
  },
  periodicidade: {
    type: DataTypes.ENUM('mensal', 'bimestral', 'trimestral', 'semestral', 'anual'),
    allowNull: true
  },
  data_proximo_vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  numero_parcela: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  total_parcelas: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  nsu: {
    type: DataTypes.STRING,
    comment: 'Número Sequencial Único para transações de cartão'
  },
  autorizacao: {
    type: DataTypes.STRING,
    comment: 'Código de autorização para transações de cartão'
  },
  comprovante_url: {
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
  modelName: 'conta_receber',
  indexes: [
    {
      fields: ['cliente_id']
    },
    {
      fields: ['venda_id']
    },
    {
      fields: ['data_vencimento']
    },
    {
      fields: ['status']
    },
    {
      fields: ['categoria']
    }
  ]
});

// Instance method to calculate remaining value
ContaReceber.prototype.calcularValorRestante = function() {
  const valorTotal = parseFloat(this.valor_original) + 
                    parseFloat(this.valor_juros) + 
                    parseFloat(this.valor_multa) - 
                    parseFloat(this.valor_desconto);
  
  this.valor_restante = valorTotal - parseFloat(this.valor_recebido);
  return this.valor_restante;
};

// Instance method to register payment
ContaReceber.prototype.registrarRecebimento = async function(valorRecebido, dataRecebimento = new Date()) {
  const valorRestanteAtual = this.calcularValorRestante();
  
  if (valorRecebido > valorRestanteAtual) {
    throw new Error('Valor do recebimento maior que o valor restante');
  }

  this.valor_recebido = parseFloat(this.valor_recebido) + parseFloat(valorRecebido);
  this.data_recebimento = dataRecebimento;
  
  // Atualiza o valor restante
  this.calcularValorRestante();
  
  // Atualiza o status
  if (this.valor_restante === 0) {
    this.status = 'recebido';
  } else if (this.valor_recebido > 0) {
    this.status = 'parcialmente_recebido';
  }

  await this.save();
  
  return {
    valorRecebido: this.valor_recebido,
    valorRestante: this.valor_restante,
    status: this.status
  };
};

// Instance method to check if receivable is overdue
ContaReceber.prototype.estaVencida = function() {
  const hoje = new Date();
  const vencimento = new Date(this.data_vencimento);
  return vencimento < hoje && this.status !== 'recebido';
};

// Instance method to calculate late fees
ContaReceber.prototype.calcularJurosMulta = async function(dataBase = new Date()) {
  if (!this.estaVencida()) return { juros: 0, multa: 0 };

  const vencimento = new Date(this.data_vencimento);
  const diasAtraso = Math.floor((dataBase - vencimento) / (1000 * 60 * 60 * 24));
  
  // Exemplo: 2% de multa + 0.033% de juros ao dia
  const multa = this.valor_original * 0.02;
  const juros = this.valor_original * (0.00033 * diasAtraso);

  this.valor_multa = multa;
  this.valor_juros = juros;
  
  await this.save();

  return { juros, multa };
};

// Instance method to generate next recurring receivable
ContaReceber.prototype.gerarProximaRecorrencia = async function() {
  if (!this.recorrente || !this.periodicidade) {
    throw new Error('Conta não é recorrente');
  }

  const periodos = {
    mensal: 1,
    bimestral: 2,
    trimestral: 3,
    semestral: 6,
    anual: 12
  };

  const novaData = new Date(this.data_vencimento);
  novaData.setMonth(novaData.getMonth() + periodos[this.periodicidade]);

  const novaConta = await ContaReceber.create({
    ...this.toJSON(),
    id: undefined,
    data_vencimento: novaData,
    data_recebimento: null,
    valor_recebido: 0,
    valor_restante: this.valor_original,
    status: 'em_aberto',
    data_proximo_vencimento: null
  });

  return novaConta;
};

module.exports = ContaReceber;
