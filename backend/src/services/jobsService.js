'use strict';

const db = require('../db/connection');

/**
 * Returns paginated/filtered list of jobs.
 *
 * Supported filters (all optional, via query string):
 *   role      — role_category (partial, case-insensitive)
 *   location  — location field (partial, case-insensitive)
 *   skill     — jobs that require a specific skill name
 *   experience — experience_level (partial, case-insensitive)
 *   remote    — 'true' | 'false'
 *   limit     — default 50, max 200
 *   offset    — default 0
 */
async function getJobs(filters = {}) {
  const { role, location, skill, experience, remote, limit = 50, offset = 0 } = filters;

  const safeLimit  = Math.min(parseInt(limit, 10)  || 50,  200);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  const params = [];
  const conditions = [];
  let paramIdx = 1;

  if (role) {
    conditions.push(`j.role_category ILIKE $${paramIdx++}`);
    params.push(`%${role}%`);
  }
  if (location) {
    conditions.push(`j.location ILIKE $${paramIdx++}`);
    params.push(`%${location}%`);
  }
  if (experience) {
    conditions.push(`j.experience_level ILIKE $${paramIdx++}`);
    params.push(`%${experience}%`);
  }
  if (remote === 'true' || remote === true) {
    conditions.push(`j.is_remote = TRUE`);
  } else if (remote === 'false' || remote === false) {
    conditions.push(`j.is_remote = FALSE`);
  }

  let skillJoin = '';
  if (skill) {
    skillJoin = `
      INNER JOIN job_skills js2  ON js2.job_id  = j.job_id
      INNER JOIN skills     sk2  ON sk2.id       = js2.skill_id
                                 AND sk2.name ILIKE $${paramIdx++}
    `;
    params.push(`%${skill}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      j.job_id          AS id,
      j.title,
      j.company_name    AS company,
      j.location,
      j.experience_level AS "experienceLevel",
      j.work_type       AS "workType",
      j.is_remote       AS "isRemote",
      j.normalized_salary AS salary,
      j.role_category   AS "roleCategory",
      COALESCE(
        array_agg(sk.name ORDER BY sk.name) FILTER (WHERE sk.name IS NOT NULL),
        '{}'::text[]
      ) AS skills
    FROM jobs j
    ${skillJoin}
    LEFT JOIN job_skills js ON js.job_id  = j.job_id
    LEFT JOIN skills     sk ON sk.id      = js.skill_id
    ${whereClause}
    GROUP BY j.job_id, j.title, j.company_name, j.location,
             j.experience_level, j.work_type, j.is_remote,
             j.normalized_salary, j.role_category
    ORDER BY j.job_id
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  params.push(safeLimit, safeOffset);

  const result = await db.query(sql, params);
  return result.rows;
}

/**
 * Returns a single job by its LinkedIn job_id, including its skills.
 */
async function getJobById(jobId) {
  const sql = `
    SELECT
      j.job_id          AS id,
      j.title,
      j.company_name    AS company,
      j.location,
      j.experience_level AS "experienceLevel",
      j.work_type       AS "workType",
      j.is_remote       AS "isRemote",
      j.min_salary      AS "minSalary",
      j.max_salary      AS "maxSalary",
      j.normalized_salary AS "normalizedSalary",
      j.role_category   AS "roleCategory",
      COALESCE(
        array_agg(sk.name ORDER BY sk.name) FILTER (WHERE sk.name IS NOT NULL),
        '{}'::text[]
      ) AS skills
    FROM jobs j
    LEFT JOIN job_skills js ON js.job_id = j.job_id
    LEFT JOIN skills     sk ON sk.id     = js.skill_id
    WHERE j.job_id = $1
    GROUP BY j.job_id, j.title, j.company_name, j.location,
             j.experience_level, j.work_type, j.is_remote,
             j.min_salary, j.max_salary, j.normalized_salary, j.role_category
  `;

  const result = await db.query(sql, [jobId]);
  return result.rows[0] || null;
}

module.exports = { getJobs, getJobById };
