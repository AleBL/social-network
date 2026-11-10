const { parseUserListQuery } = require('../../src/validation/userValidation');

describe('parseUserListQuery', () => {
  it('uses the defaults when nothing is given', () => {
    expect(parseUserListQuery({})).toEqual({
      search: '',
      limit: 20,
      offset: 0
    });
    expect(parseUserListQuery()).toEqual({ search: '', limit: 20, offset: 0 });
  });

  it('trims the search and parses the numbers', () => {
    expect(
      parseUserListQuery({ search: ' ana ', limit: '100', offset: '40' })
    ).toEqual({ search: 'ana', limit: 100, offset: 40 });
  });

  it.each([
    [{ limit: '0' }, 'limit must be an integer between 1 and 100'],
    [{ limit: '101' }, 'limit must be an integer between 1 and 100'],
    [{ limit: 'ten' }, 'limit must be an integer between 1 and 100'],
    [{ offset: '-1' }, 'offset must be an integer between 0 and 100000'],
    [{ offset: '1.5' }, 'offset must be an integer between 0 and 100000'],
    [{ search: ['a', 'b'] }, 'search must be a single value'],
    [{ search: 'x'.repeat(101) }, 'search must be at most 100 characters']
  ])('rejects %j with "%s"', (query, message) => {
    expect(() => parseUserListQuery(query)).toThrow(
      expect.objectContaining({ message, statusCode: 400 })
    );
  });
});
