import { describe, expect, it } from 'vitest';
import { detectCommunities } from '../communities';

const nodesOf = (...ids) => ids.map((id) => ({ id }));
const linksOf = (...pairs) =>
  pairs.map(([source, target]) => ({ source, target }));

const groupsOf = (result) => {
  const groups = {};
  for (const [id, group] of result) {
    (groups[group] ??= []).push(id);
  }
  return Object.values(groups).map((ids) => ids.sort());
};

describe('detectCommunities', () => {
  it('separates two circles of friends joined by one bridge', () => {
    // Two cliques of 4 (a* and b*) with a single friendship between them.
    const nodes = nodesOf('a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4');
    const clique = (prefix) =>
      ['1', '2', '3', '4'].flatMap((x, i, all) =>
        all.slice(i + 1).map((y) => [`${prefix}${x}`, `${prefix}${y}`])
      );
    const links = linksOf(...clique('a'), ...clique('b'), ['a4', 'b1']);

    const result = detectCommunities(nodes, links);

    expect(groupsOf(result)).toEqual([
      ['a1', 'a2', 'a3', 'a4'],
      ['b1', 'b2', 'b3', 'b4']
    ]);
  });

  it('numbers groups by size, largest first', () => {
    const nodes = nodesOf('x', 'y', 'p', 'q', 'r');
    const links = linksOf(['x', 'y'], ['p', 'q'], ['q', 'r'], ['p', 'r']);

    const result = detectCommunities(nodes, links);

    expect(result.get('p')).toBe(0);
    expect(result.get('q')).toBe(0);
    expect(result.get('x')).toBe(1);
  });

  it('puts each person without friends in a group of their own', () => {
    const result = detectCommunities(nodesOf('a', 'b', 'c'), []);

    expect(new Set(result.values()).size).toBe(3);
  });

  it('always gives the same answer for the same network', () => {
    const nodes = nodesOf('1', '2', '3', '4', '5', '6');
    const links = linksOf(['1', '2'], ['2', '3'], ['3', '1'], ['3', '4'], ['4', '5'], ['5', '6'], ['6', '4']);

    expect([...detectCommunities(nodes, links)]).toEqual([
      ...detectCommunities(nodes, links)
    ]);
  });
});
