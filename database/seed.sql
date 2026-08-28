-- =============================================================================
-- Career Intelligence Engine — Seed SQL
-- Day 4
--
-- NOTE: This file seeds only the default user profile.
-- All bulk data (skills, jobs, job_skills, roles, role_skills,
-- market_demand, recommendations) is loaded via:
--   ml/src/data/load_to_postgres.py
-- which must be run AFTER this seed file if desired,
-- or load_to_postgres.py can seed everything including the user.
-- =============================================================================

-- Default user profile (Alex Rivera — sample portfolio user)
INSERT INTO users (id, name, created_at)
VALUES (1, 'Alex Rivera', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Reset sequence to avoid conflicts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
