const { getAllUsers, getUserById, createUser, createFriendship, listFriends, findCommonFriends, recommendFriends } = require('../services/userService');

exports.getAllUsers = (req, res) => {
    getAllUsers()
        .then((data) => {
            res.status(201).json({
                status: 'success',
                data: data
            });
        })
        .catch(err => {
            res.status(500).json({
                status: 'error',
                error: err.message
            });
        });
}

exports.getUserById = (req, res) => {
    const { userId } = req.params;
    getUserById(userId)
        .then((data) => {
            res.status(200).json({
                status: 'success',
                data: data
            });
        })
        .catch(err => {
            res.status(404).json({
                status: 'error',
                error: err.message
            });
        });
}

exports.createUser = (req, res) => {
  const user = req.body;
  createUser(user)
    .then(() => {
      res.status(201).json({
        status: 'success',
        data: 'User created'
      });
    })
    .catch(err => {
      res.status(500).json({
        status: 'error',
        error: err.message
      });
    });
};

exports.createFriendship = (req, res) => {
  const { userId1, userId2 } = req.body;
  createFriendship(userId1, userId2)
    .then(() => {
      res.status(201).json({
        status: 'success',
        data: 'Friendship created'
      });
    })
    .catch(err => {
      res.status(500).json({
        status: 'error',
        error: err.message
      });
    });
};

exports.listFriends = (req, res) => {
    const { userId } = req.params;
    listFriends(userId)
        .then((data) => {
            res.status(200).json({
                status: 'success',
                count: data.length,
                data: data
            });
        })
        .catch(err => {
            res.status(500).json({
                status: 'error',
                error: err.message
            });
        });
};

exports.findCommonFriends = (req, res) => {
    const { userId1, userId2 } = req.params;
    findCommonFriends(userId1, userId2)
        .then((data) => {
            res.status(200).json({
                status: 'success',
                count: data.length,
                data: data
            });
        })
        .catch(err => {
            res.status(500).json({
                status: 'error',
                error: err.message
            });
        });
};

