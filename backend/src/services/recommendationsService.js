'use strict';

const db = require('../db/connection');

const DEFAULT_USER_ID = 1;

/**
 * Returns pre-computed learning recommendations for a user,
 * ordered by priority score descending.
 */
async function getRecommendations(userId = DEFAULT_USER_ID, limit = 10) {
  const result = await db.query(`
    SELECT
      s.name                    AS skill,
      s.category,
      r.priority_score          AS "priorityScore",
      r.demand_level            AS "demandLevel",
      r.role_relevance_pct      AS "roleRelevancePct",
      r.market_demand_pct       AS "marketDemandPct",
      r.explanation
    FROM recommendations r
    JOIN skills s ON s.id = r.skill_id
    WHERE r.user_id = $1
    ORDER BY r.priority_score DESC
    LIMIT $2
  `, [userId, limit]);

  return result.rows.map((r) => ({
    skill:            r.skill,
    category:         r.category,
    priority:         parseFloat(r.priorityScore),
    demandLevel:      r.demandLevel,
    roleRelevancePct: parseFloat(r.roleRelevancePct),
    marketDemandPct:  parseFloat(r.marketDemandPct),
    reason:           r.explanation,
  }));
}

module.exports = { getRecommendations };
