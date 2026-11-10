const { OGM } = require('@neo4j/graphql-ogm');
const neo4j = require('neo4j-driver');

const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String! @unique
    friends: [User!]! @relationship(type: "FRIEND", direction: OUT, properties: "FriendProperties")
  }

  type FriendProperties @relationshipProperties {
    since: DateTime!
  }
`;

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);
const ogm = new OGM({ typeDefs, driver, config: { debug: true } });

// The @unique directive alone does not create the constraint in Neo4j,
// so it is created explicitly (idempotent thanks to IF NOT EXISTS).
async function ensureConstraints() {
  await driver.executeQuery(
    'CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE'
  );
}

async function initializeOGM() {
  try {
    await ogm.init();
    console.log('OGM initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OGM:', error);
    return;
  }

  try {
    await ensureConstraints();
    console.log('Database constraints ensured');
  } catch (error) {
    console.error('Failed to ensure database constraints:', error);
  }
}

initializeOGM();

module.exports = { ogm, driver };
