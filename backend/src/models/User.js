const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User extends Model {
  // Instance method to generate JWT token
  generateAuthToken() {
    return jwt.sign(
      { id: this.id, email: this.email, role: this.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Instance method to check password
  async checkPassword(password) {
    return await bcrypt.compare(password, this.password);
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'employee'),
    allowNull: false,
    defaultValue: 'employee'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  last_login: {
    type: DataTypes.DATE
  },
  reset_password_token: {
    type: DataTypes.STRING
  },
  reset_password_expires: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'user',
  hooks: {
    // Hash password before saving
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Class method to find user by email
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

// Remove password and sensitive fields when converting to JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.reset_password_token;
  delete values.reset_password_expires;
  return values;
};

module.exports = User;
