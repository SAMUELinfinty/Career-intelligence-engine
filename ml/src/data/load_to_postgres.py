"""
load_to_postgres.py
-------------------
Career Intelligence Engine — Day 4 Data Import Script

Imports all processed ML data into PostgreSQL:
  1. Canonical skills (83 skills from skill_dictionary.py)
  2. Role categories + derived skill frequency profiles
  3. 12,196 CS/Tech job postings (batched)
  4. ~83,000 job-skill relationships
  5. Default user profile (Alex Rivera)
  6. Pre-computed market demand statistics
  7. Pre-computed learning recommendations for user 1

Usage (from project root):
    python ml/src/data/load_to_postgres.py

Requirements:
    pip install psycopg2-binary pandas python-dotenv

Environment:
    DATABASE_URL must be set in backend/.env or as an env variable.
    Example: postgresql://postgres:password@localhost:5432/career_intelligence
"""

import os
import sys
import math
import time
from pathlib import Path

import pandas as pd
import psycopg2
import psycopg2.extras

# ---------------------------------------------------------------------------
# Project root on sys.path so ml.src imports work
# ---------------------------------------------------------------------------
project_root = Path(__file__).resolve().parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# ---------------------------------------------------------------------------
# Load DATABASE_URL from backend/.env if python-dotenv is available
# ---------------------------------------------------------------------------
def _load_env():
    env_path = project_root / "backend" / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
            print(f"  [OK] Loaded env from {env_path}")
        except ImportError:
            # Manual parse fallback
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, _, value = line.partition("=")
                        os.environ.setdefault(key.strip(), value.strip())
            print(f"  [OK] Manually parsed env from {env_path}")
    else:
        print(f"  [WARN] backend/.env not found — using existing environment variables")


def get_db_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        # Fallback default for local dev
        url = "postgresql://postgres:postgres@localhost:5432/career_intelligence"
        print(f"  [WARN] DATABASE_URL not set — using default: {url}")
    return url


# ---------------------------------------------------------------------------
# Data paths
# ---------------------------------------------------------------------------
PROCESSED_DIR = project_root / "ml" / "Data" / "Processed"
SCHEMA_PATH   = project_root / "database" / "schema.sql"

CS_POSTINGS_CSV     = PROCESSED_DIR / "cs_job_postings.csv"
JOB_SKILLS_LONG_CSV = PROCESSED_DIR / "job_skills_long.csv"

BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# Connection helper
# ---------------------------------------------------------------------------
def get_connection(db_url: str):
    return psycopg2.connect(db_url)


# ---------------------------------------------------------------------------
# Step 0: Initialize Schema
# ---------------------------------------------------------------------------
def init_schema(conn, schema_path: Path):
    print(f"\n[0] Initializing schema from {schema_path.name}...")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print("  [OK] Schema initialized.")


# ---------------------------------------------------------------------------
# Step 1: Insert Skills
# ---------------------------------------------------------------------------
def insert_skills(conn) -> dict:
    """
    Inserts all canonical skills from skill_dictionary.py.
    Returns: dict mapping skill_name -> skill_id
    """
    print("\n[1] Inserting canonical skills...")
    from ml.src.features.skill_dictionary import SKILL_CATALOG

    rows = [(name, meta["category"]) for name, meta in SKILL_CATALOG.items()]

    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            "INSERT INTO skills (name, category) VALUES %s ON CONFLICT (name) DO NOTHING",
            rows,
            template="(%s, %s)"
        )
        conn.commit()

        # Build name -> id map
        cur.execute("SELECT id, name FROM skills")
        skill_map = {name: sid for sid, name in cur.fetchall()}

    print(f"  [OK] Inserted {len(rows)} skills. Total in DB: {len(skill_map)}")
    return skill_map


