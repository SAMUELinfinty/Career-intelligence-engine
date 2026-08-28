'use strict';

const db = require('../db/connection');

/**
 * Returns all canonical skills, sorted by category then name.
 */
async function getAllSkills() {
  const result = await db.query(
    'SELECT id, name, category FROM skills ORDER BY category, name'
  );
  return result.rows;
}

/**
 * Returns a single skill by ID.
 */
async function getSkillById(id) {
  const result = await db.query(
    'SELECT id, name, category FROM skills WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { getAllSkills, getSkillById };
