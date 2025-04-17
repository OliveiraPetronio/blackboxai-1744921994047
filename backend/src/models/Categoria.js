const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Categoria extends Model {}

Categoria.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  descricao: {
    type: DataTypes.TEXT
  },
  categoria_pai_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categoria',
      key: 'id'
    },
    comment: 'ID da categoria pai para categorias hierárquicas'
  },
  nivel: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Nível hierárquico da categoria'
  },
  caminho: {
    type: DataTypes.STRING,
    comment: 'Caminho completo da categoria (ex: Eletrônicos/Smartphones/Android)'
  },
  codigo: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('ativa', 'inativa'),
    defaultValue: 'ativa'
  },
  margem_lucro_padrao: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Margem de lucro padrão para produtos desta categoria'
  },
  icms_padrao: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Alíquota ICMS padrão para produtos desta categoria'
  },
  pis_padrao: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Alíquota PIS padrão para produtos desta categoria'
  },
  cofins_padrao: {
    type: DataTypes.DECIMAL(5, 2),
    comment: 'Alíquota COFINS padrão para produtos desta categoria'
  },
  ncm_padrao: {
    type: DataTypes.STRING(8),
    validate: {
      len: [8, 8]
    },
    comment: 'NCM padrão para produtos desta categoria'
  },
  cest_padrao: {
    type: DataTypes.STRING(7),
    validate: {
      len: [7, 7]
    },
    comment: 'CEST padrão para produtos desta categoria'
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Ordem de exibição da categoria'
  },
  imagem_url: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  meta_title: {
    type: DataTypes.STRING,
    comment: 'Título para SEO'
  },
  meta_description: {
    type: DataTypes.TEXT,
    comment: 'Descrição para SEO'
  },
  meta_keywords: {
    type: DataTypes.STRING,
    comment: 'Palavras-chave para SEO'
  }
}, {
  sequelize,
  modelName: 'categoria',
  indexes: [
    {
      unique: true,
      fields: ['codigo']
    },
    {
      fields: ['nome']
    },
    {
      fields: ['categoria_pai_id']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance method to get full path
Categoria.prototype.getCaminhoCompleto = async function() {
  if (!this.categoria_pai_id) {
    return this.nome;
  }

  const categoriaPai = await Categoria.findByPk(this.categoria_pai_id);
  if (!categoriaPai) {
    return this.nome;
  }

  const caminhoPai = await categoriaPai.getCaminhoCompleto();
  return `${caminhoPai}/${this.nome}`;
};

// Instance method to get all subcategories
Categoria.prototype.getSubcategorias = async function() {
  return await Categoria.findAll({
    where: {
      categoria_pai_id: this.id,
      status: 'ativa'
    }
  });
};

// Instance method to get category tree
Categoria.prototype.getArvoreCategoria = async function() {
  const subcategorias = await this.getSubcategorias();
  
  const arvore = {
    id: this.id,
    nome: this.nome,
    nivel: this.nivel,
    codigo: this.codigo,
    status: this.status
  };

  if (subcategorias.length > 0) {
    arvore.subcategorias = await Promise.all(
      subcategorias.map(async (subcat) => await subcat.getArvoreCategoria())
    );
  }

  return arvore;
};

// Instance method to update category path
Categoria.prototype.atualizarCaminho = async function() {
  this.caminho = await this.getCaminhoCompleto();
  await this.save();
  
  // Atualiza o caminho das subcategorias
  const subcategorias = await this.getSubcategorias();
  for (const subcat of subcategorias) {
    await subcat.atualizarCaminho();
  }
};

// Class method to get root categories
Categoria.getRootCategorias = async function() {
  return await this.findAll({
    where: {
      categoria_pai_id: null,
      status: 'ativa'
    },
    order: [['ordem', 'ASC']]
  });
};

// Add hooks
Categoria.addHook('afterCreate', async (categoria) => {
  await categoria.atualizarCaminho();
});

Categoria.addHook('afterUpdate', async (categoria) => {
  if (categoria.changed('nome') || categoria.changed('categoria_pai_id')) {
    await categoria.atualizarCaminho();
  }
});

module.exports = Categoria;
