const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Generate a new secret key for JWT signing
 * Usage: node src/scripts/generateSecretKey.js
 */
function generateSecretKey() {
  try {
    // Generate a random 256-bit (32-byte) key
    const secretKey = crypto.randomBytes(32).toString('hex');

    // Get the path to the .env file
    const envPath = path.join(__dirname, '..', '..', '.env');

    // Read existing .env file
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      // File doesn't exist, that's okay
    }

    // Replace existing JWT_SECRET or append new one
    const newContent = envContent.includes('JWT_SECRET=')
      ? envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${secretKey}`)
      : `${envContent}\nJWT_SECRET=${secretKey}`;

    // Write back to .env file
    fs.writeFileSync(envPath, newContent.trim() + '\n');

    logger.info('New secret key generated and saved to .env file');
    logger.info('Key:', secretKey);

    // Also create a .env.example file if it doesn't exist
    const envExamplePath = path.join(__dirname, '..', '..', '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      const exampleContent = `# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=retail_management

# JWT
JWT_SECRET=your-secret-key-here

# CORS
CORS_ORIGIN=http://localhost:8000

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=5242880 # 5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Email (for future implementation)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=no-reply@example.com`;

      fs.writeFileSync(envExamplePath, exampleContent.trim() + '\n');
      logger.info('.env.example file created');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error generating secret key:', error);
    process.exit(1);
  }
}

// Add this command to package.json scripts:
// "generate:key": "node src/scripts/generateSecretKey.js"

// Run the script
generateSecretKey();
