// Integration tests delete every node in the database, so they must never
// run against a real deployment (for example the AuraDB instance used in production).
const SAFE_URI = /^(bolt|neo4j):\/\/(localhost|127\.0\.0\.1|neo4j)(:\d+)?\/?$/;

function assertSafeDatabase() {
  const uri = process.env.NEO4J_URI || '';

  if (!SAFE_URI.test(uri)) {
    throw new Error(
      `Refusing to run integration tests against "${uri}": they delete all data. ` +
        'Point NEO4J_URI to a local Neo4j, e.g. bolt://localhost:7687.'
    );
  }
}

async function clearDatabase(driver) {
  await driver.executeQuery('MATCH (n) DETACH DELETE n');
}

module.exports = { assertSafeDatabase, clearDatabase };
