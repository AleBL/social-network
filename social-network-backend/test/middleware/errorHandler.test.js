const {
  DB_UNAVAILABLE_MESSAGE,
  GENERIC_MESSAGE,
  errorHandler,
  notFoundHandler
} = require('../../src/middleware/errorHandler');
const { NotFoundError, ValidationError } = require('../../src/errors');

const mockResponse = () => {
  const res = { headersSent: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const withSyntaxError = () => {
  const err = new SyntaxError('Unexpected token b in JSON at position 1');
  err.type = 'entity.parse.failed';
  err.status = 400;
  return err;
};

const withDriverCode = (code) => {
  const err = new Error('driver failure');
  err.code = code;
  return err;
};

// Silences the server-error logs for this file (Jest isolates each test file).
const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('errorHandler', () => {
  beforeEach(() => {
    consoleError.mockClear();
  });

  it.each([
    [
      'NotFoundError',
      new NotFoundError('User with id 1 not found'),
      404,
      'User with id 1 not found'
    ],
    [
      'ValidationError',
      new ValidationError('name is required'),
      400,
      'name is required'
    ],
    [
      'plain error with statusCode',
      Object.assign(new Error('Conflict'), { statusCode: 409 }),
      409,
      'Conflict'
    ],
    ['malformed JSON body', withSyntaxError(), 400, 'Invalid JSON body'],
    [
      'driver ServiceUnavailable',
      withDriverCode('ServiceUnavailable'),
      503,
      DB_UNAVAILABLE_MESSAGE
    ],
    [
      'driver SessionExpired',
      withDriverCode('SessionExpired'),
      503,
      DB_UNAVAILABLE_MESSAGE
    ],
    [
      'OGM connection failure',
      new Error(
        'Failed to connect to server. Please ensure that your database is listening'
      ),
      503,
      DB_UNAVAILABLE_MESSAGE
    ],
    [
      'unexpected error',
      new Error('secret internal detail'),
      500,
      GENERIC_MESSAGE
    ],
    ['undefined', undefined, 500, GENERIC_MESSAGE],
    ['empty object', {}, 500, GENERIC_MESSAGE]
  ])('maps %s to %i', (_label, err, statusCode, message) => {
    const res = mockResponse();

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', error: message });
  });

  it('logs server errors but not client errors', () => {
    errorHandler(new Error('boom'), {}, mockResponse(), jest.fn());
    errorHandler(new NotFoundError('nope'), {}, mockResponse(), jest.fn());

    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('delegates to Express when headers were already sent', () => {
    const res = mockResponse();
    res.headersSent = true;
    const next = jest.fn();
    const err = new Error('late failure');

    errorHandler(err, {}, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('notFoundHandler', () => {
  it('answers 404 in the API error format', () => {
    const res = mockResponse();

    notFoundHandler({}, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'Route not found'
    });
  });
});
