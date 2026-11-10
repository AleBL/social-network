const {
  parseTrustProxy,
  readPositiveInt
} = require('../../src/config/rateLimit');

describe('parseTrustProxy', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['false', false],
    ['true', true],
    ['1', 1],
    ['2', 2],
    ['loopback', 'loopback']
  ])('parses %j as %j', (value, expected) => {
    expect(parseTrustProxy(value)).toBe(expected);
  });
});

describe('readPositiveInt', () => {
  it.each([
    ['50', 50],
    [undefined, 10],
    ['', 10],
    ['abc', 10],
    ['0', 10],
    ['-5', 10]
  ])('reads %j with fallback 10 as %j', (value, expected) => {
    expect(readPositiveInt(value, 10)).toBe(expected);
  });
});
