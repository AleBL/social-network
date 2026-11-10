// "2 mutual friends: Bob and Carol", "4 mutual friends: Bob, Carol and 2 more".
// Shows at most two names so the line stays short.
export function describeMutualFriends(mutualFriends = []) {
  const count = mutualFriends.length;

  if (count === 0) {
    return '';
  }

  const names = mutualFriends.map((friend) => friend.name);
  const label = `${count} mutual ${count === 1 ? 'friend' : 'friends'}`;

  if (count === 1) {
    return `${label}: ${names[0]}`;
  }
  if (count === 2) {
    return `${label}: ${names[0]} and ${names[1]}`;
  }
  return `${label}: ${names[0]}, ${names[1]} and ${count - 2} more`;
}
