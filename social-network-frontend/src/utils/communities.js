// Finds groups of friends (communities) with the Louvain method:
//  1. local moving: everyone starts alone, then each node moves to the
//     neighboring group that most increases the modularity (more friendships
//     inside groups than expected by chance), until nothing moves;
//  2. aggregation: each group becomes a single node and step 1 repeats,
//     merging small groups into bigger circles while that still helps.
// Deterministic: nodes and groups are always visited in id order.
//
// Returns Map<id, groupIndex>, where group 0 is the largest group.
const MAX_ROUNDS = 50;
const EPSILON = 1e-12;

const byKey = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

// adjacency: Map<node, Map<neighbor, weight>>; strength: total degree of the
// original people inside each node. Returns the group of each node.
function localMoving(ids, adjacency, strength, twiceLinks) {
  const group = new Map(ids.map((id) => [id, id]));
  const groupStrength = new Map(ids.map((id) => [id, strength.get(id)]));
  let improved = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    let moved = false;

    for (const id of ids) {
      const k = strength.get(id);
      if (k === 0) {
        continue;
      }

      const own = group.get(id);
      const linksTo = new Map();
      for (const [neighbor, weight] of adjacency.get(id)) {
        const g = group.get(neighbor);
        linksTo.set(g, (linksTo.get(g) ?? 0) + weight);
      }

      // Take the node out, then put it where the modularity gain is best.
      groupStrength.set(own, groupStrength.get(own) - k);
      const gain = (g) =>
        (linksTo.get(g) ?? 0) - (groupStrength.get(g) * k) / twiceLinks;

      let best = own;
      let bestGain = gain(own);
      for (const [g] of [...linksTo].sort(byKey)) {
        if (gain(g) > bestGain + EPSILON) {
          best = g;
          bestGain = gain(g);
        }
      }

      groupStrength.set(best, groupStrength.get(best) + k);
      if (best !== own) {
        group.set(id, best);
        moved = true;
        improved = true;
      }
    }

    if (!moved) {
      break;
    }
  }

  return { group, improved };
}

export function detectCommunities(nodes, links) {
  let ids = nodes.map((node) => node.id).sort();
  let adjacency = new Map(ids.map((id) => [id, new Map()]));

  for (const { source, target } of links) {
    if (source !== target && adjacency.has(source) && adjacency.has(target)) {
      adjacency.get(source).set(target, 1);
      adjacency.get(target).set(source, 1);
    }
  }

  let strength = new Map(ids.map((id) => [id, adjacency.get(id).size]));
  // Twice the number of friendships (each one counts for both people).
  const twiceLinks = [...strength.values()].reduce((sum, k) => sum + k, 0);
  // Original person -> node of the current level.
  const membership = new Map(ids.map((id) => [id, id]));

  while (twiceLinks > 0) {
    const { group, improved } = localMoving(ids, adjacency, strength, twiceLinks);
    if (!improved) {
      break;
    }

    for (const [person, node] of membership) {
      membership.set(person, group.get(node));
    }

    // Aggregation: one node per group; friendships between groups add up.
    const nextIds = [...new Set(group.values())].sort();
    const nextAdjacency = new Map(nextIds.map((id) => [id, new Map()]));
    const nextStrength = new Map(nextIds.map((id) => [id, 0]));

    for (const id of ids) {
      const g = group.get(id);
      nextStrength.set(g, nextStrength.get(g) + strength.get(id));
      for (const [neighbor, weight] of adjacency.get(id)) {
        const h = group.get(neighbor);
        if (g !== h) {
          nextAdjacency.get(g).set(h, (nextAdjacency.get(g).get(h) ?? 0) + weight);
        }
      }
    }

    ids = nextIds;
    adjacency = nextAdjacency;
    strength = nextStrength;
  }

  const sizes = new Map();
  for (const g of membership.values()) {
    sizes.set(g, (sizes.get(g) ?? 0) + 1);
  }
  const ranked = [...sizes.entries()]
    .sort((a, b) => b[1] - a[1] || byKey(a, b))
    .map(([g]) => g);
  const indexOf = new Map(ranked.map((g, index) => [g, index]));

  return new Map(
    nodes.map((node) => [node.id, indexOf.get(membership.get(node.id))])
  );
}
