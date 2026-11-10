const userController = require('../../src/controllers/userController');
const userService = require('../../src/services/userService');

jest.mock('../../src/services/userService', () => ({
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  createFriendship: jest.fn(),
  listFriends: jest.fn(),
  findCommonFriends: jest.fn(),
  recommendFriends: jest.fn()
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (params = {}, body = {}) => ({
  params,
  body
});

describe('User Controller', () => {
  let res;
  let next;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockData = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      userService.getAllUsers.mockResolvedValue(mockData);

      await userController.getAllUsers({}, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: mockData.length,
        data: mockData
      });
    });

    it('should include count 0 for an empty list', async () => {
      userService.getAllUsers.mockResolvedValue([]);

      await userController.getAllUsers({}, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: 0,
        data: []
      });
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockData = { id: 1, name: 'Alice' };
      const req = mockRequest({ userId: '1' });
      userService.getUserById.mockResolvedValue(mockData);

      await userController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockData
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const req = mockRequest({}, { name: 'Alice', email: 'a@b.co' });
      userService.createUser.mockResolvedValue();

      await userController.createUser(req, res, next);

      expect(userService.createUser).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: 'User created'
      });
    });
  });

  describe('createFriendship', () => {
    it('should create a friendship successfully', async () => {
      const req = mockRequest({}, { userId1: '1', userId2: '2' });
      userService.createFriendship.mockResolvedValue();

      await userController.createFriendship(req, res, next);

      expect(userService.createFriendship).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: 'Friendship created'
      });
    });

    it('should not crash when the request has no body', async () => {
      userService.createFriendship.mockResolvedValue();

      await userController.createFriendship({ params: {} }, res, next);

      expect(userService.createFriendship).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });
  });

  describe('listFriends', () => {
    it('should return a list of friends', async () => {
      const mockFriends = [
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Alice' }
      ];
      userService.listFriends.mockResolvedValue(mockFriends);

      await userController.listFriends(mockRequest({ userId: '1' }), res, next);

      expect(userService.listFriends).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: mockFriends.length,
        data: mockFriends
      });
    });
  });

  describe('findCommonFriends', () => {
    it('should return common friends between two users', async () => {
      const mockCommonFriends = [{ id: '3', name: 'Charlie' }];
      userService.findCommonFriends.mockResolvedValue(mockCommonFriends);

      await userController.findCommonFriends(
        mockRequest({ userId1: '1', userId2: '2' }),
        res,
        next
      );

      expect(userService.findCommonFriends).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: mockCommonFriends.length,
        data: mockCommonFriends
      });
    });
  });

  describe('recommendFriends', () => {
    it('should return friend recommendations', async () => {
      const mockRecommendations = [{ id: '4', name: 'Dave' }];
      userService.recommendFriends.mockResolvedValue(mockRecommendations);

      await userController.recommendFriends(
        mockRequest({ userId: '1' }),
        res,
        next
      );

      expect(userService.recommendFriends).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        count: mockRecommendations.length,
        data: mockRecommendations
      });
    });
  });

  // Status codes and messages are decided by the errorHandler middleware.
  describe('error forwarding', () => {
    it.each([
      ['getAllUsers', 'getAllUsers', {}],
      ['getUserById', 'getUserById', mockRequest({ userId: '1' })],
      ['createUser', 'createUser', mockRequest({}, { name: 'Alice' })],
      [
        'createFriendship',
        'createFriendship',
        mockRequest({}, { userId1: '1', userId2: '2' })
      ],
      ['listFriends', 'listFriends', mockRequest({ userId: '1' })],
      [
        'findCommonFriends',
        'findCommonFriends',
        mockRequest({ userId1: '1', userId2: '2' })
      ],
      ['recommendFriends', 'recommendFriends', mockRequest({ userId: '1' })]
    ])('%s passes service errors to next', async (handler, serviceFn, req) => {
      const error = new Error('Service failure');
      userService[serviceFn].mockRejectedValue(error);

      await userController[handler](req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
