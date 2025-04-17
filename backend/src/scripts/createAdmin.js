const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Create admin user
 * Usage: node src/scripts/createAdmin.js <email> <password>
 */
async function createAdminUser() {
  try {
    const [email, password] = process.argv.slice(2);

    if (!email || !password) {
      logger.error('Please provide email and password');
      logger.info('Usage: node src/scripts/createAdmin.js <email> <password>');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logger.error('User already exists');
      process.exit(1);
    }

    // Create admin user
    const user = await User.create({
      name: 'Administrator',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active'
    });

    logger.info('Admin user created successfully:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Add this command to package.json scripts:
// "create:admin": "node src/scripts/createAdmin.js"

// Run the script
createAdminUser();
