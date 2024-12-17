const userController = require('../../src/controllers/userController');
const userService = require('../../src/services/userService');

jest.mock('../../src/services/userService', () => ({
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  createFriendship: jest.fn(),
  listFriends: jest.fn(),
  findCommonFriends: jest.fn(),
  recommendFriends: jest.fn(),
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('User Controller', () => {
  let res;

  beforeEach(() => {
    res = mockResponse();
    jest.clearAllMocks();
  });

  const mockRequest = (params = {}, body = {}) => ({
    params,
    body,
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockData = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      userService.getAllUsers.mockResolvedValue(mockData);

      await userController.getAllUsers({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: mockData.length,
        data: mockData,
      });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Database error');
      userService.getAllUsers.mockRejectedValue(mockError);

      await userController.getAllUsers({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: mockError.message,
      });
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockData = { id: 1, name: 'Alice' };
      const req = { params: { userId: '1' } };
      userService.getUserById.mockResolvedValue(mockData);

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockData,
      });
    });

    it('should handle user not found', async () => {
      const mockError = new Error('User not found');
      const req = { params: { userId: '1' } };
      userService.getUserById.mockRejectedValue(mockError);

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: mockError.message,
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const req = { body: { name: 'Alice' } };
      userService.createUser.mockResolvedValue();

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: 'User created',
      });
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Creation failed');
      const req = { body: { name: 'Alice' } };
      userService.createUser.mockRejectedValue(mockError);

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: mockError.message,
      });
    });
  });

  describe('createFriendship', () => {
    it('should create a friendship successfully', async () => {
      const req = mockRequest({}, { userId1: '1', userId2: '2' });
      userService.createFriendship.mockResolvedValue();

      await userController.createFriendship(req, res);

      expect(userService.createFriendship).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: 'Friendship created',
      });
    });

    it('should handle errors when creating a friendship', async () => {
      const req = mockRequest({}, { userId1: '1', userId2: '2' });
      userService.createFriendship.mockRejectedValue(new Error('Database error'));

      await userController.createFriendship(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Database error',
      });
    });
  });

  describe('listFriends', () => {
    it('should return a list of friends', async () => {
      const mockFriends = [{ id: '2', name: 'Bob' }, { id: '3', name: 'Alice' }];
      const req = mockRequest({ userId: '1' });

      userService.listFriends.mockResolvedValue(mockFriends);

      await userController.listFriends(req, res);

      // toHaveBeenCalledTimes
      expect(userService.listFriends).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: mockFriends.length,
        data: mockFriends,
      });
    });

    it('should handle errors when listing friends', async () => {
      const req = mockRequest({ userId: '1' });
      userService.listFriends.mockRejectedValue(new Error('Failed to list friends'));

      await userController.listFriends(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Failed to list friends',
      });
    });
  });

  describe('findCommonFriends', () => {
    it('should return common friends between two users', async () => {
      const mockCommonFriends = [{ id: '3', name: 'Charlie' }];
      const req = mockRequest({ userId1: '1', userId2: '2' });

      userService.findCommonFriends.mockResolvedValue(mockCommonFriends);

      await userController.findCommonFriends(req, res);

      expect(userService.findCommonFriends).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: mockCommonFriends.length,
        data: mockCommonFriends,
      });
    });

    it('should handle errors when finding common friends', async () => {
      const req = mockRequest({ userId1: '1', userId2: '2' });
      userService.findCommonFriends.mockRejectedValue(new Error('Failed to find common friends'));

      await userController.findCommonFriends(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Failed to find common friends',
      });
    });
  });

  describe('recommendFriends', () => {
    it('should return friend recommendations', async () => {
      const mockRecommendations = [{ id: '4', name: 'Dave' }];
      const req = mockRequest({ userId: '1' });

      userService.recommendFriends.mockResolvedValue(mockRecommendations);

      await userController.recommendFriends(req, res);

      expect(userService.recommendFriends).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: mockRecommendations.length,
        data: mockRecommendations,
      });
    });

    it('should handle errors when recommending friends', async () => {
      const req = mockRequest({ userId: '1' });
      userService.recommendFriends.mockRejectedValue(new Error('Failed to recommend friends'));

      await userController.recommendFriends(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: 'Failed to recommend friends',
      });
    });
  });

  describe('Error handling in user controller', () => {
    const unexpectErrorMessage = 'An unexpected error occurred';

    it('should return a specific error message if provided', async () => {
      const specificErrorMessage = 'Specific error';
      const mockError = new Error(specificErrorMessage);
      userService.getAllUsers.mockRejectedValue(mockError);
  
      await userController.getAllUsers({}, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: specificErrorMessage,
      });
    });
  
    it('should return the default error message if none is provided', async () => {
      const mockError = {};
      userService.getAllUsers.mockRejectedValue(mockError);
  
      await userController.getAllUsers({}, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: unexpectErrorMessage,
      });
    });
  
    it('should return the default error message if the error is undefined', async () => {
      userService.getAllUsers.mockRejectedValue(undefined);

      await userController.getAllUsers({}, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        error: unexpectErrorMessage,
      });
    });
  });
});
