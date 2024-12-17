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

