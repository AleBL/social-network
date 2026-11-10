import { describe, expect, it } from 'vitest';
import { computeNetworkStats } from '../networkStats';

const graph = {
  nodes: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Carol' },
    { id: '4', name: 'Dave' },
    { id: '5', name: 'Erin' }
  ],
  links: [
    { source: '1', target: '2' },
    { source: '1', target: '3' },
    { source: '2', target: '3' },
    { source: '1', target: '4' }
  ]
};

describe('computeNetworkStats', () => {
  it('counts users, friendships, the average and people without friends', () => {
    const stats = computeNetworkStats(graph);

    expect(stats.users).toBe(5);
    expect(stats.friendships).toBe(4);
    // 4 friendships give 8 friends spread over 5 users.
    expect(stats.averageFriends).toBe(1.6);
    expect(stats.withoutFriends).toBe(1);
  });

  it('ranks the most connected people, ties by name, without loners', () => {
    const { mostConnected } = computeNetworkStats(graph, 3);

    expect(
      mostConnected.map((person) => [person.name, person.degree])
    ).toEqual([
      ['Alice', 3],
      ['Bob', 2],
      ['Carol', 2]
    ]);
  });

  it('handles an empty network', () => {
    expect(computeNetworkStats({ nodes: [], links: [] })).toEqual({
      users: 0,
      friendships: 0,
      averageFriends: 0,
      withoutFriends: 0,
      mostConnected: []
    });
  });
});
