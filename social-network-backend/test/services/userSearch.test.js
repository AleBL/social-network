const { driver } = require('../../src/services/ogm');
const {
  buildNamePattern,
  searchUsers
} = require('../../src/services/userSearch');

jest.mock('../../src/services/ogm', () => ({
  driver: { executeQuery: jest.fn() }
}));

const toJavaRegex = (pattern) =>
  // Same semantics as Neo4j's Java regex for what we generate: (?iu) flags,
  // character classes and \x{...} code points.
  new RegExp(
    pattern.replace('(?iu)', '').replace(/\\x\{([0-9a-f]+)\}/g, '\\u{$1}'),
    'iu'
  );

describe('buildNamePattern', () => {
  it.each([
    ['julia', 'Júlia Fernandes', true],
    ['JÚLIA', 'Julia Roberts', true],
    ['joao', 'João Silva', true],
    ['conceicao', 'Maria da Conceição', true],
    ['ana c', 'Ana Carolina', true],
    ['pedro', 'Sofia Martins', false]
  ])('"%s" matches "%s": %s', (search, name, matches) => {
    expect(toJavaRegex(buildNamePattern(search)).test(name)).toBe(matches);
  });

  it('turns regex syntax in the input into plain characters', () => {
    const pattern = buildNamePattern('a.*(b)');

    expect(pattern).toBe('(?iu).*[aáàâãä]\\x{2e}\\x{2a}\\x{28}b\\x{29}.*');
    expect(toJavaRegex(pattern).test('a.*(b)')).toBe(true);
    expect(toJavaRegex(pattern).test('aXXb')).toBe(false);
  });
});

describe('searchUsers', () => {
  const result = (records) => ({ records });
  const totalOf = (total) =>
    result([{ get: () => ({ toNumber: () => total }) }]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the page and the total, without a filter when search is empty', async () => {
    driver.executeQuery
      .mockResolvedValueOnce(totalOf(40))
      .mockResolvedValueOnce(
        result([{ get: () => ({ id: '1', name: 'Alice', email: 'a@b.co' }) }])
      );

    await expect(
      searchUsers({ search: '', limit: 20, offset: 0 })
    ).resolves.toEqual({
      users: [{ id: '1', name: 'Alice', email: 'a@b.co' }],
      total: 40
    });

    const [, countParams] = driver.executeQuery.mock.calls[0];
    expect(countParams).toEqual({ pattern: null, term: null });
  });

  it('sends the pattern, the email term and the page as Neo4j integers', async () => {
    driver.executeQuery
      .mockResolvedValueOnce(totalOf(1))
      .mockResolvedValueOnce(result([]));

    await searchUsers({ search: 'Júlia', limit: 5, offset: 10 });

    const [pageQuery, pageParams] = driver.executeQuery.mock.calls[1];
    expect(pageQuery).toContain('ORDER BY u.name ASC');
    expect(pageQuery).toContain('SKIP $offset LIMIT $limit');
    expect(pageParams.pattern).toBe(buildNamePattern('Júlia'));
    expect(pageParams.term).toBe('júlia');
    expect(pageParams.limit.toNumber()).toBe(5);
    expect(pageParams.offset.toNumber()).toBe(10);
  });
});
