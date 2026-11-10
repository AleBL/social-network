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

module.exports = {
  NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  validateNewUser,
  validateFriendshipIds
};
