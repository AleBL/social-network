// Demo data for the portfolio: 40 people in four circles of friends (work,
// university, neighborhood, sports club) joined by a few "bridge" people,
// plus some loners. Degrees vary on purpose (one hub with 15 friends, people
// with 7, 4, 2, 1 and 0) so the graph and the suggestions look realistic.
//
// Every seed user has an email ending in SEED_EMAIL_DOMAIN: that is how the
// seed script finds them again (idempotent runs) and how --reset removes only them.
const SEED_EMAIL_DOMAIN = '@seed.example.com';

const PEOPLE = [
  // Work
  ['sofia', 'Sofia Martins'],
  ['lucas', 'Lucas Almeida'],
  ['mariana', 'Mariana Costa'],
  ['rafael', 'Rafael Souza'],
  ['camila', 'Camila Rocha'],
  ['thiago', 'Thiago Lima'],
  ['beatriz', 'Beatriz Nunes'],
  ['gustavo', 'Gustavo Pereira'],
  ['larissa', 'Larissa Gomes'],
  ['felipe', 'Felipe Ribeiro'],
  // University
  ['isabela', 'Isabela Carvalho'],
  ['matheus', 'Matheus Oliveira'],
  ['julia', 'Júlia Fernandes'],
  ['pedro', 'Pedro Henrique Dias'],
  ['fernanda', 'Fernanda Teixeira'],
  ['bruno', 'Bruno Cardoso'],
  ['amanda', 'Amanda Barbosa'],
  ['diego', 'Diego Moreira'],
  ['leticia', 'Letícia Araújo'],
  ['vinicius', 'Vinícius Lopes'],
  // Neighborhood
  ['helena', 'Helena Duarte'],
  ['ricardo', 'Ricardo Mendes'],
  ['patricia', 'Patrícia Freitas'],
  ['eduardo', 'Eduardo Pinto'],
  ['carolina', 'Carolina Batista'],
  ['rodrigo', 'Rodrigo Castro'],
  ['gabriela', 'Gabriela Monteiro'],
  ['marcelo', 'Marcelo Vieira'],
  ['aline', 'Aline Correia'],
  // Sports club
  ['daniel', 'Daniel Ramos'],
  ['renata', 'Renata Farias'],
  ['leonardo', 'Leonardo Azevedo'],
  ['bianca', 'Bianca Cunha'],
  ['andre', 'André Machado'],
  ['vanessa', 'Vanessa Rezende'],
  ['caio', 'Caio Nogueira'],
  // No friends yet
  ['olivia', 'Olívia Santana'],
  ['henrique', 'Henrique Prado'],
  ['natalia', 'Natália Campos'],
  ['samuel', 'Samuel Brito']
];

// Each pair is one (mutual) friendship.
const FRIENDSHIPS = [
  // Sofia is the hub: friends in every circle.
  ['sofia', 'lucas'],
  ['sofia', 'mariana'],
  ['sofia', 'rafael'],
  ['sofia', 'camila'],
  ['sofia', 'thiago'],
  ['sofia', 'beatriz'],
  ['sofia', 'gustavo'],
  ['sofia', 'isabela'],
  ['sofia', 'matheus'],
  ['sofia', 'julia'],
  ['sofia', 'helena'],
  ['sofia', 'ricardo'],
  ['sofia', 'daniel'],
  ['sofia', 'renata'],
  ['sofia', 'leonardo'],
  // Mariana connects work, university and neighborhood.
  ['mariana', 'lucas'],
  ['mariana', 'camila'],
  ['mariana', 'rafael'],
  ['mariana', 'julia'],
  ['mariana', 'pedro'],
  ['mariana', 'patricia'],
  // Work
  ['lucas', 'rafael'],
  ['lucas', 'felipe'],
  ['camila', 'beatriz'],
  ['rafael', 'thiago'],
  ['thiago', 'gustavo'],
  ['beatriz', 'larissa'],
  ['gustavo', 'larissa'],
  ['felipe', 'larissa'],
  // University
  ['isabela', 'matheus'],
  ['isabela', 'julia'],
  ['matheus', 'pedro'],
  ['julia', 'fernanda'],
  ['pedro', 'bruno'],
  ['pedro', 'fernanda'],
  ['fernanda', 'amanda'],
  ['bruno', 'diego'],
  ['amanda', 'leticia'],
  ['diego', 'vinicius'],
  // Neighborhood
  ['helena', 'ricardo'],
  ['helena', 'patricia'],
  ['ricardo', 'eduardo'],
  ['patricia', 'carolina'],
  ['eduardo', 'rodrigo'],
  ['eduardo', 'carolina'],
  ['carolina', 'gabriela'],
  ['rodrigo', 'marcelo'],
  ['gabriela', 'aline'],
  // Sports club
  ['daniel', 'renata'],
  ['daniel', 'leonardo'],
  ['daniel', 'bianca'],
  ['renata', 'bianca'],
  ['leonardo', 'andre'],
  ['bianca', 'vanessa'],
  ['andre', 'caio'],
  // Daniel organizes the club: second hub.
  ['daniel', 'vanessa'],
  ['daniel', 'caio'],
  ['daniel', 'andre'],
  ['daniel', 'thiago'],
  // Bridges between circles
  ['rafael', 'daniel'],
  ['pedro', 'eduardo'],
  ['camila', 'carolina'],
  ['thiago', 'leonardo'],
  ['bruno', 'andre']
];

const emailOf = (key) => `${key}${SEED_EMAIL_DOMAIN}`;

// Returns plain data for the Cypher queries. "daysAgo" spreads the friendship
// dates over the last ~2.5 years, deterministically (same result on every run).
function buildSeed() {
  const users = PEOPLE.map(([key, name]) => ({ email: emailOf(key), name }));
  const friendships = FRIENDSHIPS.map(([a, b], index) => ({
    a: emailOf(a),
    b: emailOf(b),
    daysAgo: ((index * 37) % 900) + 1
  }));

  return { users, friendships };
}

module.exports = { FRIENDSHIPS, PEOPLE, SEED_EMAIL_DOMAIN, buildSeed };
