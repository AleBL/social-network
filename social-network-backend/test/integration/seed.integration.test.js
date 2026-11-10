const { afterAll, beforeAll, describe, expect, it } = require('@jest/globals');
const neo4j = require('neo4j-driver');
const { assertSafeDatabase, clearDatabase } = require('./helpers');

assertSafeDatabase();

const { resetSeed, seedDatabase } = require('../../scripts/seed');
const { FRIENDSHIPS, PEOPLE } = require('../../scripts/seedData');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const count = async (query) => {
  const { records } = await driver.executeQuery(query);
  return records[0].get('total').toNumber();
};

describe('seed script with a real Neo4j', () => {
  beforeAll(async () => {
    await clearDatabase(driver);
    // A user created through the app: the seed must never touch it.
    await driver.executeQuery(
      "CREATE (:User {id: 'real-1', name: 'Real User', email: 'real@teste.com'})"
    );
  });

  afterAll(async () => {
    await clearDatabase(driver);
    await driver.close();
  });

  it('creates every seed user and friendship in both directions', async () => {
    const result = await seedDatabase(driver);

    expect(result).toEqual({
      usersCreated: PEOPLE.length,
      relationshipsCreated: FRIENDSHIPS.length * 2
    });
    expect(
      await count(
        "MATCH (u:User) WHERE u.email ENDS WITH '@seed.example.com' RETURN count(u) AS total"
      )
    ).toBe(40);
    expect(
      await count('MATCH (u:User) WHERE u.id IS NULL RETURN count(u) AS total')
    ).toBe(0);
  });

  it('is idempotent: a second run creates nothing', async () => {
    await expect(seedDatabase(driver)).resolves.toEqual({
      usersCreated: 0,
      relationshipsCreated: 0
    });
  });

  it('stores "since" as a date in the past on every friendship', async () => {
    expect(
      await count(
        'MATCH ()-[r:FRIEND]->() WHERE r.since IS NULL OR r.since > datetime() RETURN count(r) AS total'
      )
    ).toBe(0);
  });

  it('gives Sofia 15 friends and leaves the loners alone', async () => {
    const { records } = await driver.executeQuery(
      `MATCH (u:User) WHERE u.email IN ['sofia@seed.example.com', 'olivia@seed.example.com']
       RETURN u.email AS email, COUNT { (u)-[:FRIEND]->() } AS friends
       ORDER BY email`
    );

    expect(
      records.map((r) => [r.get('email'), r.get('friends').toNumber()])
    ).toEqual([
      ['olivia@seed.example.com', 0],
      ['sofia@seed.example.com', 15]
    ]);
  });

  it('reset removes only the seed users', async () => {
    await expect(resetSeed(driver)).resolves.toEqual({ usersDeleted: 40 });

    expect(await count('MATCH (u:User) RETURN count(u) AS total')).toBe(1);
    expect(
      await count(
        "MATCH (u:User {email: 'real@teste.com'}) RETURN count(u) AS total"
      )
    ).toBe(1);
  });
});
