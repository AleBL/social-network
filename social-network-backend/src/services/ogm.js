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

async function initializeOGM() {
  try {
    await ogm.init();
    console.log('OGM initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OGM:', error);
  }
}

initializeOGM();

module.exports = { ogm, driver };
