const { User } = require('../models/user');
const { v4: uuidv4 } = require('uuid');
const { driver } = require('../services/ogm');
const { ConflictError } = require('../errors');
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
    throw new Error('User with id ' + userId + ' not found');
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

async function recommendFriends(userId) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH (user:User {id: $userId})-[:FRIEND]->(friend:User)-[:FRIEND]->(indirectFriend:User)
      WHERE NOT (user)-[:FRIEND]->(indirectFriend) AND indirectFriend.id <> user.id
      RETURN DISTINCT indirectFriend
      `,
      { userId }
    );

    const friendsOfFriends = result.records.map(
      (record) => record.get('indirectFriend')?.properties
    );

    await session.close();
    return friendsOfFriends;
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
