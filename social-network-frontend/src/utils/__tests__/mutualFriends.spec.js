import { describe, expect, it } from 'vitest';
import { describeMutualFriends } from '../mutualFriends';

const people = (...names) => names.map((name, i) => ({ id: String(i), name }));

describe('describeMutualFriends', () => {
  it.each([
    [[], ''],
    [people('Bob'), '1 mutual friend: Bob'],
    [people('Bob', 'Carol'), '2 mutual friends: Bob and Carol'],
    [people('Bob', 'Carol', 'Dave'), '3 mutual friends: Bob, Carol and 1 more'],
    [
      people('Bob', 'Carol', 'Dave', 'Erin'),
      '4 mutual friends: Bob, Carol and 2 more'
    ]
  ])('describes %j as "%s"', (mutualFriends, text) => {
    expect(describeMutualFriends(mutualFriends)).toBe(text);
  });

  it('accepts a missing list', () => {
    expect(describeMutualFriends()).toBe('');
  });
});
