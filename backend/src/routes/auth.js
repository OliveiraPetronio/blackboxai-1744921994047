const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateSchema } = require('../middleware/validationMiddleware');
const { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema,
  changePasswordSchema,
  resetPasswordSchema 
} = require('../validations/authValidation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateSchema(registerSchema),
  authMiddleware.hasRole('admin'),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user & get token
 * @access  Public
 */
router.post(
  '/login',
  validateSchema(loginSchema),
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authMiddleware.fullSession,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/me
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/me',
  authMiddleware.required,
  validateSchema(updateProfileSchema),
  authController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  authMiddleware.required,
  validateSchema(changePasswordSchema),
  authController.changePassword
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  '/reset-password',
  validateSchema(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user / Clear cookie
 * @access  Private
 */
router.post(
  '/logout',
  authMiddleware.required,
  authController.logout
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and return user
 * @access  Private
 */
router.get(
  '/verify',
  authMiddleware.required,
  (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  }
);

/**
 * @route   GET /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private
 */
router.get(
  '/refresh',
  authMiddleware.withRefreshToken,
  (req, res) => {
    // New token is already set in header by middleware
    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  }
);

module.exports = router;
