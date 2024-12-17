const { User } = require('../models/user');

async function getAllUsers() {
  const result = await User.find({});
  return result;
}
