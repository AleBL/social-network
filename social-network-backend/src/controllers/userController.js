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
