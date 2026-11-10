const {
  NAME_MAX_LENGTH,
  validateNewUser,
  validateFriendshipIds
} = require('../../src/validation/userValidation');

describe('validateNewUser', () => {
  it('returns the trimmed name and the trimmed lowercase email', () => {
    expect(
      validateNewUser({ name: '  Alice ', email: '  Alice@Example.COM ' })
    ).toEqual({ name: 'Alice', email: 'alice@example.com' });
  });

  it.each([
    [undefined, 'name is required'],
    [{}, 'name is required'],
    [{ name: '   ', email: 'a@b.co' }, 'name is required'],
    [{ name: 42, email: 'a@b.co' }, 'name is required'],
    [
      { name: 'a'.repeat(NAME_MAX_LENGTH + 1), email: 'a@b.co' },
      `name must be at most ${NAME_MAX_LENGTH} characters`
    ],
    [{ name: 'Alice' }, 'email is required'],
    [{ name: 'Alice', email: '' }, 'email is required'],
    [
      { name: 'Alice', email: 'not-an-email' },
      'email must be a valid email address'
    ],
    [
      { name: 'Alice', email: 'a b@c.co' },
      'email must be a valid email address'
    ],
    [
      { name: 'Alice', email: `${'a'.repeat(250)}@b.co` },
      'email must be a valid email address'
    ]
  ])('rejects %j with "%s"', (input, message) => {
    expect(() => validateNewUser(input)).toThrow(
      expect.objectContaining({ message, statusCode: 400 })
    );
  });
});

describe('validateFriendshipIds', () => {
  it('accepts two different ids', () => {
    expect(() => validateFriendshipIds('1', '2')).not.toThrow();
  });

  it.each([
    [undefined, '2', 'userId1 is required'],
    ['1', '', 'userId2 is required'],
    ['1', 2, 'userId2 is required'],
    ['1', '1', 'a user cannot be friends with themselves']
  ])('rejects (%j, %j) with "%s"', (userId1, userId2, message) => {
    expect(() => validateFriendshipIds(userId1, userId2)).toThrow(
      expect.objectContaining({ message, statusCode: 400 })
    );
  });
});
