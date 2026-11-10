const request = require('supertest');

// Avoid connecting to Neo4j: the routes (and the OGM behind them) are not needed here.
jest.mock('../src/routes/userRoutes', () => require('express').Router());
jest.mock('../src/routes/graphRoutes', () => require('express').Router());

const ALLOWED_ORIGIN = 'https://front.example.com';
const WRITE_LIMIT = 2;

// Must be set before the app is loaded: CORS and rate limits are read at startup.
process.env.CORS_ORIGIN = ALLOWED_ORIGIN;
process.env.RATE_LIMIT_WRITE_MAX = String(WRITE_LIMIT);
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

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'error', error: 'Route not found' });
  });

  it('answers a malformed JSON body with a JSON 400', async () => {
    const res = await request(app)
      .post('/ping')
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: 'error', error: 'Invalid JSON body' });
  });

  it('omits the CORS header for any other origin', async () => {
    const res = await request(app)
      .get('/ping')
      .set('Origin', 'https://evil.example.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('sends security headers and hides the framework', async () => {
    const res = await request(app).get('/ping');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('rejects bodies over 10kb with a JSON 413', async () => {
    const res = await request(app)
      .post('/ping')
      .send({ name: 'a'.repeat(11 * 1024) });

    expect(res.status).toBe(413);
    expect(res.body.status).toBe('error');
  });

  it('does not rate limit /ping', async () => {
    const res = await request(app).get('/ping');

    expect(res.headers.ratelimit).toBeUndefined();
  });

  it('rate limits writes under /api with a JSON 429', async () => {
    for (let i = 0; i < WRITE_LIMIT; i++) {
      const allowed = await request(app).post('/api/users').send({});
      expect(allowed.status).not.toBe(429);
    }

    const blocked = await request(app).post('/api/users').send({});

    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      status: 'error',
      error: 'Too many write requests, please try again later'
    });
    expect(blocked.headers.ratelimit).toBeDefined();
  });

  it('keeps reads allowed after the write limit is reached', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).not.toBe(429);
  });
});
