'use strict';

const db = require('../db/connection');

/**
 * Returns all role categories with their important skills (frequency >= 0.10).
 */
async function getAllRoles() {
  const rolesResult = await db.query('SELECT id, name FROM roles ORDER BY name');
  const roles = rolesResult.rows;

  if (roles.length === 0) return [];

  // Attach top skills per role
  const skillsResult = await db.query(`
    SELECT
      r.id   AS role_id,
      r.name AS role_name,
      s.name AS skill_name,
      rs.frequency
    FROM roles r
    JOIN role_skills rs ON rs.role_id  = r.id
    JOIN skills      s  ON s.id        = rs.skill_id
    ORDER BY r.name, rs.frequency DESC
  `);

  // Group skills by role
  const skillsByRole = {};
  for (const row of skillsResult.rows) {
    if (!skillsByRole[row.role_id]) skillsByRole[row.role_id] = [];
    skillsByRole[row.role_id].push({
      skill: row.skill_name,
      frequency: parseFloat(row.frequency),
    });
  }

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    topSkills: (skillsByRole[r.id] || []).slice(0, 10),
  }));
}

/**
 * Returns a single role by ID, with its full skill profile.
 */
async function getRoleById(id) {
  const roleResult = await db.query(
    'SELECT id, name FROM roles WHERE id = $1',
    [id]
  );
  const role = roleResult.rows[0];
  if (!role) return null;

  const skillsResult = await db.query(`
    SELECT s.name AS skill, rs.frequency
    FROM role_skills rs
    JOIN skills s ON s.id = rs.skill_id
    WHERE rs.role_id = $1
    ORDER BY rs.frequency DESC
  `, [id]);

  return {
    id: role.id,
    name: role.name,
    skills: skillsResult.rows.map((r) => ({
      skill: r.skill,
      frequency: parseFloat(r.frequency),
    })),
  };
}

module.exports = { getAllRoles, getRoleById };
