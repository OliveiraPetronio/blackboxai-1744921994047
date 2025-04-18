const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// API Routes (will be implemented later)
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
/* app.use('/api/clientes', require('./routes/clientes')); */
 /* app.use('/api/fornecedores', require('./routes/fornecedores')); */
 /* app.use('/api/transportadoras', require('./routes/transportadoras')); */
 /* app.use('/api/contas-bancarias', require('./routes/contasBancarias')); */
 /* app.use('/api/vendas', require('./routes/vendas')); */
 /* app.use('/api/financeiro', require('./routes/financeiro')); */
 /* app.use('/api/relatorios', require('./routes/relatorios')); */
 /* app.use('/api/config', require('./routes/config')); */

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

module.exports = app;
