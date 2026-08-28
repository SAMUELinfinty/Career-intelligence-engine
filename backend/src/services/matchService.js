'use strict';

const db = require('../db/connection');

const DEFAULT_USER_ID = 1;

// ---------------------------------------------------------------------------
// IDF Weight Computation (mirrors Python baseline in matching.py)
//
// Formula: IDF(s) = ln((N + 1) / (DF(s) + 1)) + 1
//
// Where:
//   N     = total number of CS/Tech job postings in the dataset
//   DF(s) = number of job postings that require skill s (posting_count)
// ---------------------------------------------------------------------------

/** Cached IDF weights — recomputed if stale */
let _idfCache = null;
let _totalJobsCache = null;

async function _getIdfWeights() {
  if (_idfCache) return { idfWeights: _idfCache, totalJobs: _totalJobsCache };

  // Total job count
  const countResult = await db.query('SELECT COUNT(*) AS n FROM jobs');
  const N = parseInt(countResult.rows[0].n, 10);

  // Posting counts per skill from pre-computed market_demand table
  const demandResult = await db.query(`
    SELECT s.name AS skill, md.posting_count AS df
    FROM market_demand md
    JOIN skills s ON s.id = md.skill_id
  `);

  const weights = {};
  for (const row of demandResult.rows) {
    const df = parseInt(row.df, 10);
    weights[row.skill] = Math.log((N + 1) / (df + 1)) + 1;
  }

  _idfCache = weights;
  _totalJobsCache = N;

  return { idfWeights: weights, totalJobs: N };
}

// ---------------------------------------------------------------------------
// Match a user against a specific job
// ---------------------------------------------------------------------------

/**
 * Computes the IDF-weighted skill match between user 1 and a job.
 *
 * Returns:
 *   {
 *     jobId:               number,
 *     title:               string,
 *     company:             string,
 *     matchScore:          number  (0.00 – 1.00),
 *     matchedSkills:       string[],
 *     missingSkills:       string[],
 *     matchedSkillCount:   number,
 *     missingSkillCount:   number
 *   }
 */
async function computeMatch(jobId, userId = DEFAULT_USER_ID) {
  // Load job info + required skills in one query
  const jobResult = await db.query(`
    SELECT
      j.job_id,
      j.title,
      j.company_name,
      COALESCE(
        array_agg(s.name ORDER BY s.name) FILTER (WHERE s.name IS NOT NULL),
        '{}'::text[]
      ) AS job_skills
    FROM jobs j
    LEFT JOIN job_skills js ON js.job_id = j.job_id
    LEFT JOIN skills     s  ON s.id      = js.skill_id
    WHERE j.job_id = $1
    GROUP BY j.job_id, j.title, j.company_name
  `, [jobId]);

  const job = jobResult.rows[0];
  if (!job) return null;

  // Load user's known skills (proficiency >= 1)
  const userResult = await db.query(`
    SELECT s.name
    FROM user_skills us
    JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = $1 AND us.proficiency >= 1
  `, [userId]);

  const userSkills = new Set(userResult.rows.map((r) => r.name));
  const jobSkills  = job.job_skills;

  if (jobSkills.length === 0) {
    return {
      jobId:             job.job_id,
      title:             job.title,
      company:           job.company_name,
      matchScore:        0,
      matchedSkills:     [],
      missingSkills:     [],
      matchedSkillCount: 0,
      missingSkillCount: 0,
    };
  }

  const { idfWeights } = await _getIdfWeights();

  const matched = jobSkills.filter((s) => userSkills.has(s));
  const missing = jobSkills.filter((s) => !userSkills.has(s));

  // IDF-weighted score: sum(idf[matched]) / sum(idf[job_skills])
  const totalWeight   = jobSkills.reduce((acc, s) => acc + (idfWeights[s] || 1.0), 0);
  const matchedWeight = matched.reduce((acc, s)  => acc + (idfWeights[s] || 1.0), 0);

  const matchScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;

  return {
    jobId:             job.job_id,
    title:             job.title,
    company:           job.company_name,
    matchScore:        parseFloat(matchScore.toFixed(4)),
    matchedSkills:     matched,
    missingSkills:     missing,
    matchedSkillCount: matched.length,
    missingSkillCount: missing.length,
  };
}

/**
 * Clears the IDF weight cache.
 * Should be called if the jobs/market_demand data changes.
 */
function clearIdfCache() {
  _idfCache = null;
  _totalJobsCache = null;
}

module.exports = { computeMatch, clearIdfCache };
