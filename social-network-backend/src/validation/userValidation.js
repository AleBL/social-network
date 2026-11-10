const { ValidationError } = require('../errors');

const NAME_MAX_LENGTH = 100;
// Maximum length of an email address (RFC 5321 path limit).
const EMAIL_MAX_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

// Returns the normalized user (trimmed name, trimmed lowercase email).
// Lowercasing makes the unique email constraint case-insensitive.
function validateNewUser(input) {
  const { name, email } = input || {};

  if (isBlank(name)) {
    throw new ValidationError('name is required');
  }
  if (name.trim().length > NAME_MAX_LENGTH) {
    throw new ValidationError(
      `name must be at most ${NAME_MAX_LENGTH} characters`
    );
  }
  if (isBlank(email)) {
    throw new ValidationError('email is required');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail.length > EMAIL_MAX_LENGTH ||
    !EMAIL_PATTERN.test(normalizedEmail)
  ) {
    throw new ValidationError('email must be a valid email address');
  }

  return { name: name.trim(), email: normalizedEmail };
}

function validateFriendshipIds(userId1, userId2) {
  if (isBlank(userId1)) {
    throw new ValidationError('userId1 is required');
  }
  if (isBlank(userId2)) {
    throw new ValidationError('userId2 is required');
  }
  if (userId1 === userId2) {
    throw new ValidationError('a user cannot be friends with themselves');
  }
}

const SEARCH_MAX_LENGTH = 100;
const LIST_LIMIT_DEFAULT = 20;
const LIST_LIMIT_MAX = 100;
const LIST_OFFSET_MAX = 100000;

function parseInteger(value, { name, min, max, fallback }) {
  if (value === undefined) {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < min || number > max) {
    throw new ValidationError(
      `${name} must be an integer between ${min} and ${max}`
    );
  }

  return number;
}

// GET /api/users?search=&limit=&offset= (all optional).
function parseUserListQuery(query = {}) {
  const { search, limit, offset } = query;

  // ?search=a&search=b arrives as an array.
  if (search !== undefined && typeof search !== 'string') {
    throw new ValidationError('search must be a single value');
  }

  const term = (search ?? '').trim();

  if (term.length > SEARCH_MAX_LENGTH) {
    throw new ValidationError(
      `search must be at most ${SEARCH_MAX_LENGTH} characters`
    );
  }

  return {
    search: term,
    limit: parseInteger(limit, {
      name: 'limit',
      min: 1,
      max: LIST_LIMIT_MAX,
      fallback: LIST_LIMIT_DEFAULT
    }),
    offset: parseInteger(offset, {
      name: 'offset',
      min: 0,
      max: LIST_OFFSET_MAX,
      fallback: 0
    })
  };
}

module.exports = {
  NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  LIST_LIMIT_DEFAULT,
  LIST_LIMIT_MAX,
  SEARCH_MAX_LENGTH,
  parseUserListQuery,
  validateNewUser,
  validateFriendshipIds
};
