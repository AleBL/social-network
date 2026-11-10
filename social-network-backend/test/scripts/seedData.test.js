const {
  FRIENDSHIPS,
  PEOPLE,
  SEED_EMAIL_DOMAIN,
  buildSeed
} = require('../../scripts/seedData');

const degrees = () => {
  const degree = Object.fromEntries(PEOPLE.map(([key]) => [key, 0]));
  for (const [a, b] of FRIENDSHIPS) {
    degree[a] += 1;
    degree[b] += 1;
  }
  return degree;
};

describe('seed data', () => {
  it('has 40 people with unique keys and names', () => {
    expect(PEOPLE).toHaveLength(40);
    expect(new Set(PEOPLE.map(([key]) => key)).size).toBe(40);
    expect(new Set(PEOPLE.map(([, name]) => name)).size).toBe(40);
  });

  it('only links known people, never to themselves, and each pair once', () => {
    const keys = new Set(PEOPLE.map(([key]) => key));
    const pairs = new Set();

    for (const [a, b] of FRIENDSHIPS) {
      expect(keys.has(a)).toBe(true);
      expect(keys.has(b)).toBe(true);
      expect(a).not.toBe(b);
      pairs.add([a, b].sort().join('-'));
    }

    expect(pairs.size).toBe(FRIENDSHIPS.length);
  });

  it('varies the number of friends like a real network', () => {
    const values = Object.values(degrees());

    expect(Math.max(...values)).toBe(15);
    expect(values.filter((value) => value === 0)).toHaveLength(4);
    // Many different friend counts instead of everyone having the same.
    expect(new Set(values).size).toBeGreaterThanOrEqual(8);
  });

  it('builds seed emails in the reserved domain and spreads the dates', () => {
    const { users, friendships } = buildSeed();

    expect(users.every((user) => user.email.endsWith(SEED_EMAIL_DOMAIN))).toBe(
      true
    );
    expect(users[0]).toEqual({
      email: 'sofia@seed.example.com',
      name: 'Sofia Martins'
    });
    for (const { daysAgo } of friendships) {
      expect(daysAgo).toBeGreaterThanOrEqual(1);
      expect(daysAgo).toBeLessThanOrEqual(900);
    }
  });
});
