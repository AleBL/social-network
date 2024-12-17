const { User } = require('../models/user');
const { v4: uuidv4 } = require('uuid');

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

