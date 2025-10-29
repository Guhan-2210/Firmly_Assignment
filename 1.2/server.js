// server.js
require('dotenv').config();
const express = require('express');
require('express-async-errors'); // patch
const morgan = require('morgan');
const logger = require('./logger');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Request logging middleware using morgan that forwards to winston
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body', {
  stream: {
    write: (msg) => {
      // morgan adds a newline; strip it.
      logger.info('http_request', { message: msg.trim() });
    }
  }
}));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.debug('health_check', { path: '/health' });
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  logger.error('unhandled_error', {
    message: err.message,
    stack: err.stack,
    route: req.originalUrl,
    method: req.method
  });
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info('server_started', { port: PORT });
});
