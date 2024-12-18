const userService = require('../../src/services/userService');
const { User } = require('../../src/models/user');
const { driver } = require('../../src/services/ogm');

// Mocking the User model and driver session
jest.mock('../../src/models/user', () => ({
  User: {
    find: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('../../src/services/ogm', () => ({
  driver: {
    session: jest.fn(() => ({
      run: jest.fn(),
      close: jest.fn()
    }))
  }
}));

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ----------------- getAllUsers -----------------
  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' }
      ];
      User.find.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(User.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockUsers);
    });

    it('should return an empty list when no users exist', async () => {
      User.find.mockResolvedValue([]);

      const result = await userService.getAllUsers();

      expect(User.find).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });
  });

  // ----------------- getUserById -----------------
  describe('getUserById', () => {
    it('should return the user by ID', async () => {
      const mockUser = { id: '1', name: 'Alice' };
      User.find.mockResolvedValue([mockUser]);

      const result = await userService.getUserById('1');

      expect(User.find).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if the user is not found', async () => {
      User.find.mockResolvedValue([]);

      await expect(userService.getUserById('123')).rejects.toThrow(
        'User with id 123 not found'
      );
    });
  });

  // ----------------- createUser -----------------
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = { name: 'Alice', email: 'alice@example.com' };
      const mockCreatedUser = { id: 'uuid', ...userData };

      User.create.mockResolvedValue([mockCreatedUser]);

      const result = await userService.createUser(userData);

      expect(User.create).toHaveBeenCalledWith({
        input: [
          expect.objectContaining({
            name: userData.name,
            email: userData.email
          })
        ]
      });
      expect(result).toEqual([mockCreatedUser]);
    });

    it('should throw an error if user creation fails', async () => {
      const userData = { name: 'Alice', email: 'alice@example.com' };
      User.create.mockRejectedValue(new Error('Database error'));

      await expect(userService.createUser(userData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  // ----------------- createFriendship -----------------
  describe('createFriendship', () => {
    it('should create a friendship between two users', async () => {
      const user1 = { id: '1', name: 'Alice' };
      const user2 = { id: '2', name: 'Bob' };

      User.find.mockResolvedValueOnce([user1]).mockResolvedValueOnce([user2]);
      User.update.mockResolvedValue();

      await userService.createFriendship('1', '2');

      expect(User.find).toHaveBeenCalledTimes(2);
      expect(User.update).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if one of the users does not exist', async () => {
      User.find.mockResolvedValueOnce([]); // Simulating user not found

      await expect(userService.createFriendship('1', '2')).rejects.toThrow(
        'User with id 1 not found'
      );
    });
  });

  // ----------------- listFriends -----------------
  describe('listFriends', () => {
    it('should return the list of friends for a user', async () => {
      const mockFriends = [
        { id: '2', name: 'Bob', email: 'bob@example.com' },
        { id: '3', name: 'Charlie', email: 'charlie@example.com' }
      ];

      const mockUser = { id: '1', name: 'Alice', friends: mockFriends };

      User.find.mockResolvedValue([mockUser]);

      const result = await userService.listFriends('1');

      expect(User.find).toHaveBeenCalledWith({
        where: { id: '1' },
        selectionSet: expect.any(String)
      });
      expect(result).toEqual(mockFriends);
    });

    it('should return an empty list if the user has no friends', async () => {
      const mockUser = { id: '1', name: 'Alice', friends: [] };

      User.find.mockResolvedValue([mockUser]);

      const result = await userService.listFriends('1');

      expect(User.find).toHaveBeenCalledWith({
        where: { id: '1' },
        selectionSet: expect.any(String)
      });
      expect(result).toEqual([]);
    });

    it('should throw an error if the user is not found', async () => {
      User.find.mockResolvedValue([]);

      await expect(userService.listFriends('123')).rejects.toThrow(
        'User with id 123 not found'
      );
    });
  });

  // ----------------- findCommonFriends -----------------
  describe('findCommonFriends', () => {
    it('should return common friends between two users', async () => {
      const friend = { id: '3' };
      const userOne = { id: '1', friends: [{ id: '2' }, friend] };
      const userTwo = { id: '2', friends: [friend, { id: '4' }] };

      User.find
        .mockResolvedValueOnce([userOne])
        .mockResolvedValueOnce([{ friends: userOne.friends }])
        .mockResolvedValueOnce([userTwo])
        .mockResolvedValueOnce([{ friends: userTwo.friends }]);

      const result = await userService.findCommonFriends('1', '2');

      expect(User.find).toHaveBeenCalledTimes(4);
      expect(result).toEqual([friend]);
    });
  });

  // ----------------- recommendFriends -----------------
  describe('recommendFriends', () => {
    it('should return friend recommendations', async () => {
      const mockRecommendations = [{ id: '3', name: 'Charlie' }];

      const runMock = jest.fn().mockResolvedValue({
        records: [{ get: () => ({ properties: mockRecommendations[0] }) }]
      });

      const closeMock = jest.fn();

      driver.session.mockReturnValue({
        run: runMock,
        close: closeMock
      });

      const result = await userService.recommendFriends('1');

      expect(result).toEqual(mockRecommendations);
      expect(driver.session).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(expect.stringContaining('MATCH'), {
        userId: '1'
      });
      expect(closeMock).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'database connection error';

      const runMock = jest.fn().mockRejectedValue(new Error(errorMessage));
      const closeMock = jest.fn();

      driver.session.mockReturnValue({
        run: runMock,
        close: closeMock
      });

      await expect(userService.recommendFriends('1')).rejects.toThrow(
        errorMessage
      );

      expect(driver.session).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalled();
      expect(closeMock).toHaveBeenCalled();
    });
  });
});
