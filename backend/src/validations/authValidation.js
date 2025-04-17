const Joi = require('joi');

// Custom password validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordMessage = 'Senha deve conter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais';

// Custom name validation
const nameRegex = /^[a-zA-ZÀ-ÿ\s']{2,}$/;
const nameMessage = 'Nome deve conter apenas letras e espaços, com no mínimo 2 caracteres';

/**
 * Schema for user registration
 */
const registerSchema = Joi.object({
  name: Joi.string()
    .pattern(nameRegex)
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.pattern.base': nameMessage,
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
      'string.max': 'Nome deve ter no máximo {#limit} caracteres'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'string.empty': 'Email é obrigatório'
    }),

  password: Joi.string()
    .pattern(passwordRegex)
    .required()
    .messages({
      'string.pattern.base': passwordMessage,
      'string.empty': 'Senha é obrigatória'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Senhas não conferem',
      'string.empty': 'Confirmação de senha é obrigatória'
    }),

  role: Joi.string()
    .valid('admin', 'manager', 'employee')
    .default('employee')
    .messages({
      'any.only': 'Função inválida'
    })
}).options({ stripUnknown: true });

/**
 * Schema for user login
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'string.empty': 'Email é obrigatório'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória'
    })
}).options({ stripUnknown: true });

/**
 * Schema for profile update
 */
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .pattern(nameRegex)
    .min(2)
    .max(100)
    .messages({
      'string.pattern.base': nameMessage,
      'string.min': 'Nome deve ter no mínimo {#limit} caracteres',
      'string.max': 'Nome deve ter no máximo {#limit} caracteres'
    }),

  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Email inválido'
    }),

  currentPassword: Joi.string()
    .when('newPassword', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'string.empty': 'Senha atual é obrigatória'
    }),

  newPassword: Joi.string()
    .pattern(passwordRegex)
    .messages({
      'string.pattern.base': passwordMessage
    }),

  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .when('newPassword', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'any.only': 'Senhas não conferem',
      'string.empty': 'Confirmação de senha é obrigatória'
    })
}).options({ stripUnknown: true });

/**
 * Schema for password change
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha atual é obrigatória'
    }),

  newPassword: Joi.string()
    .pattern(passwordRegex)
    .required()
    .messages({
      'string.pattern.base': passwordMessage,
      'string.empty': 'Nova senha é obrigatória'
    }),

  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Senhas não conferem',
      'string.empty': 'Confirmação de senha é obrigatória'
    })
}).options({ stripUnknown: true });

/**
 * Schema for password reset request
 */
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email inválido',
      'string.empty': 'Email é obrigatório'
    })
}).options({ stripUnknown: true });

/**
 * Schema for password reset
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Token é obrigatório'
    }),

  password: Joi.string()
    .pattern(passwordRegex)
    .required()
    .messages({
      'string.pattern.base': passwordMessage,
      'string.empty': 'Nova senha é obrigatória'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Senhas não conferem',
      'string.empty': 'Confirmação de senha é obrigatória'
    })
}).options({ stripUnknown: true });

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  
  // Export regex patterns for reuse
  patterns: {
    password: passwordRegex,
    name: nameRegex
  },
  
  // Export messages for reuse
  messages: {
    password: passwordMessage,
    name: nameMessage
  }
};
