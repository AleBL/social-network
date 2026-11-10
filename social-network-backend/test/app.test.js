const request = require('supertest');

// Avoid connecting to Neo4j: the routes (and the OGM behind them) are not needed here.
jest.mock('../src/routes/userRoutes', () => require('express').Router());

const ALLOWED_ORIGIN = 'https://front.example.com';

// Must be set before the app is loaded: the CORS policy is read at startup.
process.env.CORS_ORIGIN = ALLOWED_ORIGIN;
const app = require('../src/app');

describe('app', () => {
  it('answers /ping', async () => {
    const res = await request(app).get('/ping');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'success', data: 'PONG' });
  });

  it('sends the CORS header to an allowed origin', async () => {
    const res = await request(app).get('/ping').set('Origin', ALLOWED_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });

  it('omits the CORS header for any other origin', async () => {
    const res = await request(app)
      .get('/ping')
      .set('Origin', 'https://evil.example.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
