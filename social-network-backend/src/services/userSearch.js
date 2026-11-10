const neo4j = require('neo4j-driver');
const { driver } = require('./ogm');

// Accent-insensitive matching for Portuguese-style names: "julia" finds
// "Júlia" and "joao" finds "João". Each plain letter becomes a class.
const ACCENT_CLASSES = {
  a: 'aáàâãä',
  e: 'eéèêë',
  i: 'iíìîï',
  o: 'oóòôõö',
  u: 'uúùûü',
  c: 'cç',
  n: 'nñ'
};

const removeAccents = (text) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Anything that is not a plain letter, digit or space is written as a code
// point escape (\x{...}), so user input can never act as regex syntax.
const literal = (char) =>
  /[a-z0-9 ]/.test(char) ? char : `\\x{${char.codePointAt(0).toString(16)}}`;

// Builds a Cypher (Java) regex: case-insensitive, accent-insensitive, "contains".
function buildNamePattern(search) {
  const body = [...removeAccents(search).toLowerCase()]
    .map((char) =>
      ACCENT_CLASSES[char] ? `[${ACCENT_CLASSES[char]}]` : literal(char)
    )
    .join('');

  return `(?iu).*${body}.*`;
}

// No search: every user. Otherwise the name pattern or the email substring.
const FILTER = `
  MATCH (u:User)
  WHERE $pattern IS NULL OR u.name =~ $pattern OR toLower(u.email) CONTAINS $term
`;

const COUNT_QUERY = `${FILTER} RETURN count(u) AS total`;

const PAGE_QUERY = `${FILTER}
  RETURN u { .id, .name, .email } AS user
  ORDER BY u.name ASC, u.id ASC
  SKIP $offset LIMIT $limit
`;

// Returns { users, total }: one page sorted by name, plus the number of matches.
async function searchUsers({ search = '', limit, offset }) {
  const params = search
    ? { pattern: buildNamePattern(search), term: search.toLowerCase() }
    : { pattern: null, term: null };

  const [countResult, pageResult] = await Promise.all([
    driver.executeQuery(COUNT_QUERY, params),
    driver.executeQuery(PAGE_QUERY, {
      ...params,
      offset: neo4j.int(offset),
      limit: neo4j.int(limit)
    })
  ]);

  return {
    users: pageResult.records.map((record) => record.get('user')),
    total: countResult.records[0].get('total').toNumber()
  };
}

module.exports = { buildNamePattern, searchUsers };
