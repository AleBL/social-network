const { searchUsers } = require('../services/userSearch');
const { parseUserListQuery } = require('../validation/userValidation');
const {
  getUserById,
  createUser,
  createFriendship,
  listFriends,
  findCommonFriends,
  recommendFriends
} = require('../services/userService');

// Errors are forwarded with next(err) to the central errorHandler middleware.

const handleResponse = (res, statusCode, data, count = null) => {
  const response = {
    status: 'success',
    data
  };

  if (count !== null) {
    response.count = count;
  }

  res.status(statusCode).json(response);
};

// GET /api/users?search=&limit=&offset=: one page plus the total of matches.
exports.listUsers = async (req, res, next) => {
  try {
    const { search, limit, offset } = parseUserListQuery(req.query);
    const { users, total } = await searchUsers({ search, limit, offset });

    res.status(200).json({
      status: 'success',
      data: users,
      count: users.length,
      total,
      limit,
      offset
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = await getUserById(userId);
    handleResponse(res, 200, data);
  } catch (err) {
    next(err);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = req.body;
    await createUser(user);
    handleResponse(res, 201, 'User created');
  } catch (err) {
    next(err);
  }
};

exports.createFriendship = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.body || {};
    await createFriendship(userId1, userId2);
    handleResponse(res, 201, 'Friendship created');
  } catch (err) {
    next(err);
  }
};

exports.listFriends = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = await listFriends(userId);
    handleResponse(res, 200, data, data.length);
  } catch (err) {
    next(err);
  }
};

exports.findCommonFriends = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;
    const data = await findCommonFriends(userId1, userId2);
    handleResponse(res, 200, data, data.length);
  } catch (err) {
    next(err);
  }
};

exports.recommendFriends = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = await recommendFriends(userId);
    handleResponse(res, 200, data, data.length);
  } catch (err) {
    next(err);
  }
};
