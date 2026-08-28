'use strict';

const db = require('../db/connection');

/**
 * Returns overall skill demand across all CS/Tech postings.
 * Sorted by demand (highest first).
 */
async function getSkillDemand() {
  const result = await db.query(`
    SELECT
      s.name       AS skill,
      s.category,
      md.posting_count   AS "postingCount",
      md.demand_percentage AS demand
    FROM market_demand md
    JOIN skills s ON s.id = md.skill_id
    ORDER BY md.posting_count DESC
  `);

  return result.rows.map((r) => ({
    skill:        r.skill,
    category:     r.category,
    postingCount: r.postingCount,
    demand:       parseFloat(r.demand),
  }));
}

/**
 * Returns skill demand broken down by role category.
 * Returns a map: { roleName: [{ skill, frequency }] }
 */
async function getRoleDemand() {
  const result = await db.query(`
    SELECT
      r.name       AS role,
      s.name       AS skill,
      rs.frequency
    FROM roles r
    JOIN role_skills rs ON rs.role_id  = r.id
    JOIN skills      s  ON s.id        = rs.skill_id
    ORDER BY r.name, rs.frequency DESC
  `);

  const grouped = {};
  for (const row of result.rows) {
    if (!grouped[row.role]) grouped[row.role] = [];
    grouped[row.role].push({
      skill:     row.skill,
      frequency: parseFloat(row.frequency),
    });
  }

  // Convert to array format for easy consumption
  return Object.entries(grouped).map(([role, skills]) => ({
    role,
    topSkills: skills.slice(0, 10),
  }));
}

module.exports = { getSkillDemand, getRoleDemand };
