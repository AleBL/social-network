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

// Pairs of users who are not friends but share friends, across the whole
// network: "a and b have 3 mutual friends". "a.id < b.id" keeps each pair once.
const SUGGESTIONS_QUERY = `
  MATCH (a:User)-[:FRIEND]->(mutual:User)<-[:FRIEND]-(b:User)
  WHERE a.id < b.id AND NOT (a)-[:FRIEND]->(b)
  WITH a, b, collect(DISTINCT mutual { .id, .name }) AS mutualFriends
  RETURN a { .id, .name } AS a, b { .id, .name } AS b, mutualFriends
  ORDER BY size(mutualFriends) DESC, a.name ASC, b.name ASC
  LIMIT $limit
`;

const byName = (x, y) => x.name.localeCompare(y.name);

// Returns [{ a: { id, name }, b: { id, name }, mutualFriends: [{ id, name }] }],
// best matches first. Each pair is ordered by name so the UI reads naturally.
async function getSuggestedConnections(limit) {
  const { records } = await driver.executeQuery(SUGGESTIONS_QUERY, {
    limit: neo4j.int(limit)
  });

  return records.map((record) => {
    const [a, b] = [record.get('a'), record.get('b')].sort(byName);
    return {
      a,
      b,
      mutualFriends: [...record.get('mutualFriends')].sort(byName)
    };
  });
}

module.exports = {
  GRAPH_NODE_LIMIT,
  getFriendshipGraph,
  getSuggestedConnections
};
