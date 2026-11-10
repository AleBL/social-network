const GENERIC_MESSAGE = 'An unexpected error occurred';
const DB_UNAVAILABLE_MESSAGE = 'Database unavailable, please try again later';

// Neo4j driver error codes for an unreachable database.
const DB_UNAVAILABLE_CODES = new Set(['ServiceUnavailable', 'SessionExpired']);
// The OGM rethrows driver errors as plain Errors, keeping only the message.
const DB_UNAVAILABLE_PATTERNS = [
  /Failed to connect to server/i,
  /Could not perform discovery/i,
  /No routing servers available/i
];

function isClientErrorStatus(status) {
  return Number.isInteger(status) && status >= 400 && status < 500;
}

function isDatabaseUnavailable(err) {
  if (DB_UNAVAILABLE_CODES.has(err.code)) {
    return true;
  }
  const message = typeof err.message === 'string' ? err.message : '';
  return DB_UNAVAILABLE_PATTERNS.some((pattern) => pattern.test(message));
}

// Maps any thrown value to the HTTP status and the message safe to expose.
function resolveError(err) {
  if (!err) {
    return { statusCode: 500, message: GENERIC_MESSAGE };
  }
  // body-parser errors (malformed JSON, payload too large) carry err.type and
  // err.status. Checked first: they also set statusCode, but their raw parser
  // message should not reach the client.
  if (err.type && isClientErrorStatus(err.status)) {
    const message =
      err.type === 'entity.parse.failed' ? 'Invalid JSON body' : err.message;
    return { statusCode: err.status, message };
  }
  // Our HttpErrors (400/404/409) carry a message meant for the client.
  if (isClientErrorStatus(err.statusCode)) {
    return { statusCode: err.statusCode, message: err.message };
  }
  if (isDatabaseUnavailable(err)) {
    return { statusCode: 503, message: DB_UNAVAILABLE_MESSAGE };
  }
  // Anything else is a bug or an infrastructure error: never leak its details.
  return { statusCode: 500, message: GENERIC_MESSAGE };
}

// Express recognizes error middleware by its four parameters.
function errorHandler(err, req, res, next) {
  const { statusCode, message } = resolveError(err);

  if (statusCode >= 500) {
    console.error(err);
  }
  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({ status: 'error', error: message });
}

function notFoundHandler(req, res) {
  res.status(404).json({ status: 'error', error: 'Route not found' });
}

module.exports = {
  DB_UNAVAILABLE_MESSAGE,
  GENERIC_MESSAGE,
  errorHandler,
  notFoundHandler,
  resolveError
};
