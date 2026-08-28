'use strict';

const request = require('supertest');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('../src/app');

describe('GET /api/profile', () => {
  it('should return user profile with skills and target roles', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('skills');
    expect(res.body).toHaveProperty('targetRoles');
    expect(Array.isArray(res.body.skills)).toBe(true);
    expect(Array.isArray(res.body.targetRoles)).toBe(true);
    expect(res.body.skills.length).toBeGreaterThan(0);

    // Each skill should have name and proficiency
    const skill = res.body.skills[0];
    expect(skill).toHaveProperty('name');
    expect(skill).toHaveProperty('proficiency');
    expect(skill.proficiency).toBeGreaterThanOrEqual(0);
    expect(skill.proficiency).toBeLessThanOrEqual(4);
  });
});

describe('PUT /api/profile', () => {
  // Store original profile to restore after tests
  let originalProfile;

  beforeAll(async () => {
    const res = await request(app).get('/api/profile');
    originalProfile = res.body;
  });

  afterAll(async () => {
    // Restore original profile
    if (originalProfile) {
      await request(app).put('/api/profile').send({
        name: originalProfile.name,
        skills: originalProfile.skills,
        targetRoles: originalProfile.targetRoles,
      });
    }
  });

  it('should update name', async () => {
    const res = await request(app)
      .put('/api/profile')
      .send({ name: 'Test User Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test User Updated');
  });

  it('should update target roles', async () => {
    const res = await request(app)
      .put('/api/profile')
      .send({ targetRoles: ['Software Engineering', 'Data & AI'] });

    expect(res.status).toBe(200);
    expect(res.body.targetRoles).toEqual(
      expect.arrayContaining(['Software Engineering', 'Data & AI'])
    );
  });

  it('should reject invalid proficiency', async () => {
    const res = await request(app)
      .put('/api/profile')
      .send({ skills: [{ name: 'Python', proficiency: 10 }] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should reject invalid skills format', async () => {
    const res = await request(app)
      .put('/api/profile')
      .send({ skills: 'not an array' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should reject unknown skill names', async () => {
    const res = await request(app)
      .put('/api/profile')
      .send({ skills: [{ name: 'NonExistentSkill9999', proficiency: 2 }] });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
