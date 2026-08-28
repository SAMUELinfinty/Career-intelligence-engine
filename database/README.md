# Database — Career Intelligence Engine

## Overview

The PostgreSQL schema stores all career intelligence data: jobs, skills, user profiles, role profiles, market demand stats, and pre-computed learning recommendations.

Raw CSV files are **not** committed to Git. The processed dataset is loaded via a Python import script.

---

## Prerequisites

- PostgreSQL 15+ installed and running
- Python 3.9+ with `psycopg2-binary` installed
- The processed data files must exist in `ml/Data/Processed/`

```bash
pip install psycopg2-binary
```

---

## Setup Steps

### 1. Create the database

```bash
createdb -U postgres career_intelligence
```

Or via psql:
```sql
CREATE DATABASE career_intelligence;
```

### 2. Configure environment

Copy the backend `.env.example` and fill in your credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/career_intelligence
```

### 3. Initialize the schema

```bash
psql -U postgres -d career_intelligence -f database/schema.sql
```

### 4. Import all data

Run the Python import script from the project root:

```bash
python ml/src/data/load_to_postgres.py
```

This script:
1. Inserts all 83 canonical skills (with categories)
2. Inserts the 6 role categories with derived skill frequency profiles
3. Imports 12,196 CS/Tech job postings (streamed in batches of 500)
4. Inserts ~83,000 job-skill relationships
5. Inserts the default user profile (Alex Rivera) with skills and target roles
6. Pre-computes market demand statistics
7. Pre-computes learning recommendations for user 1

Expected runtime: **2–5 minutes** depending on machine speed.

---

## Schema Summary

| Table | Purpose | Rows (approx) |
|---|---|---|
| `skills` | Canonical skill names + categories | 83 |
| `users` | User profiles | 1 |
| `user_skills` | User proficiency per skill | 12 |
| `user_target_roles` | User's target role categories | 3 |
| `jobs` | CS/Tech job postings | 12,196 |
| `job_skills` | Job ↔ skill relationships | ~83,000 |
| `roles` | Role category definitions | 6 |
| `role_skills` | Role ↔ skill frequency (≥10%) | ~100–200 |
| `market_demand` | Pre-computed skill demand % | 83 |
| `recommendations` | Pre-computed learning recs for user 1 | ≤83 |

---

## Re-import / Reset

To reset and re-import everything:

```bash
psql -U postgres -d career_intelligence -f database/schema.sql
python ml/src/data/load_to_postgres.py
```

The schema.sql uses `DROP TABLE IF EXISTS CASCADE` before creating tables, making it safe to re-run.

---

## Environment Variables

The import script reads the `DATABASE_URL` from `backend/.env` or from the environment.

```
DATABASE_URL=postgresql://user:password@localhost:5432/career_intelligence
```
