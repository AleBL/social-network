const {
  getAllUsers,
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

exports.getAllUsers = async (req, res, next) => {
  try {
    const data = await getAllUsers();
    handleResponse(res, 200, data, data.length);
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
