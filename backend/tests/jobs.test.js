'use strict';

const request = require('supertest');

// Load env before app
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('../src/app');

describe('GET /api/jobs', () => {
  it('should return a list of jobs', async () => {
    const res = await request(app).get('/api/jobs?limit=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('jobs');
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);

    // Each job should have expected fields
    const job = res.body.jobs[0];
    expect(job).toHaveProperty('id');
    expect(job).toHaveProperty('title');
    expect(job).toHaveProperty('skills');
    expect(Array.isArray(job.skills)).toBe(true);
  });

  it('should support role filter', async () => {
    const res = await request(app).get('/api/jobs?role=Software+Engineering&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBeGreaterThan(0);
  });

  it('should support skill filter', async () => {
    const res = await request(app).get('/api/jobs?skill=Python&limit=3');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBeGreaterThan(0);
    // Each returned job should include Python in its skills
    for (const job of res.body.jobs) {
      expect(job.skills.map(s => s.toLowerCase())).toContain('python');
    }
  });
});

describe('GET /api/jobs/:id', () => {
  let validJobId;

  beforeAll(async () => {
    // Get a valid job ID from the list
    const res = await request(app).get('/api/jobs?limit=1');
    validJobId = res.body.jobs[0]?.id;
  });

  it('should return a single job with skills', async () => {
    if (!validJobId) return; // skip if no jobs

    const res = await request(app).get(`/api/jobs/${validJobId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validJobId);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('skills');
    expect(Array.isArray(res.body.skills)).toBe(true);
  });

  it('should return 404 for non-existent job', async () => {
    const res = await request(app).get('/api/jobs/999999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid job ID', async () => {
    const res = await request(app).get('/api/jobs/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/skills', () => {
  it('should return all skills', async () => {
    const res = await request(app).get('/api/skills');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);

    const skill = res.body.skills[0];
    expect(skill).toHaveProperty('id');
    expect(skill).toHaveProperty('name');
    expect(skill).toHaveProperty('category');
  });
});
