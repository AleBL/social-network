// Seeds demo users and friendships (see seedData.js), or removes them.
//
//   yarn seed            local Neo4j (localhost / docker compose)
//   yarn seed --yes      any other target, e.g. AuraDB (asks for explicit consent)
//   yarn seed:reset      deletes ONLY the seed users (emails @seed.example.com)
//
// Idempotent: running it again creates nothing new. It never touches users
// created through the app. Credentials come from the environment or ../.env.
const neo4j = require('neo4j-driver');
const { SEED_EMAIL_DOMAIN, buildSeed } = require('./seedData');

const LOCAL_URI = /^(bolt|neo4j):\/\/(localhost|127\.0\.0\.1|neo4j)(:\d+)?\/?$/;

const CREATE_CONSTRAINT = `
  CREATE CONSTRAINT user_email_unique IF NOT EXISTS
  FOR (u:User) REQUIRE u.email IS UNIQUE
`;

// MERGE by email: existing seed users are kept (same id), new ones get an id.
const UPSERT_USERS = `
  UNWIND $users AS user
  MERGE (u:User {email: user.email})
  ON CREATE SET u.id = randomUUID(), u.name = user.name
  ON MATCH SET u.name = user.name
`;

// Same shape as the app: one FRIEND relationship in each direction, with "since".
const UPSERT_FRIENDSHIPS = `
  UNWIND $friendships AS f
  MATCH (a:User {email: f.a}), (b:User {email: f.b})
  MERGE (a)-[ab:FRIEND]->(b)
  ON CREATE SET ab.since = datetime() - duration({days: f.daysAgo})
  MERGE (b)-[ba:FRIEND]->(a)
  ON CREATE SET ba.since = ab.since
`;

const DELETE_SEED_USERS = `
  MATCH (u:User) WHERE u.email ENDS WITH $domain
  DETACH DELETE u
`;

async function seedDatabase(driver) {
  const { users, friendships } = buildSeed();

  await driver.executeQuery(CREATE_CONSTRAINT);
  const usersResult = await driver.executeQuery(UPSERT_USERS, { users });
  const friendshipsResult = await driver.executeQuery(UPSERT_FRIENDSHIPS, {
    friendships
  });

  return {
    usersCreated: usersResult.summary.counters.updates().nodesCreated,
    relationshipsCreated:
      friendshipsResult.summary.counters.updates().relationshipsCreated
  };
}

async function resetSeed(driver) {
  const { summary } = await driver.executeQuery(DELETE_SEED_USERS, {
    domain: SEED_EMAIL_DOMAIN
  });

  return { usersDeleted: summary.counters.updates().nodesDeleted };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const {
    NEO4J_URI: uri,
    NEO4J_USER: user,
    NEO4J_PASSWORD: password
  } = process.env;

  if (!uri || !user || !password) {
    fail('Set NEO4J_URI, NEO4J_USER and NEO4J_PASSWORD (environment or .env).');
  }
  if (!LOCAL_URI.test(uri) && !args.has('--yes')) {
    fail(
      `Target is ${uri}, not a local database.\n` +
        'Re-run with --yes to confirm (e.g. "yarn seed --yes").'
    );
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  try {
    await driver.verifyConnectivity();

    if (args.has('--reset')) {
      const { usersDeleted } = await resetSeed(driver);
      console.log(`Removed ${usersDeleted} seed users from ${uri}.`);
    } else {
      const { usersCreated, relationshipsCreated } = await seedDatabase(driver);
      const { users, friendships } = buildSeed();
      console.log(
        `Seeded ${uri}: ${users.length} users and ${friendships.length} friendships ` +
          `(${usersCreated} users and ${relationshipsCreated / 2} friendships were new).`
      );
    }
  } finally {
    await driver.close();
  }
}

if (require.main === module) {
  main().catch((error) => fail(error.message));
}

module.exports = { resetSeed, seedDatabase };
