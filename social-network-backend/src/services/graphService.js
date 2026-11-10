const neo4j = require('neo4j-driver');
const { driver } = require('./ogm');

// Keeps the response and the browser rendering small on large databases.
const GRAPH_NODE_LIMIT = 500;

// Friendships are stored in both directions (A->B and B->A); "u.id < f.id"
// keeps each one once. Links only connect users inside the limited set.
const GRAPH_QUERY = `
  MATCH (u:User)
  WITH u ORDER BY u.name LIMIT $limit
  WITH collect(u) AS users
  UNWIND users AS u
  OPTIONAL MATCH (u)-[:FRIEND]->(f:User)
  WHERE f IN users AND u.id < f.id
  RETURN u.id AS id, u.name AS name, collect(f.id) AS friendIds
`;

// Returns { nodes: [{ id, name }], links: [{ source, target }] }.
// Emails are left out on purpose: the graph does not need them.
async function getFriendshipGraph(limit = GRAPH_NODE_LIMIT) {
  const { records } = await driver.executeQuery(GRAPH_QUERY, {
    limit: neo4j.int(limit)
  });

  const nodes = [];
  const links = [];

  for (const record of records) {
    const id = record.get('id');
    nodes.push({ id, name: record.get('name') });

    for (const friendId of record.get('friendIds')) {
      links.push({ source: id, target: friendId });
    }
  }

  return { nodes, links };
}

module.exports = { GRAPH_NODE_LIMIT, getFriendshipGraph };
