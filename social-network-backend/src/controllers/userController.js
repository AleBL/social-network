const { 
    getAllUsers, 
    getUserById, 
    createUser, 
    createFriendship, 
    listFriends, 
    findCommonFriends, 
    recommendFriends 
  } = require('../services/userService');
  
  const handleResponse = (res, statusCode, data, count = null) => {
    const response = {
      status: 'success',
      data
    };

    if (count) {
      response.count = count;
    }

    res.status(statusCode).json(response);
  };
  
  const handleError = (res, statusCode, error) => {
    res.status(statusCode).json({
      status: 'error',
      error: error?.message || 'An unexpected error occurred',
    });
  };
  
  exports.getAllUsers = async (req, res) => {
    try {
      const data = await getAllUsers();
      handleResponse(res, 200, data, data.length);
    } catch (err) {
      handleError(res, 500, err);
    }
  };
  
  exports.getUserById = async (req, res) => {
    try {
      const { userId } = req.params;
      const data = await getUserById(userId);
      handleResponse(res, 200, data);
    } catch (err) {
      handleError(res, 404, err);
    }
  };
  
  exports.createUser = async (req, res) => {
    try {
      const user = req.body;
      await createUser(user);
      handleResponse(res, 201, 'User created');
    } catch (err) {
      handleError(res, 500, err);
    }
  };
  
  exports.createFriendship = async (req, res) => {
    try {
      const { userId1, userId2 } = req.body;
      await createFriendship(userId1, userId2);
      handleResponse(res, 201, 'Friendship created');
    } catch (err) {
      handleError(res, 500, err);
    }
  };
  
  exports.listFriends = async (req, res) => {
    try {
      const { userId } = req.params;
      const data = await listFriends(userId);
      handleResponse(res, 200, data, data.length);
    } catch (err) {
      handleError(res, 500, err);
    }
  };
  
  exports.findCommonFriends = async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
      const data = await findCommonFriends(userId1, userId2);
      handleResponse(res, 200, data, data.length);
    } catch (err) {
      handleError(res, 500, err);
    }
  };
  
  exports.recommendFriends = async (req, res) => {
    try {
      const { userId } = req.params;
      const data = await recommendFriends(userId);
      handleResponse(res, 200, data, data.length);
    } catch (err) {
      handleError(res, 500, err);
    }
  };
