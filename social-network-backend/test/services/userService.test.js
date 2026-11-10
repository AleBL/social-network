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

    it('should throw a 404 error if the user is not found', async () => {
      User.find.mockResolvedValue([]);

      await expect(userService.getUserById('123')).rejects.toMatchObject({
        message: 'User with id 123 not found',
        statusCode: 404
      });
    });
  });

  // ----------------- createUser -----------------
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = { name: 'Alice', email: 'alice@example.com' };
      const mockCreatedUser = { id: 'uuid', ...userData };

      User.find.mockResolvedValue([]);
      User.create.mockResolvedValue([mockCreatedUser]);

      const result = await userService.createUser(userData);

      expect(User.find).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
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

    it('should reject a duplicate email with status 409', async () => {
      const userData = { name: 'Alice', email: 'alice@example.com' };
      User.find.mockResolvedValue([{ id: '1', ...userData }]);

      await expect(userService.createUser(userData)).rejects.toMatchObject({
        message: 'User with email alice@example.com already exists',
        statusCode: 409
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should normalize the email before checking and saving', async () => {
      User.find.mockResolvedValue([]);
      User.create.mockResolvedValue([]);

      await userService.createUser({
        name: ' Alice ',
        email: ' Alice@Example.COM '
      });

      expect(User.find).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' }
      });
      expect(User.create).toHaveBeenCalledWith({
        input: [
          expect.objectContaining({ name: 'Alice', email: 'alice@example.com' })
        ]
      });
    });

    it('should reject invalid input with status 400 without querying', async () => {
      await expect(
        userService.createUser({ name: 'Alice', email: 'not-an-email' })
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(User.find).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should throw an error if user creation fails', async () => {
      const userData = { name: 'Alice', email: 'alice@example.com' };
      User.find.mockResolvedValue([]);
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

      User.find
        .mockResolvedValueOnce([user1])
        .mockResolvedValueOnce([user2])
        .mockResolvedValueOnce([]); // not friends yet
      User.update.mockResolvedValue();

      await userService.createFriendship('1', '2');

      expect(User.find).toHaveBeenCalledTimes(3);
      expect(User.find).toHaveBeenLastCalledWith({
        where: { id: '1', friends_SOME: { id: '2' } }
      });
      expect(User.update).toHaveBeenCalledTimes(2);
    });

    it('should reject a friendship with oneself with status 400', async () => {
      await expect(
        userService.createFriendship('1', '1')
      ).rejects.toMatchObject({
        message: 'a user cannot be friends with themselves',
        statusCode: 400
      });
      expect(User.find).not.toHaveBeenCalled();
      expect(User.update).not.toHaveBeenCalled();
    });

    it('should reject an existing friendship with status 409', async () => {
      const user1 = { id: '1', name: 'Alice' };
      const user2 = { id: '2', name: 'Bob' };

      User.find
        .mockResolvedValueOnce([user1])
        .mockResolvedValueOnce([user2])
        .mockResolvedValueOnce([user1]); // already friends

      await expect(
        userService.createFriendship('1', '2')
      ).rejects.toMatchObject({
        message: 'Users 1 and 2 are already friends',
        statusCode: 409
      });
      expect(User.update).not.toHaveBeenCalled();
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
    it('should throw a 404 error for an unknown user without querying', async () => {
      User.find.mockResolvedValue([]);

      await expect(userService.recommendFriends('404')).rejects.toMatchObject({
        statusCode: 404
      });
      expect(driver.session).not.toHaveBeenCalled();
    });

    it('should return recommendations with their mutual friends sorted by name', async () => {
      const values = {
        candidate: { id: '4', name: 'Dave', email: 'dave@example.com' },
        mutualFriends: [
          { id: '3', name: 'Carol' },
          { id: '2', name: 'Bob' }
        ]
      };
      const runMock = jest.fn().mockResolvedValue({
        records: [{ get: (key) => values[key] }]
      });
      const closeMock = jest.fn();

      User.find.mockResolvedValue([{ id: '1', name: 'Alice' }]);
      driver.session.mockReturnValue({
        run: runMock,
        close: closeMock
      });

      const result = await userService.recommendFriends('1');

      expect(result).toEqual([
        {
          id: '4',
          name: 'Dave',
          email: 'dave@example.com',
          mutualFriends: [
            { id: '2', name: 'Bob' },
            { id: '3', name: 'Carol' }
          ]
        }
      ]);
      expect(closeMock).toHaveBeenCalledTimes(1);
    });

    it('should rank by mutual friends, group each candidate once and limit the list', async () => {
      const runMock = jest.fn().mockResolvedValue({ records: [] });

      User.find.mockResolvedValue([{ id: '1', name: 'Alice' }]);
      driver.session.mockReturnValue({ run: runMock, close: jest.fn() });

      await userService.recommendFriends('1');

      const [query, params] = runMock.mock.calls[0];
      // One row per candidate even when reachable through several friends.
      expect(query).toContain('collect(DISTINCT friend');
      expect(query).toContain('ORDER BY size(mutualFriends) DESC');
      expect(params.userId).toBe('1');
      expect(params.limit.toNumber()).toBe(20);
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'database connection error';

      const runMock = jest.fn().mockRejectedValue(new Error(errorMessage));
      const closeMock = jest.fn();

      User.find.mockResolvedValue([{ id: '1', name: 'Alice' }]);
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
