-- =============================================================================
-- Career Intelligence Engine — PostgreSQL Schema
-- Day 4
-- =============================================================================

-- Drop tables in reverse dependency order (safe re-init)
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS market_demand   CASCADE;
DROP TABLE IF EXISTS role_skills     CASCADE;
DROP TABLE IF EXISTS job_skills      CASCADE;
DROP TABLE IF EXISTS user_target_roles CASCADE;
DROP TABLE IF EXISTS user_skills     CASCADE;
DROP TABLE IF EXISTS jobs            CASCADE;
DROP TABLE IF EXISTS roles           CASCADE;
DROP TABLE IF EXISTS skills          CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

-- =============================================================================
-- SKILLS
-- Canonical, normalised skill names (e.g. "React", not "ReactJS" / "react.js")
-- =============================================================================
CREATE TABLE skills (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL
);

-- =============================================================================
-- USERS
-- Single-profile MVP. No authentication required.
-- =============================================================================
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- USER_SKILLS
-- User proficiency per skill (0 = none, 4 = expert)
-- =============================================================================
CREATE TABLE user_skills (
    user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    skill_id   INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency SMALLINT NOT NULL DEFAULT 0 CHECK (proficiency BETWEEN 0 AND 4),
    PRIMARY KEY (user_id, skill_id)
);

-- =============================================================================
-- USER_TARGET_ROLES
-- Target role categories for a user (matches role_category values in jobs)
-- =============================================================================
CREATE TABLE user_target_roles (
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, role_name)
);

-- =============================================================================
-- JOBS
-- Processed CS/Tech job postings from the LinkedIn dataset (12,196 rows)
-- Only fields that actually exist and are useful are included.
-- NULL is used where data is genuinely missing (not fabricated).
-- =============================================================================
CREATE TABLE jobs (
    id                 SERIAL PRIMARY KEY,
    job_id             BIGINT       NOT NULL UNIQUE,   -- Original LinkedIn job_id
    title              VARCHAR(500) NOT NULL,
    company_name       VARCHAR(500),
    company_id         BIGINT,
    location           VARCHAR(500),
    experience_level   VARCHAR(100),                   -- Inferred from title/description
    work_type          VARCHAR(50),                    -- Full-time, Part-time, Contract, etc.
    is_remote          BOOLEAN      NOT NULL DEFAULT FALSE,
    min_salary         NUMERIC(12,2),
    max_salary         NUMERIC(12,2),
    normalized_salary  NUMERIC(12,2),
    role_category      VARCHAR(100),                   -- Software Engineering, Data & AI, etc.
    listed_time        BIGINT,                         -- Unix epoch from dataset
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- JOB_SKILLS
-- Many-to-many: jobs ↔ skills
-- =============================================================================
CREATE TABLE job_skills (
    job_id   BIGINT  NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

-- =============================================================================
-- ROLES
-- The 6 derived role categories from the dataset
-- =============================================================================
CREATE TABLE roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- =============================================================================
-- ROLE_SKILLS
-- Derived from dataset: frequency of each skill within a role category.
-- Only skills appearing in >= 10% of that role's jobs are stored.
-- =============================================================================
CREATE TABLE role_skills (
    role_id   INTEGER NOT NULL REFERENCES roles(id)  ON DELETE CASCADE,
    skill_id  INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    frequency NUMERIC(6,4) NOT NULL,  -- Fraction of role jobs requiring this skill
    PRIMARY KEY (role_id, skill_id)
);

-- =============================================================================
-- MARKET_DEMAND
-- Pre-computed skill demand stats across all 12,196 CS postings.
-- Used for IDF weight computation and recommendations.
-- =============================================================================
CREATE TABLE market_demand (
    id                SERIAL PRIMARY KEY,
    skill_id          INTEGER NOT NULL UNIQUE REFERENCES skills(id) ON DELETE CASCADE,
    posting_count     INTEGER NOT NULL DEFAULT 0,
    demand_percentage NUMERIC(6,2) NOT NULL DEFAULT 0.00
);

-- =============================================================================
-- RECOMMENDATIONS
-- Pre-computed learning priority recommendations per user.
-- Recomputed when user profile changes.
-- =============================================================================
CREATE TABLE recommendations (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    skill_id            INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    priority_score      NUMERIC(6,4) NOT NULL,
    demand_level        VARCHAR(20)  NOT NULL,  -- High | Medium | Low
    role_relevance_pct  NUMERIC(6,2) NOT NULL,
    market_demand_pct   NUMERIC(6,2) NOT NULL,
    explanation         TEXT         NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, skill_id)
);

-- =============================================================================
-- INDEXES
-- Only added where they provide genuine query benefit
-- =============================================================================

-- Job lookups
CREATE INDEX idx_jobs_job_id        ON jobs(job_id);
CREATE INDEX idx_jobs_role_category ON jobs(role_category);
CREATE INDEX idx_jobs_experience    ON jobs(experience_level);
CREATE INDEX idx_jobs_is_remote     ON jobs(is_remote);

-- Job–skill joins (both directions)
CREATE INDEX idx_job_skills_job_id  ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);

-- User skill lookups
CREATE INDEX idx_user_skills_user_id  ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);

-- Skill name lookup (case-insensitive search support)
CREATE INDEX idx_skills_name ON skills(name);

-- Recommendations per user
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
