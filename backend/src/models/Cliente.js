const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Cliente extends Model {}

Cliente.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tipo: {
    type: DataTypes.ENUM('PF', 'PJ'),
    allowNull: false,
    comment: 'PF: Pessoa Física, PJ: Pessoa Jurídica'
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  cpf_cnpj: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [11, 14]
    }
  },
  rg_ie: {
    type: DataTypes.STRING,
    comment: 'RG (Pessoa Física) ou IE (Pessoa Jurídica)'
  },
  data_nascimento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING,
    validate: {
      len: [10, 11]
    }
  },
  celular: {
    type: DataTypes.STRING,
    validate: {
      len: [10, 11]
    }
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  cep: {
    type: DataTypes.STRING(8),
    validate: {
      len: [8, 8]
    }
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false
  },
  complemento: {
    type: DataTypes.STRING
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: false,
    validate: {
      len: [2, 2]
    }
  },
  limite_credito: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
    defaultValue: 'ativo'
  },
  observacoes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'cliente',
  indexes: [
    {
      unique: true,
      fields: ['cpf_cnpj']
    },
    {
      fields: ['nome']
    },
    {
      fields: ['email']
    }
  ]
});

// Instance method to check credit limit
Cliente.prototype.checkCreditLimit = function(amount) {
  return this.limite_credito >= amount;
};

// Instance method to format address
Cliente.prototype.getFullAddress = function() {
  return `${this.endereco}, ${this.numero}${this.complemento ? ` - ${this.complemento}` : ''}, ${this.bairro}, ${this.cidade}/${this.estado}, CEP: ${this.cep}`;
};

module.exports = Cliente;
