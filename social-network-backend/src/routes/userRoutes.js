const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUserById);
router.post('/', userController.createUser);
router.post('/createFriendship', userController.createFriendship);
router.get('/listFriends/:userId', userController.listFriends);
router.get('/findCommonFriends/:userId1/:userId2', userController.findCommonFriends);
router.get('/recommendFriends/:userId', userController.recommendFriends);

module.exports = router;
