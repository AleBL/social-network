// Origins allowed when CORS_ORIGIN is not set (local development).
const DEFAULT_ORIGINS = ['http://localhost:8080'];

// CORS_ORIGIN is a comma-separated list, e.g.
// "https://my-frontend.onrender.com,http://localhost:8080"
function parseAllowedOrigins(value) {
  if (!value) {
    return DEFAULT_ORIGINS;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = { DEFAULT_ORIGINS, parseAllowedOrigins };
