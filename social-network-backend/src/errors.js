// Errors that carry the HTTP status the controller should answer with.
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class ValidationError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}

class ConflictError extends HttpError {
  constructor(message) {
    super(409, message);
  }
}

module.exports = { HttpError, ValidationError, ConflictError };
