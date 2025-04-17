const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class ContaBancaria extends Model {}

ContaBancaria.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  banco: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  codigo_banco: {
    type: DataTypes.STRING(3),
    allowNull: false,
    validate: {
      len: [3, 3]
    }
  },
  agencia: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  digito_agencia: {
    type: DataTypes.STRING(1),
    allowNull: true
  },
  conta: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  digito_conta: {
    type: DataTypes.STRING(1),
    allowNull: false
  },
  tipo_conta: {
    type: DataTypes.ENUM('corrente', 'poupanca'),
    allowNull: false,
    defaultValue: 'corrente'
  },
  titular: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  cpf_cnpj_titular: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [11, 14]
    }
  },
  saldo_inicial: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  saldo_atual: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  data_saldo: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('ativa', 'inativa', 'bloqueada'),
    defaultValue: 'ativa'
  },
  tipo_chave_pix: {
    type: DataTypes.ENUM('cpf', 'cnpj', 'email', 'celular', 'aleatoria'),
    allowNull: true
  },
  chave_pix: {
    type: DataTypes.STRING,
    allowNull: true
  },
  limite_diario: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: 'Limite diário para transferências'
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'conta_bancaria',
  indexes: [
    {
      fields: ['banco', 'agencia', 'conta'],
      unique: true
    }
  ]
});

// Instance method to format bank account
ContaBancaria.prototype.getFormattedAccount = function() {
  return `${this.banco} (${this.codigo_banco}) - Ag: ${this.agencia}${this.digito_agencia ? '-' + this.digito_agencia : ''} / CC: ${this.conta}-${this.digito_conta}`;
};

// Instance method to update balance
ContaBancaria.prototype.updateBalance = async function(valor, tipo) {
  const oldBalance = this.saldo_atual;
  
  if (tipo === 'credito') {
    this.saldo_atual = parseFloat(this.saldo_atual) + parseFloat(valor);
  } else if (tipo === 'debito') {
    if (parseFloat(this.saldo_atual) < parseFloat(valor)) {
      throw new Error('Saldo insuficiente');
    }
    this.saldo_atual = parseFloat(this.saldo_atual) - parseFloat(valor);
  } else {
    throw new Error('Tipo de operação inválido');
  }

  this.data_saldo = new Date();
  await this.save();

  return {
    oldBalance,
    newBalance: this.saldo_atual,
    difference: this.saldo_atual - oldBalance
  };
};

// Instance method to check if transfer is within daily limit
ContaBancaria.prototype.checkDailyLimit = function(valor) {
  if (!this.limite_diario) return true;
  return parseFloat(valor) <= parseFloat(this.limite_diario);
};

// Instance method to validate PIX key
ContaBancaria.prototype.validatePixKey = function() {
  if (!this.chave_pix || !this.tipo_chave_pix) return false;

  switch (this.tipo_chave_pix) {
    case 'cpf':
      return this.chave_pix.length === 11;
    case 'cnpj':
      return this.chave_pix.length === 14;
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.chave_pix);
    case 'celular':
      return /^\d{11}$/.test(this.chave_pix);
    case 'aleatoria':
      return this.chave_pix.length === 32;
    default:
      return false;
  }
};

module.exports = ContaBancaria;
