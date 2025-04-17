const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

// Roles hierarchy
const rolesHierarchy = {
  admin: ['admin', 'manager', 'employee'],
  manager: ['manager', 'employee'],
  employee: ['employee']
};

// Verify JWT token middleware
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado - Token não fornecido'
      });
    }

    // Check if the authorization header has the correct format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido'
      });
    }

    // Get token from header
    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Usuário inativo'
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth Middleware Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Não autorizado'
    });
  }
};

// Check role middleware
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const userRole = req.user.role;
    
    // If roles is a single string, convert to array
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    // Check if user's role has permission
    const hasPermission = requiredRoles.some(role => 
      rolesHierarchy[userRole]?.includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - Permissão insuficiente'
      });
    }

    next();
  };
};

// Refresh token middleware
const refreshToken = async (req, res, next) => {
  try {
    const user = req.user;
    const newToken = user.generateAuthToken();

    // Add new token to response header
    res.setHeader('X-New-Token', newToken);
    next();
  } catch (error) {
    logger.error('Refresh Token Error:', error);
    next();
  }
};

// Update last login middleware
const updateLastLogin = async (req, res, next) => {
  try {
    const user = req.user;
    user.last_login = new Date();
    await user.save();
    next();
  } catch (error) {
    logger.error('Update Last Login Error:', error);
    next();
  }
};

// Validate active session middleware
const validateSession = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Check if user's last login was within the last 24 hours
    const lastLogin = new Date(user.last_login);
    const now = new Date();
    const diffHours = Math.abs(now - lastLogin) / 36e5; // Convert to hours

    if (diffHours > 24) {
      return res.status(401).json({
        success: false,
        error: 'Sessão expirada - Faça login novamente'
      });
    }

    next();
  } catch (error) {
    logger.error('Validate Session Error:', error);
    next(error);
  }
};

// Combine multiple middleware
const authMiddleware = {
  // Basic authentication
  required: auth,
  
  // Role-based authentication
  admin: [auth, checkRole('admin')],
  manager: [auth, checkRole(['admin', 'manager'])],
  employee: [auth, checkRole(['admin', 'manager', 'employee'])],
  
  // Custom role check
  hasRole: (roles) => [auth, checkRole(roles)],
  
  // Session management
  withRefreshToken: [auth, refreshToken],
  withLastLogin: [auth, updateLastLogin],
  withSessionValidation: [auth, validateSession],
  
  // Combine all session features
  fullSession: [
    auth,
    validateSession,
    updateLastLogin,
    refreshToken
  ]
};

module.exports = authMiddleware;
