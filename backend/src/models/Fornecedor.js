const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Fornecedor extends Model {}

Fornecedor.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  razao_social: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  nome_fantasia: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  cnpj: {
    type: DataTypes.STRING(14),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [14, 14]
    }
  },
  inscricao_estadual: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contato_principal: {
    type: DataTypes.STRING,
    allowNull: false
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
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  website: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
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
  prazo_entrega: {
    type: DataTypes.INTEGER,
    comment: 'Prazo médio de entrega em dias'
  },
  condicao_pagamento: {
    type: DataTypes.STRING,
    comment: 'Condições padrão de pagamento'
  },
  status: {
    type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
    defaultValue: 'ativo'
  },
  categoria: {
    type: DataTypes.STRING,
    comment: 'Categoria principal do fornecedor'
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  ultima_compra: {
    type: DataTypes.DATE
  },
  avaliacao: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 5
    },
    comment: 'Avaliação do fornecedor (0-5)'
  }
}, {
  sequelize,
  modelName: 'fornecedor',
  indexes: [
    {
      unique: true,
      fields: ['cnpj']
    },
    {
      fields: ['razao_social']
    },
    {
      fields: ['nome_fantasia']
    }
  ]
});

// Instance method to format address
Fornecedor.prototype.getFullAddress = function() {
  return `${this.endereco}, ${this.numero}${this.complemento ? ` - ${this.complemento}` : ''}, ${this.bairro}, ${this.cidade}/${this.estado}, CEP: ${this.cep}`;
};

// Instance method to update last purchase date
Fornecedor.prototype.updateLastPurchase = async function() {
  this.ultima_compra = new Date();
  await this.save();
};

// Instance method to update rating
Fornecedor.prototype.updateRating = async function(rating) {
  if (rating >= 0 && rating <= 5) {
    this.avaliacao = rating;
    await this.save();
    return true;
  }
  return false;
};

module.exports = Fornecedor;
