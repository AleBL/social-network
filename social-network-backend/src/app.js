const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { parseAllowedOrigins } = require('./config/cors');
const { createRateLimiters, parseTrustProxy } = require('./config/rateLimit');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

// Security headers (also removes X-Powered-By).
app.use(helmet());
app.use(cors({ origin: parseAllowedOrigins(process.env.CORS_ORIGIN) }));
// Our payloads are tiny; a low limit rejects oversized bodies early (413).
app.use(express.json({ limit: '10kb' }));

// /ping stays outside /api so health checks are never rate limited.
const { apiLimiter, writeLimiter } = createRateLimiters();
app.use('/api', apiLimiter, writeLimiter);

app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: 'PONG'
  });
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Must be registered after all routes.
app.use(notFoundHandler);
app.use(errorHandler);

// Only listen when run directly (node src/app.js), not when imported by tests.
if (require.main === module) {
  // Hosting platforms (e.g. Render) inject PORT; BACKEND_PORT is the local/Docker fallback.
  const port = process.env.PORT || process.env.BACKEND_PORT || 3000;

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