# ---------------------------------------------------------------------------
# Step 2: Insert Users + User Skills
# ---------------------------------------------------------------------------
def insert_user(conn, skill_map: dict):
    print("\n[2] Inserting default user profile (Alex Rivera)...")
    from ml.src.models.user_profile import get_default_sample_profile

    profile = get_default_sample_profile()
    # Strip the suffix from demo name for clean DB storage
    name = "Alex Rivera"

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (id, name) VALUES (1, %s)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
            """,
            (name,)
        )
        cur.execute("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))")

        # Target roles
        cur.execute("DELETE FROM user_target_roles WHERE user_id = 1")
        if profile.target_roles:
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO user_target_roles (user_id, role_name) VALUES %s ON CONFLICT DO NOTHING",
                [(1, role) for role in profile.target_roles],
                template="(%s, %s)"
            )

        # User skills
        cur.execute("DELETE FROM user_skills WHERE user_id = 1")
        skill_rows = []
        for skill_name, proficiency in profile.skills.items():
            sid = skill_map.get(skill_name)
            if sid is not None:
                skill_rows.append((1, sid, proficiency))
            else:
                print(f"  [WARN] Skill not in DB: {skill_name}")
        if skill_rows:
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES %s ON CONFLICT DO NOTHING",
                skill_rows,
                template="(%s, %s, %s)"
            )

        conn.commit()

    print(f"  [OK] User '{name}' inserted with {len(skill_rows)} skills and {len(profile.target_roles)} target roles.")


# ---------------------------------------------------------------------------
# Step 3: Insert Jobs (batched)
# ---------------------------------------------------------------------------
def insert_jobs(conn) -> int:
    print(f"\n[3] Importing jobs from {CS_POSTINGS_CSV.name} (batched, batch_size={BATCH_SIZE})...")

    # Read only the columns we need
    cols_needed = [
        "job_id", "title", "company_name", "company_id", "location",
        "experience_level_inferred", "formatted_work_type", "is_remote",
        "min_salary", "max_salary", "normalized_salary",
        "role_category", "listed_time"
    ]

    # Some columns may not exist if data changed — read all and pick what's there
    df = pd.read_csv(CS_POSTINGS_CSV, low_memory=False)
    available = [c for c in cols_needed if c in df.columns]
    df = df[available].copy()

    # Rename for schema
    if "experience_level_inferred" in df.columns:
        df.rename(columns={"experience_level_inferred": "experience_level"}, inplace=True)
    if "formatted_work_type" in df.columns:
        df.rename(columns={"formatted_work_type": "work_type"}, inplace=True)

    # Ensure is_remote is boolean
    if "is_remote" in df.columns:
        df["is_remote"] = df["is_remote"].fillna(0).astype(bool)
    else:
        df["is_remote"] = False

    df["job_id"] = df["job_id"].astype(int)
    total = len(df)
    inserted = 0

    with conn.cursor() as cur:
        for batch_start in range(0, total, BATCH_SIZE):
            chunk = df.iloc[batch_start : batch_start + BATCH_SIZE]
            rows = []
            for _, row in chunk.iterrows():
                rows.append((
                    int(row["job_id"]),
                    _str_or_none(row.get("title")),
                    _str_or_none(row.get("company_name")),
                    _int_or_none(row.get("company_id")),
                    _str_or_none(row.get("location")),
                    _str_or_none(row.get("experience_level")),
                    _str_or_none(row.get("work_type")),
                    bool(row.get("is_remote", False)),
                    _float_or_none(row.get("min_salary")),
                    _float_or_none(row.get("max_salary")),
                    _float_or_none(row.get("normalized_salary")),
                    _str_or_none(row.get("role_category")),
                    _int_or_none(row.get("listed_time")),
                ))

            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO jobs
                    (job_id, title, company_name, company_id, location,
                     experience_level, work_type, is_remote,
                     min_salary, max_salary, normalized_salary,
                     role_category, listed_time)
                VALUES %s
                ON CONFLICT (job_id) DO NOTHING
                """,
                rows,
                template="(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
            )
            conn.commit()
            inserted += len(rows)

            pct = (batch_start + len(chunk)) / total * 100
            print(f"  Progress: {batch_start + len(chunk):,}/{total:,} ({pct:.0f}%)", end="\r", flush=True)

    print(f"\n  [OK] Inserted {inserted:,} jobs.")
    return inserted


