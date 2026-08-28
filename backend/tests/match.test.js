'use strict';

const request = require('supertest');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('../src/app');

describe('POST /api/match', () => {
  let validJobId;

  beforeAll(async () => {
    const res = await request(app).get('/api/jobs?limit=1');
    validJobId = res.body.jobs[0]?.id;
  });

  it('should return match result for valid job', async () => {
    if (!validJobId) return;

    const res = await request(app)
      .post('/api/match')
      .send({ jobId: validJobId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobId', validJobId);
    expect(res.body).toHaveProperty('matchScore');
    expect(res.body).toHaveProperty('matchedSkills');
    expect(res.body).toHaveProperty('missingSkills');
    expect(Array.isArray(res.body.matchedSkills)).toBe(true);
    expect(Array.isArray(res.body.missingSkills)).toBe(true);
    expect(res.body.matchScore).toBeGreaterThanOrEqual(0);
    expect(res.body.matchScore).toBeLessThanOrEqual(1);
  });

  it('should return 404 for non-existent job', async () => {
    const res = await request(app)
      .post('/api/match')
      .send({ jobId: 999999999 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when jobId is missing', async () => {
    const res = await request(app)
      .post('/api/match')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when jobId is not a number', async () => {
    const res = await request(app)
      .post('/api/match')
      .send({ jobId: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 when jobId is negative', async () => {
    const res = await request(app)
      .post('/api/match')
      .send({ jobId: -5 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/recommendations', () => {
  it('should return learning recommendations', async () => {
    const res = await request(app).get('/api/recommendations');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
    expect(Array.isArray(res.body.recommendations)).toBe(true);

    if (res.body.recommendations.length > 0) {
      const rec = res.body.recommendations[0];
      expect(rec).toHaveProperty('skill');
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('reason');
      expect(rec.priority).toBeGreaterThan(0);
    }
  });
});

describe('GET /api/market/skills', () => {
  it('should return skill demand data', async () => {
    const res = await request(app).get('/api/market/skills');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('skills');
    expect(res.body.skills.length).toBeGreaterThan(0);

    const top = res.body.skills[0];
    expect(top).toHaveProperty('skill');
    expect(top).toHaveProperty('demand');
    expect(top.demand).toBeGreaterThan(0);
  });
});

describe('GET /api/market/roles', () => {
  it('should return role demand data', async () => {
    const res = await request(app).get('/api/market/roles');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('roles');
    expect(res.body.roles.length).toBeGreaterThan(0);

    const role = res.body.roles[0];
    expect(role).toHaveProperty('role');
    expect(role).toHaveProperty('topSkills');
    expect(Array.isArray(role.topSkills)).toBe(true);
  });
});

describe('GET /api/roles', () => {
  it('should return all roles', async () => {
    const res = await request(app).get('/api/roles');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.roles[0]).toHaveProperty('name');
    expect(res.body.roles[0]).toHaveProperty('topSkills');
  });
});

describe('Health check', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
