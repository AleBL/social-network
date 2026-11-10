const {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it
} = require('@jest/globals');
const request = require('supertest');
const { assertSafeDatabase, clearDatabase } = require('./helpers');

// Checked before the app (and its Neo4j driver) is even loaded.
assertSafeDatabase();

const app = require('../../src/app');
const { driver, ready } = require('../../src/services/ogm');

const api = () => request(app);

// POST /api/users does not return the new id, so it is looked up by email.
async function createUser(name, email) {
  const created = await api().post('/api/users').send({ name, email });
  expect(created.status).toBe(201);

  const list = await api().get('/api/users');
  return list.body.data.find((user) => user.email === email.toLowerCase());
}

async function befriend(userId1, userId2) {
  return api().post('/api/users/createFriendship').send({ userId1, userId2 });
}

const names = (users) => users.map((user) => user.name).sort();

describe('API with a real Neo4j', () => {
  beforeAll(async () => {
    await ready;
    await driver.verifyConnectivity();
  });

  beforeEach(async () => {
    await clearDatabase(driver);
  });

  afterAll(async () => {
    await clearDatabase(driver);
    await driver.close();
  });

  it('creates the unique email constraint at startup', async () => {
    const { records } = await driver.executeQuery(
      'SHOW CONSTRAINTS YIELD name, labelsOrTypes, properties RETURN name, labelsOrTypes, properties'
    );

    expect(records.map((record) => record.toObject())).toContainEqual({
      name: 'user_email_unique',
      labelsOrTypes: ['User'],
      properties: ['email']
    });
  });

  describe('users', () => {
    it('creates a user with a normalized email and lists it', async () => {
      const res = await api()
        .post('/api/users')
        .send({ name: ' Alice ', email: ' Alice@Example.COM ' });

      expect(res.status).toBe(201);

      const list = await api().get('/api/users');
      expect(list.status).toBe(200);
      expect(list.body.count).toBe(1);
      expect(list.body.data[0]).toMatchObject({
        name: 'Alice',
        email: 'alice@example.com'
      });
    });

    it('returns count 0 when there are no users', async () => {
      const list = await api().get('/api/users');

      expect(list.body).toEqual({ status: 'success', data: [], count: 0 });
    });

    it('gets a user by id and answers 404 for an unknown id', async () => {
      const alice = await createUser('Alice', 'alice@example.com');

      const found = await api().get(`/api/users/${alice.id}`);
      expect(found.status).toBe(200);
      expect(found.body.data).toMatchObject({ id: alice.id, name: 'Alice' });

      const missing = await api().get('/api/users/unknown-id');
      expect(missing.status).toBe(404);
      expect(missing.body.error).toBe('User with id unknown-id not found');
    });

    it('rejects a duplicate email regardless of case with 409', async () => {
      await createUser('Alice', 'alice@example.com');

      const res = await api()
        .post('/api/users')
        .send({ name: 'Other Alice', email: 'ALICE@example.com' });

      expect(res.status).toBe(409);
    });

    it('rejects invalid input with 400', async () => {
      const res = await api()
        .post('/api/users')
        .send({ name: 'Alice', email: 'not-an-email' });

      expect(res.status).toBe(400);
    });
  });

  describe('friendships', () => {
    // alice - bob, alice - carol, bob - dave, carol - dave
    let alice;
    let bob;
    let carol;
    let dave;

    beforeEach(async () => {
      alice = await createUser('Alice', 'alice@example.com');
      bob = await createUser('Bob', 'bob@example.com');
      carol = await createUser('Carol', 'carol@example.com');
      dave = await createUser('Dave', 'dave@example.com');

      for (const [a, b] of [
        [alice, bob],
        [alice, carol],
        [bob, dave],
        [carol, dave]
      ]) {
        const res = await befriend(a.id, b.id);
        expect(res.status).toBe(201);
      }
    });

    it('lists friends in both directions', async () => {
      const aliceFriends = await api().get(
        `/api/users/listFriends/${alice.id}`
      );
      const bobFriends = await api().get(`/api/users/listFriends/${bob.id}`);

      expect(names(aliceFriends.body.data)).toEqual(['Bob', 'Carol']);
      expect(names(bobFriends.body.data)).toEqual(['Alice', 'Dave']);
    });

    it('finds common friends', async () => {
      const res = await api().get(
        `/api/users/findCommonFriends/${bob.id}/${carol.id}`
      );

      expect(res.status).toBe(200);
      expect(names(res.body.data)).toEqual(['Alice', 'Dave']);
    });

    it('recommends a friend of friends only once', async () => {
      // Dave is reachable from Alice through both Bob and Carol.
      const res = await api().get(`/api/users/recommendFriends/${alice.id}`);

      expect(res.status).toBe(200);
      expect(names(res.body.data)).toEqual(['Dave']);
      // Explains the suggestion: Bob and Carol are friends with both.
      expect(names(res.body.data[0].mutualFriends)).toEqual(['Bob', 'Carol']);
    });

    it('ranks suggestions by the number of mutual friends', async () => {
      // Erin is a friend of Bob only, so for Alice she ranks below Dave
      // (friend of Bob and Carol).
      const erin = await createUser('Erin', 'erin@example.com');
      expect((await befriend(bob.id, erin.id)).status).toBe(201);

      const res = await api().get(`/api/users/recommendFriends/${alice.id}`);

      expect(res.body.data.map((person) => person.name)).toEqual([
        'Dave',
        'Erin'
      ]);
      expect(
        res.body.data.map((person) => person.mutualFriends.length)
      ).toEqual([2, 1]);
    });

    it('rejects an existing friendship with 409 and keeps a single relationship', async () => {
      const res = await befriend(bob.id, alice.id);
      expect(res.status).toBe(409);

      const { records } = await driver.executeQuery(
        'MATCH (:User {id: $a})-[r:FRIEND]->(:User {id: $b}) RETURN count(r) AS total',
        { a: alice.id, b: bob.id }
      );
      expect(records[0].get('total').toNumber()).toBe(1);
    });

    it('rejects a friendship with oneself with 400', async () => {
      const res = await befriend(alice.id, alice.id);

      expect(res.status).toBe(400);
    });

    it('returns the graph with each friendship once and no emails', async () => {
      const res = await api().get('/api/graph');

      expect(res.status).toBe(200);
      expect(names(res.body.data.nodes)).toEqual([
        'Alice',
        'Bob',
        'Carol',
        'Dave'
      ]);
      expect(res.body.data.nodes[0]).not.toHaveProperty('email');

      // 4 friendships, stored in both directions in Neo4j, appear once each.
      const pairs = res.body.data.links
        .map(({ source, target }) => [source, target].sort().join('-'))
        .sort();
      const expected = [
        [alice, bob],
        [alice, carol],
        [bob, dave],
        [carol, dave]
      ]
        .map(([a, b]) => [a.id, b.id].sort().join('-'))
        .sort();
      expect(pairs).toEqual(expected);
    });

    it('answers 404 when a user does not exist', async () => {
      const friendship = await befriend(alice.id, 'unknown-id');
      const friends = await api().get('/api/users/listFriends/unknown-id');
      const recommendations = await api().get(
        '/api/users/recommendFriends/unknown-id'
      );

      expect(friendship.status).toBe(404);
      expect(friends.status).toBe(404);
      expect(recommendations.status).toBe(404);
    });
  });
});
