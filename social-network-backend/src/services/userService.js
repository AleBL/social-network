const { User } = require('../models/user');

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
