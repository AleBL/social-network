const { rateLimit } = require('express-rate-limit');

const WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 300;
// Writes are limited harder: they fill the AuraDB Free node quota.
const DEFAULT_WRITE_MAX = 30;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function createLimiter(limit, message, skip) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Same body format as every other API error.
    message: { status: 'error', error: message },
    skip
  });
}

// Limits are per client IP and per 15 minutes. Env vars allow raising them
// (the integration tests send many writes from a single IP).
function createRateLimiters(env = process.env) {
  return {
    apiLimiter: createLimiter(
      readPositiveInt(env.RATE_LIMIT_MAX, DEFAULT_MAX),
      'Too many requests, please try again later'
    ),
    writeLimiter: createLimiter(
      readPositiveInt(env.RATE_LIMIT_WRITE_MAX, DEFAULT_WRITE_MAX),
      'Too many write requests, please try again later',
      (req) => SAFE_METHODS.has(req.method)
    )
  };
}

// Express "trust proxy": needed behind Render's proxy so req.ip is the client
// IP and not the proxy's (otherwise every client would share one limit).
// A hop count ("1") is safer than "true", which trusts any X-Forwarded-For.
function parseTrustProxy(value) {
  if (value === undefined || value === '' || value === 'false') {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  return value;
}

module.exports = {
  DEFAULT_MAX,
  DEFAULT_WRITE_MAX,
  createRateLimiters,
  parseTrustProxy,
  readPositiveInt
};
