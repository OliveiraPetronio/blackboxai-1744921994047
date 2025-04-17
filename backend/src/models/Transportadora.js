const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Transportadora extends Model {}

Transportadora.init({
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
    type: DataTypes.STRING
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
  status: {
    type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
    defaultValue: 'ativo'
  },
  tipo_transporte: {
    type: DataTypes.ENUM('rodoviario', 'aereo', 'maritimo', 'multimodal'),
    allowNull: false,
    defaultValue: 'rodoviario'
  },
  areas_atendimento: {
    type: DataTypes.JSON,
    comment: 'Regiões/estados atendidos pela transportadora'
  },
  tempo_medio_entrega: {
    type: DataTypes.INTEGER,
    comment: 'Tempo médio de entrega em dias'
  },
  valor_minimo_frete: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  seguro_padrao: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se oferece seguro padrão para as entregas'
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  ultima_entrega: {
    type: DataTypes.DATE
  },
  avaliacao: {
    type: DataTypes.DECIMAL(2, 1),
    validate: {
      min: 0,
      max: 5
    },
    comment: 'Avaliação média da transportadora (0-5)'
  },
  total_entregas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  entregas_no_prazo: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'transportadora',
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
Transportadora.prototype.getFullAddress = function() {
  return `${this.endereco}, ${this.numero}${this.complemento ? ` - ${this.complemento}` : ''}, ${this.bairro}, ${this.cidade}/${this.estado}, CEP: ${this.cep}`;
};

// Instance method to calculate delivery success rate
Transportadora.prototype.getDeliverySuccessRate = function() {
  if (this.total_entregas === 0) return 0;
  return (this.entregas_no_prazo / this.total_entregas) * 100;
};

// Instance method to register new delivery
Transportadora.prototype.registerDelivery = async function(onTime = true) {
  this.total_entregas += 1;
  if (onTime) this.entregas_no_prazo += 1;
  this.ultima_entrega = new Date();
  await this.save();
};

// Instance method to update rating
Transportadora.prototype.updateRating = async function(rating) {
  if (rating >= 0 && rating <= 5) {
    this.avaliacao = rating;
    await this.save();
    return true;
  }
  return false;
};

module.exports = Transportadora;
