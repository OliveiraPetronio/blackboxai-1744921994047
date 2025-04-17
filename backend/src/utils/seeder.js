const bcrypt = require('bcryptjs');
const { 
  User, 
  Cliente, 
  Fornecedor, 
  Transportadora, 
  Categoria,
  Produto,
  Configuracao
} = require('../models');
const logger = require('./logger');

class Seeder {
  /**
   * Run all seeders
   */
  static async seedAll() {
    try {
      logger.info('Starting database seeding...');

      await this.seedUsers();
      await this.seedCategorias();
      await this.seedFornecedores();
      await this.seedTransportadoras();
      await this.seedClientes();
      await this.seedProdutos();
      await this.seedConfiguracoes();

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Error seeding database:', error);
      throw error;
    }
  }

  /**
   * Seed users
   */
  static async seedUsers() {
    try {
      logger.info('Seeding users...');

      const users = [
        {
          name: 'Administrador',
          email: 'admin@example.com',
          password: await bcrypt.hash('Admin@123', 10),
          role: 'admin',
          status: 'active'
        },
        {
          name: 'Gerente',
          email: 'gerente@example.com',
          password: await bcrypt.hash('Gerente@123', 10),
          role: 'manager',
          status: 'active'
        },
        {
          name: 'Vendedor',
          email: 'vendedor@example.com',
          password: await bcrypt.hash('Vendedor@123', 10),
          role: 'employee',
          status: 'active'
        }
      ];

      for (const user of users) {
        await User.findOrCreate({
          where: { email: user.email },
          defaults: user
        });
      }

      logger.info('Users seeded successfully');
    } catch (error) {
      logger.error('Error seeding users:', error);
      throw error;
    }
  }

  /**
   * Seed categorias
   */
  static async seedCategorias() {
    try {
      logger.info('Seeding categorias...');

      const categorias = [
        {
          nome: 'Eletrônicos',
          codigo: 'ELE',
          descricao: 'Produtos eletrônicos em geral',
          margem_lucro_padrao: 30,
          status: 'ativa'
        },
        {
          nome: 'Informática',
          codigo: 'INF',
          descricao: 'Produtos de informática',
          margem_lucro_padrao: 25,
          status: 'ativa'
        },
        {
          nome: 'Móveis',
          codigo: 'MOV',
          descricao: 'Móveis para casa e escritório',
          margem_lucro_padrao: 40,
          status: 'ativa'
        }
      ];

      for (const categoria of categorias) {
        await Categoria.findOrCreate({
          where: { codigo: categoria.codigo },
          defaults: categoria
        });
      }

      logger.info('Categorias seeded successfully');
    } catch (error) {
      logger.error('Error seeding categorias:', error);
      throw error;
    }
  }

  /**
   * Seed fornecedores
   */
  static async seedFornecedores() {
    try {
      logger.info('Seeding fornecedores...');

      const fornecedores = [
        {
          razao_social: 'Eletrônicos Brasil LTDA',
          nome_fantasia: 'Eletro BR',
          cnpj: '12345678901234',
          inscricao_estadual: '123456789',
          contato_principal: 'João Silva',
          telefone: '1123456789',
          email: 'contato@eletrobr.com',
          cep: '12345678',
          endereco: 'Rua dos Eletrônicos',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          status: 'ativo'
        },
        {
          razao_social: 'Informática e CIA LTDA',
          nome_fantasia: 'Info Tech',
          cnpj: '98765432109876',
          inscricao_estadual: '987654321',
          contato_principal: 'Maria Santos',
          telefone: '1198765432',
          email: 'contato@infotech.com',
          cep: '87654321',
          endereco: 'Avenida da Informática',
          numero: '456',
          bairro: 'Vila Tech',
          cidade: 'São Paulo',
          estado: 'SP',
          status: 'ativo'
        }
      ];

      for (const fornecedor of fornecedores) {
        await Fornecedor.findOrCreate({
          where: { cnpj: fornecedor.cnpj },
          defaults: fornecedor
        });
      }

      logger.info('Fornecedores seeded successfully');
    } catch (error) {
      logger.error('Error seeding fornecedores:', error);
      throw error;
    }
  }

