const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, email, password, role = 'employee' } = req.body;

      // Validate input
      if (!name || !email || !password) {
        throw new ValidationError('Nome, email e senha são obrigatórios');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new ValidationError('Email já cadastrado');
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role
      });

      // Generate token
      const token = user.generateAuthToken();

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @route POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw new ValidationError('Email e senha são obrigatórios');
      }

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new ValidationError('Credenciais inválidas');
      }

      // Check password
      const isMatch = await user.checkPassword(password);
      if (!isMatch) {
        throw new ValidationError('Credenciais inválidas');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new ValidationError('Usuário inativo');
      }

      // Update last login
      user.last_login = new Date();
      await user.save();

      // Generate token
      const token = user.generateAuthToken();

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * @route GET /api/auth/me
   */
  async getProfile(req, res) {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  }

  /**
   * Update user profile
   * @route PUT /api/auth/me
   */
  async updateProfile(req, res, next) {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const user = req.user;

      // Update basic info
      if (name) user.name = name;
      
      // Update email
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          throw new ValidationError('Email já cadastrado');
        }
        user.email = email;
      }

      // Update password
      if (currentPassword && newPassword) {
        const isMatch = await user.checkPassword(currentPassword);
        if (!isMatch) {
          throw new ValidationError('Senha atual incorreta');
        }
        user.password = newPassword;
      }

      await user.save();

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * @route POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal user existence
        return res.json({
          success: true,
          message: 'Se um usuário com este email existir, você receberá instruções para redefinir sua senha.'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      user.reset_password_token = resetToken;
      user.reset_password_expires = resetTokenExpiry;
      await user.save();

      // TODO: Send email with reset token
      logger.info(`Reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message: 'Se um usuário com este email existir, você receberá instruções para redefinir sua senha.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * @route POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const user = await User.findOne({
        where: {
          reset_password_token: token,
          reset_password_expires: {
            [Op.gt]: Date.now()
          }
        }
      });

      if (!user) {
        throw new ValidationError('Token inválido ou expirado');
      }

      // Update password
      user.password = password;
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await user.save();

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * @route POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // Validate current password
      const isMatch = await user.checkPassword(currentPassword);
      if (!isMatch) {
        throw new ValidationError('Senha atual incorreta');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * @route POST /api/auth/logout
   */
  async logout(req, res) {
    // In a JWT-based auth system, we don't need to do anything server-side
    // The client should remove the token
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  }
}

module.exports = new AuthController();
