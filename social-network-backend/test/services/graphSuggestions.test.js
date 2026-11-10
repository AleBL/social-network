const { driver } = require('../../src/services/ogm');
const { getSuggestedConnections } = require('../../src/services/graphService');

jest.mock('../../src/services/ogm', () => ({
  driver: { executeQuery: jest.fn() }
}));

const record = (values) => ({ get: (key) => values[key] });

describe('getSuggestedConnections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('orders each pair and its mutual friends by name', async () => {
    driver.executeQuery.mockResolvedValue({
      records: [
        record({
          a: { id: '9', name: 'Zoe' },
          b: { id: '2', name: 'Bob' },
          mutualFriends: [
            { id: '5', name: 'Erin' },
            { id: '3', name: 'Carol' }
          ]
        })
      ]
    });

    await expect(getSuggestedConnections(10)).resolves.toEqual([
      {
        a: { id: '2', name: 'Bob' },
        b: { id: '9', name: 'Zoe' },
        mutualFriends: [
          { id: '3', name: 'Carol' },
          { id: '5', name: 'Erin' }
        ]
      }
    ]);
  });

  it('keeps each pair once, skips friends, ranks by mutual friends and limits', async () => {
    driver.executeQuery.mockResolvedValue({ records: [] });

    await getSuggestedConnections(7);

    const [query, params] = driver.executeQuery.mock.calls[0];
    expect(query).toContain('a.id < b.id');
    expect(query).toContain('NOT (a)-[:FRIEND]->(b)');
    expect(query).toContain('ORDER BY size(mutualFriends) DESC');
    expect(params.limit.toNumber()).toBe(7);
  });
});
