const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class NotaFiscal extends Model {}

NotaFiscal.init({
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
  tipo_documento: {
    type: DataTypes.ENUM('nfce', 'nfe'),
    allowNull: false,
    defaultValue: 'nfce'
  },
  numero: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  serie: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  chave_acesso: {
    type: DataTypes.STRING(44),
    unique: true,
    validate: {
      len: [44, 44]
    }
  },
  protocolo_autorizacao: {
    type: DataTypes.STRING,
    unique: true
  },
  data_emissao: {
    type: DataTypes.DATE,
    allowNull: false
  },
  data_autorizacao: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM(
      'em_digitacao',
      'pendente',
      'processando',
      'autorizada',
      'cancelada',
      'rejeitada',
      'inutilizada'
    ),
    defaultValue: 'em_digitacao'
  },
  ambiente: {
    type: DataTypes.ENUM('homologacao', 'producao'),
    allowNull: false,
    defaultValue: 'homologacao'
  },
  valor_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  valor_produtos: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  valor_desconto: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_frete: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_seguro: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_outras_despesas: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  base_calculo_icms: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_icms: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  base_calculo_icms_st: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_icms_st: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_pis: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_cofins: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  valor_ipi: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  informacoes_adicionais: {
    type: DataTypes.TEXT
  },
  justificativa_cancelamento: {
    type: DataTypes.TEXT
  },
  xml_enviado: {
    type: DataTypes.TEXT,
    comment: 'XML enviado para SEFAZ'
  },
  xml_retorno: {
    type: DataTypes.TEXT,
    comment: 'XML de retorno da SEFAZ'
  },
  url_danfe: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  mensagem_sefaz: {
    type: DataTypes.TEXT,
    comment: 'Mensagem de retorno da SEFAZ'
  },
  codigo_retorno_sefaz: {
    type: DataTypes.STRING,
    comment: 'Código de retorno da SEFAZ'
  },
  tentativas_envio: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'nota_fiscal',
  indexes: [
    {
      fields: ['venda_id']
    },
    {
      unique: true,
      fields: ['numero', 'serie', 'tipo_documento']
    },
    {
      unique: true,
      fields: ['chave_acesso']
    },
    {
      fields: ['data_emissao']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance method to generate access key
NotaFiscal.prototype.gerarChaveAcesso = function(empresa) {
  // Implementação do algoritmo de geração da chave de acesso
  // Este é apenas um exemplo simplificado
  const uf = empresa.codigo_uf.toString().padStart(2, '0');
  const data = this.data_emissao.toISOString().slice(2,4) + this.data_emissao.toISOString().slice(5,7);
  const cnpj = empresa.cnpj.padStart(14, '0');
  const modelo = this.tipo_documento === 'nfce' ? '65' : '55';
  const serie = this.serie.toString().padStart(3, '0');
  const numero = this.numero.toString().padStart(9, '0');
  const tpEmis = '1';
  const cNF = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
  
  const baseChave = `${uf}${data}${cnpj}${modelo}${serie}${numero}${tpEmis}${cNF}`;
  // Cálculo do DV (dígito verificador) - Módulo 11
  let soma = 0;
  let peso = 2;
  
  for(let i = baseChave.length - 1; i >= 0; i--) {
    soma += parseInt(baseChave[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  const dv = 11 - (soma % 11);
  const digitoVerificador = dv === 10 || dv === 11 ? '0' : dv.toString();
  
  return baseChave + digitoVerificador;
};

// Instance method to cancel invoice
NotaFiscal.prototype.cancelar = async function(justificativa) {
  if (!['autorizada'].includes(this.status)) {
    throw new Error('Nota fiscal não pode ser cancelada no status atual');
  }
  
  if (!justificativa || justificativa.length < 15) {
    throw new Error('Justificativa deve ter no mínimo 15 caracteres');
  }
  
  this.status = 'cancelada';
  this.justificativa_cancelamento = justificativa;
  await this.save();
  
  return true;
};

// Instance method to get invoice status
NotaFiscal.prototype.consultarStatus = async function() {
  // Aqui seria implementada a consulta real ao webservice da SEFAZ
  return {
    status: this.status,
    mensagem: this.mensagem_sefaz,
    codigo: this.codigo_retorno_sefaz
  };
};

// Instance method to get tax totals
NotaFiscal.prototype.getTotaisImpostos = function() {
  return {
    icms: {
      base: this.base_calculo_icms,
      valor: this.valor_icms
    },
    icms_st: {
      base: this.base_calculo_icms_st,
      valor: this.valor_icms_st
    },
    pis: this.valor_pis,
    cofins: this.valor_cofins,
    ipi: this.valor_ipi
  };
};

module.exports = NotaFiscal;