# ---------------------------------------------------------------------------
# Step 4: Insert Job-Skill relationships
# ---------------------------------------------------------------------------
def insert_job_skills(conn, skill_map: dict) -> int:
    print(f"\n[4] Importing job-skill relationships from {JOB_SKILLS_LONG_CSV.name}...")

    long_df = pd.read_csv(JOB_SKILLS_LONG_CSV)

    # We need job_id to exist in jobs table — get valid job_ids from DB
    with conn.cursor() as cur:
        cur.execute("SELECT job_id FROM jobs")
        valid_job_ids = set(row[0] for row in cur.fetchall())

    # Filter to skills and jobs that are in our DB
    long_df = long_df[long_df["job_id"].isin(valid_job_ids)].copy()
    long_df = long_df[long_df["skill"].isin(skill_map)].copy()

    total = len(long_df)
    inserted = 0

    with conn.cursor() as cur:
        for batch_start in range(0, total, BATCH_SIZE * 5):
            chunk = long_df.iloc[batch_start : batch_start + BATCH_SIZE * 5]
            rows = [
                (int(row["job_id"]), skill_map[row["skill"]])
                for _, row in chunk.iterrows()
                if row["skill"] in skill_map
            ]
            if rows:
                psycopg2.extras.execute_values(
                    cur,
                    "INSERT INTO job_skills (job_id, skill_id) VALUES %s ON CONFLICT DO NOTHING",
                    rows,
                    template="(%s, %s)"
                )
            conn.commit()
            inserted += len(rows)
            pct = (batch_start + len(chunk)) / total * 100
            print(f"  Progress: {batch_start + len(chunk):,}/{total:,} ({pct:.0f}%)", end="\r", flush=True)

    print(f"\n  [OK] Inserted {inserted:,} job-skill relationships.")
    return inserted


# ---------------------------------------------------------------------------
# Step 5: Insert Roles + Role Skills
# ---------------------------------------------------------------------------
def insert_roles(conn, skill_map: dict) -> int:
    print("\n[5] Deriving and inserting role profiles...")

    long_df  = pd.read_csv(JOB_SKILLS_LONG_CSV)
    posts_df = pd.read_csv(CS_POSTINGS_CSV, usecols=["job_id", "role_category"], low_memory=False)

    merged = long_df.merge(posts_df, on="job_id", how="inner")
    role_job_counts = merged.groupby("role_category")["job_id"].nunique().to_dict()
    role_skill_counts = merged.groupby(["role_category", "skill"]).size().reset_index(name="count")

    role_names = sorted(role_job_counts.keys())

    with conn.cursor() as cur:
        # Insert roles
        psycopg2.extras.execute_values(
            cur,
            "INSERT INTO roles (name) VALUES %s ON CONFLICT (name) DO NOTHING",
            [(r,) for r in role_names],
            template="(%s)"
        )
        conn.commit()

        cur.execute("SELECT id, name FROM roles")
        role_map = {name: rid for rid, name in cur.fetchall()}

        # Insert role_skills with frequency >= 0.10 filter
        role_skill_rows = []
        for _, grp in role_skill_counts.groupby("role_category"):
            role_name = grp["role_category"].iloc[0]
            total_jobs = max(role_job_counts.get(role_name, 1), 1)
            role_id    = role_map.get(role_name)
            if not role_id:
                continue
            for _, row in grp.iterrows():
                freq = row["count"] / total_jobs
                if freq >= 0.10:  # Only skills in >= 10% of role jobs
                    sid = skill_map.get(row["skill"])
                    if sid:
                        role_skill_rows.append((role_id, sid, round(freq, 4)))

        if role_skill_rows:
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO role_skills (role_id, skill_id, frequency) VALUES %s ON CONFLICT DO NOTHING",
                role_skill_rows,
                template="(%s, %s, %s)"
            )
        conn.commit()

    print(f"  [OK] Inserted {len(role_names)} roles and {len(role_skill_rows)} role-skill entries.")
    return len(role_names)


