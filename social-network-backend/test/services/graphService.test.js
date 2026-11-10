const { driver } = require('../../src/services/ogm');
const {
  GRAPH_NODE_LIMIT,
  getFriendshipGraph
} = require('../../src/services/graphService');

jest.mock('../../src/services/ogm', () => ({
  driver: { executeQuery: jest.fn() }
}));

const record = (values) => ({ get: (key) => values[key] });

describe('getFriendshipGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds nodes and one link per friendship', async () => {
    driver.executeQuery.mockResolvedValue({
      records: [
        record({ id: '1', name: 'Alice', friendIds: ['2', '3'] }),
        record({ id: '2', name: 'Bob', friendIds: [] }),
        record({ id: '3', name: 'Carol', friendIds: [] })
      ]
    });

    const graph = await getFriendshipGraph();

    expect(graph).toEqual({
      nodes: [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Carol' }
      ],
      links: [
        { source: '1', target: '2' },
        { source: '1', target: '3' }
      ]
    });
  });

  it('sends the node limit as a Neo4j integer and dedupes friendships', async () => {
    driver.executeQuery.mockResolvedValue({ records: [] });

    await getFriendshipGraph();

    const [query, params] = driver.executeQuery.mock.calls[0];
    expect(query).toContain('LIMIT $limit');
    // Each friendship is stored in both directions: keep it once.
    expect(query).toContain('u.id < f.id');
    expect(params.limit.toNumber()).toBe(GRAPH_NODE_LIMIT);
  });

  it('returns an empty graph when there are no users', async () => {
    driver.executeQuery.mockResolvedValue({ records: [] });

    await expect(getFriendshipGraph()).resolves.toEqual({
      nodes: [],
      links: []
    });
  });
});
