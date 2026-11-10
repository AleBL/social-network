// Summary numbers for the home page, computed from GET /api/graph
// ({ nodes: [{ id, name }], links: [{ source, target }] }).
export function computeNetworkStats({ nodes, links }, top = 5) {
  const degree = new Map(nodes.map((node) => [node.id, 0]));

  for (const { source, target } of links) {
    degree.set(source, (degree.get(source) ?? 0) + 1);
    degree.set(target, (degree.get(target) ?? 0) + 1);
  }

  const users = nodes.length;
  // Each friendship gives one friend to each of the two users.
  const averageFriends = users
    ? Math.round(((2 * links.length) / users) * 10) / 10
    : 0;

  const mostConnected = nodes
    .map((node) => ({ ...node, degree: degree.get(node.id) }))
    .filter((node) => node.degree > 0)
    .sort((a, b) => b.degree - a.degree || a.name.localeCompare(b.name))
    .slice(0, top);

  return {
    users,
    friendships: links.length,
    averageFriends,
    withoutFriends: nodes.filter((node) => degree.get(node.id) === 0).length,
    mostConnected
  };
}
