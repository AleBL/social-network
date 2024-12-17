const { User } = require('../models/user');
const { v4: uuidv4 } = require('uuid');

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
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User with id ' + userId + ' not found');
  }

  return user;
}

async function createUser(userData) {
  const user = await User.create({
    input: [
      {
        id: uuidv4(),
        name: userData.name,
        email: userData.email,
      }
    ]
  });

  return user;
}

async function createFriendship(userId1, userId2) {
  await getUserById(userId1);
  await getUserById(userId2);

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

  return friends[0]?.friends || [];
}

