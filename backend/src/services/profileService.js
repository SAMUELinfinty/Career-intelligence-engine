'use strict';

const db = require('../db/connection');

const DEFAULT_USER_ID = 1;

/**
 * Returns the current user profile including skills and target roles.
 */
async function getProfile(userId = DEFAULT_USER_ID) {
  const userResult = await db.query(
    'SELECT id, name, created_at AS "createdAt" FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) return null;

  const skillsResult = await db.query(`
    SELECT s.name, us.proficiency
    FROM user_skills us
    JOIN skills s ON s.id = us.skill_id
    WHERE us.user_id = $1
    ORDER BY s.name
  `, [userId]);

  const rolesResult = await db.query(
    'SELECT role_name AS role FROM user_target_roles WHERE user_id = $1 ORDER BY role_name',
    [userId]
  );

  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt,
    skills: skillsResult.rows.map((r) => ({
      name: r.name,
      proficiency: r.proficiency,
    })),
    targetRoles: rolesResult.rows.map((r) => r.role),
  };
}

/**
 * Updates the user profile (skills + target roles).
 *
 * Accepted payload:
 *   {
 *     name?:        string,
 *     skills?:      [{ name: string, proficiency: 0-4 }, ...],
 *     targetRoles?: string[]
 *   }
 */
async function updateProfile(payload, userId = DEFAULT_USER_ID) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Update name if provided
    if (payload.name) {
      await client.query(
        'UPDATE users SET name = $1 WHERE id = $2',
        [payload.name.trim(), userId]
      );
    }

    // Update skills if provided
    if (Array.isArray(payload.skills)) {
      // Resolve skill IDs for all provided skill names
      const skillNames = payload.skills.map((s) => s.name.trim());

      const resolveResult = await client.query(
        'SELECT id, name FROM skills WHERE name = ANY($1)',
        [skillNames]
      );
      const skillIdMap = Object.fromEntries(
        resolveResult.rows.map((r) => [r.name, r.id])
      );

      // Collect unknown skills
      const unknown = skillNames.filter((n) => !skillIdMap[n]);
      if (unknown.length > 0) {
        const err = new Error(`Unknown skill(s): ${unknown.join(', ')}`);
        err.status = 400;
        throw err;
      }

      // Delete existing user skills and re-insert
      await client.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);

      if (payload.skills.length > 0) {
        const values = payload.skills
          .map((s) => `(${userId}, ${skillIdMap[s.name.trim()]}, ${s.proficiency})`)
          .join(', ');
        await client.query(
          `INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES ${values}`
        );
      }
    }

    // Update target roles if provided
    if (Array.isArray(payload.targetRoles)) {
      await client.query(
        'DELETE FROM user_target_roles WHERE user_id = $1',
        [userId]
      );
      if (payload.targetRoles.length > 0) {
        const values = payload.targetRoles
          .map((_, i) => `(${userId}, $${i + 1})`)
          .join(', ');
        await client.query(
          `INSERT INTO user_target_roles (user_id, role_name) VALUES ${values}`,
          payload.targetRoles
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getProfile(userId);
}

module.exports = { getProfile, updateProfile };