# ---------------------------------------------------------------------------
# Step 6: Compute and Insert Market Demand
# ---------------------------------------------------------------------------
def insert_market_demand(conn, skill_map: dict):
    print("\n[6] Computing and inserting market demand statistics...")

    long_df  = pd.read_csv(JOB_SKILLS_LONG_CSV)
    posts_df = pd.read_csv(CS_POSTINGS_CSV, usecols=["job_id"], low_memory=False)
    total_jobs = len(posts_df)

    skill_counts = long_df["skill"].value_counts()

    rows = []
    for skill_name, count in skill_counts.items():
        sid = skill_map.get(skill_name)
        if sid is None:
            continue
        pct = round((count / total_jobs) * 100, 2)
        rows.append((sid, int(count), float(pct)))

    with conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO market_demand (skill_id, posting_count, demand_percentage)
            VALUES %s
            ON CONFLICT (skill_id) DO UPDATE
                SET posting_count = EXCLUDED.posting_count,
                    demand_percentage = EXCLUDED.demand_percentage
            """,
            rows,
            template="(%s, %s, %s)"
        )
        conn.commit()

    print(f"  [OK] Inserted market demand stats for {len(rows)} skills. Total jobs: {total_jobs:,}")
    return total_jobs


# ---------------------------------------------------------------------------
# Step 7: Compute and Insert Recommendations for User 1
# ---------------------------------------------------------------------------
def insert_recommendations(conn, skill_map: dict, total_jobs: int):
    print("\n[7] Computing and inserting learning recommendations for user 1...")

    from ml.src.models.user_profile import get_default_sample_profile
    from ml.src.features.skill_dictionary import get_skill_category_map

    profile    = get_default_sample_profile()
    user_known = profile.get_known_skills()
    target_roles = profile.target_roles
    category_map = get_skill_category_map()

    long_df  = pd.read_csv(JOB_SKILLS_LONG_CSV)
    posts_df = pd.read_csv(CS_POSTINGS_CSV, usecols=["job_id", "role_category"], low_memory=False)

    # Overall market demand
    skill_counts_overall = long_df["skill"].value_counts().to_dict()

    # Role-targeted demand
    target_job_ids = set(
        posts_df[posts_df["role_category"].isin(target_roles)]["job_id"]
    ) or set(posts_df["job_id"])
    total_target_jobs = max(len(target_job_ids), 1)
    role_long = long_df[long_df["job_id"].isin(target_job_ids)]
    role_counts = role_long["skill"].value_counts().to_dict()

    rows = []
    for skill_name, sid in skill_map.items():
        if skill_name in user_known:
            continue  # User already has this skill

        mkt_demand_pct = round((skill_counts_overall.get(skill_name, 0) / total_jobs) * 100, 2)
        role_rel_pct   = round((role_counts.get(skill_name, 0) / total_target_jobs) * 100, 2)

        priority_score = (0.4 * (mkt_demand_pct / 100.0)) + (0.6 * (role_rel_pct / 100.0))
        priority_score = round(min(priority_score, 1.0), 4)

        if mkt_demand_pct >= 20.0 or role_rel_pct >= 20.0:
            demand_level = "High"
        elif mkt_demand_pct >= 10.0 or role_rel_pct >= 10.0:
            demand_level = "Medium"
        else:
            demand_level = "Low"

        explanation = (
            f"Appears in {role_rel_pct}% of postings for your target roles "
            f"({', '.join(target_roles[:2])}) and {mkt_demand_pct}% of total CS market jobs."
        )

        rows.append((
            1,             # user_id
            sid,           # skill_id
            priority_score,
            demand_level,
            role_rel_pct,
            mkt_demand_pct,
            explanation
        ))

    # Sort by priority descending for clarity (order stored doesn't matter — sorted in query)
    rows.sort(key=lambda r: r[2], reverse=True)

    with conn.cursor() as cur:
        cur.execute("DELETE FROM recommendations WHERE user_id = 1")
        if rows:
            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO recommendations
                    (user_id, skill_id, priority_score, demand_level,
                     role_relevance_pct, market_demand_pct, explanation)
                VALUES %s
                """,
                rows,
                template="(%s,%s,%s,%s,%s,%s,%s)"
            )
        conn.commit()

    print(f"  [OK] Inserted {len(rows)} recommendations for user 1.")
    print(f"  Top 3 recommendations:")
    for r in rows[:3]:
        print(f"    - Skill ID {r[1]} | Priority: {r[2]} | Level: {r[3]}")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _str_or_none(val) -> str | None:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    s = str(val).strip()
    return s if s else None


def _float_or_none(val) -> float | None:
    try:
        f = float(val)
        return None if math.isnan(f) else round(f, 2)
    except (TypeError, ValueError):
        return None


def _int_or_none(val) -> int | None:
    try:
        f = float(val)
        if math.isnan(f):
            return None
        return int(f)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 70)
    print("CAREER INTELLIGENCE ENGINE — Day 4 PostgreSQL Import")
    print("=" * 70)

    _load_env()
    db_url = get_db_url()

    print(f"\nConnecting to database...")
    conn = get_connection(db_url)
    print("  [OK] Connected.")

    t0 = time.time()

    try:
        init_schema(conn, SCHEMA_PATH)
        skill_map   = insert_skills(conn)
        insert_user(conn, skill_map)
        insert_jobs(conn)
        insert_job_skills(conn, skill_map)
        insert_roles(conn, skill_map)
        total_jobs  = insert_market_demand(conn, skill_map)
        insert_recommendations(conn, skill_map, total_jobs)

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] Import failed: {e}")
        raise
    finally:
        conn.close()

    elapsed = time.time() - t0
    print("\n" + "=" * 70)
    print(f"Import completed in {elapsed:.1f} seconds.")
    print("=" * 70)


if __name__ == "__main__":
    main()