  /**
   * Seed transportadoras
   */
  static async seedTransportadoras() {
    try {
      logger.info('Seeding transportadoras...');

      const transportadoras = [
        {
          razao_social: 'Transportes Rápidos LTDA',
          nome_fantasia: 'Trans Rápida',
          cnpj: '11222333444555',
          inscricao_estadual: '123456789',
          contato_principal: 'Pedro Souza',
          telefone: '1133445566',
          email: 'contato@transrapida.com',
          cep: '12345678',
          endereco: 'Rua dos Transportes',
          numero: '789',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          status: 'ativo',
          tipo_transporte: 'rodoviario'
        }
      ];

      for (const transportadora of transportadoras) {
        await Transportadora.findOrCreate({
          where: { cnpj: transportadora.cnpj },
          defaults: transportadora
        });
      }

      logger.info('Transportadoras seeded successfully');
    } catch (error) {
      logger.error('Error seeding transportadoras:', error);
      throw error;
    }
  }

  /**
   * Seed clientes
   */
  static async seedClientes() {
    try {
      logger.info('Seeding clientes...');

      const clientes = [
        {
          tipo: 'PF',
          nome: 'José da Silva',
          cpf_cnpj: '12345678901',
          rg_ie: '123456789',
          telefone: '1199887766',
          email: 'jose.silva@email.com',
          cep: '12345678',
          endereco: 'Rua das Flores',
          numero: '123',
          bairro: 'Jardim',
          cidade: 'São Paulo',
          estado: 'SP',
          status: 'ativo'
        },
        {
          tipo: 'PJ',
          nome: 'Comércio Silva LTDA',
          cpf_cnpj: '12345678901234',
          rg_ie: '123456789',
          telefone: '1199887766',
          email: 'comercio.silva@email.com',
          cep: '12345678',
          endereco: 'Avenida Comercial',
          numero: '456',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          status: 'ativo'
        }
      ];

      for (const cliente of clientes) {
        await Cliente.findOrCreate({
          where: { cpf_cnpj: cliente.cpf_cnpj },
          defaults: cliente
        });
      }

      logger.info('Clientes seeded successfully');
    } catch (error) {
      logger.error('Error seeding clientes:', error);
      throw error;
    }
  }

  /**
   * Seed produtos
   */
  static async seedProdutos() {
    try {
      logger.info('Seeding produtos...');

      // Get categorias
      const categoriaEletronicos = await Categoria.findOne({
        where: { codigo: 'ELE' }
      });

      const categoriaInformatica = await Categoria.findOne({
        where: { codigo: 'INF' }
      });

      // Get fornecedor
      const fornecedor = await Fornecedor.findOne({
        where: { nome_fantasia: 'Eletro BR' }
      });

      const produtos = [
        {
          codigo: 'SMART-TV-55',
          codigo_barras: '7891234567890',
          descricao: 'Smart TV LED 55" 4K',
          unidade: 'UN',
          categoria_id: categoriaEletronicos.id,
          fornecedor_id: fornecedor.id,
          preco_custo: 2500.00,
          preco_venda: 3499.99,
          estoque_minimo: 5,
          estoque_maximo: 20,
          estoque_atual: 10,
          status: 'ativo'
        },
        {
          codigo: 'NOTE-I5',
          codigo_barras: '7891234567891',
          descricao: 'Notebook Intel Core i5 8GB RAM 256GB SSD',
          unidade: 'UN',
          categoria_id: categoriaInformatica.id,
          fornecedor_id: fornecedor.id,
          preco_custo: 3000.00,
          preco_venda: 4299.99,
          estoque_minimo: 3,
          estoque_maximo: 15,
          estoque_atual: 8,
          status: 'ativo'
        }
      ];

      for (const produto of produtos) {
        await Produto.findOrCreate({
          where: { codigo: produto.codigo },
          defaults: produto
        });
      }

      logger.info('Produtos seeded successfully');
    } catch (error) {
      logger.error('Error seeding produtos:', error);
      throw error;
    }
  }

  /**
   * Seed configurações
   */
  static async seedConfiguracoes() {
    try {
      logger.info('Seeding configurações...');
      await Configuracao.inicializarConfiguracoes();
      logger.info('Configurações seeded successfully');
    } catch (error) {
      logger.error('Error seeding configurações:', error);
      throw error;
    }
  }
}

module.exports = Seeder;
