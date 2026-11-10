const neo4j = require('neo4j-driver');
const { User } = require('../models/user');
const { v4: uuidv4 } = require('uuid');
const { driver } = require('../services/ogm');
const { ConflictError, NotFoundError } = require('../errors');
const {
  validateNewUser,
  validateFriendshipIds
} = require('../validation/userValidation');

async function createFriendshipDatabase(userInId, userOutId) {
  await User.update({
    where: { id: userInId },
    connect: {
      friends: [
        {
          where: { node: { id: userOutId } },
          edge: { since: new Date().toISOString() }
        }
      ]
    }
  });
}

async function getAllUsers() {
  const result = await User.find({});
  return result;
}

async function getUserById(userId) {
  const [user] = await User.find({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('User with id ' + userId + ' not found');
  }

  return user;
}

async function createUser(userData) {
  const { name, email } = validateNewUser(userData);

  const [existingUser] = await User.find({
    where: { email }
  });

  if (existingUser) {
    throw new ConflictError('User with email ' + email + ' already exists');
  }

  const user = await User.create({
    input: [
      {
        id: uuidv4(),
        name,
        email
      }
    ]
  });

  return user;
}

async function areFriends(userId1, userId2) {
  const [user] = await User.find({
    where: { id: userId1, friends_SOME: { id: userId2 } }
  });

  return Boolean(user);
}

async function createFriendship(userId1, userId2) {
  validateFriendshipIds(userId1, userId2);

  await getUserById(userId1);
  await getUserById(userId2);

  // The OGM "connect" uses MERGE: connecting again would silently reset "since".
  if (await areFriends(userId1, userId2)) {
    throw new ConflictError(
      'Users ' + userId1 + ' and ' + userId2 + ' are already friends'
    );
  }

  await createFriendshipDatabase(userId1, userId2);
  await createFriendshipDatabase(userId2, userId1);
}

async function listFriends(userId) {
  await getUserById(userId);

  const friends = await User.find({
    where: { id: userId },
    selectionSet: `
      {
        friends {
          id
          name
          email
        }
      }
    `
  });

  return friends[0]?.friends;
}

async function findCommonFriends(userId1, userId2) {
  const user1Friends = await listFriends(userId1);
  const user2Friends = await listFriends(userId2);

  const commonFriends = user1Friends.filter((friend1) =>
    user2Friends.some((friend2) => friend2.id === friend1.id)
  );

  return commonFriends;
}

const RECOMMENDATION_LIMIT = 20;

// Friends of friends who are not friends yet, best matches first: ordered by
// how many friends they share with the user (then by name). Each suggestion
// lists those mutual friends so the UI can explain why it was suggested.
const RECOMMENDATIONS_QUERY = `
  MATCH (user:User {id: $userId})-[:FRIEND]->(friend:User)-[:FRIEND]->(candidate:User)
  WHERE candidate.id <> user.id AND NOT (user)-[:FRIEND]->(candidate)
  WITH candidate, collect(DISTINCT friend { .id, .name }) AS mutualFriends
  RETURN candidate { .id, .name, .email } AS candidate, mutualFriends
  ORDER BY size(mutualFriends) DESC, candidate.name ASC
  LIMIT $limit
`;

const byName = (a, b) => a.name.localeCompare(b.name);

async function recommendFriends(userId) {
  // Without this check an unknown user would get an empty list instead of a 404.
  await getUserById(userId);

  const session = driver.session();

  try {
    const result = await session.run(RECOMMENDATIONS_QUERY, {
      userId,
      limit: neo4j.int(RECOMMENDATION_LIMIT)
    });

    return result.records.map((record) => ({
      ...record.get('candidate'),
      mutualFriends: [...record.get('mutualFriends')].sort(byName)
    }));
  } finally {
    await session.close();
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  createFriendship,
  listFriends,
  findCommonFriends,
  recommendFriends
};
