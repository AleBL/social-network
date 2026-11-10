const {
  DEFAULT_ORIGINS,
  parseAllowedOrigins
} = require('../../src/config/cors');

describe('parseAllowedOrigins', () => {
  it('falls back to the local dev origins when unset', () => {
    expect(parseAllowedOrigins(undefined)).toEqual(DEFAULT_ORIGINS);
    expect(parseAllowedOrigins('')).toEqual(DEFAULT_ORIGINS);
  });

  it('splits a comma-separated list and trims spaces', () => {
    expect(
      parseAllowedOrigins('https://front.example.com, http://localhost:8080 ,')
    ).toEqual(['https://front.example.com', 'http://localhost:8080']);
  });
});
