# Day 4: Backend Architecture & REST API Documentation

## Overview

The backend for the **Career Intelligence Engine** is built using **Node.js** and **Express**, with a **PostgreSQL** relational database. It exposes clean REST API endpoints for consuming career intelligence results (job postings, skills, user skill profile, market demand, role matching, job matching, and learning priority recommendations).

---

## Architecture & Data Flow

```
React (Frontend — Day 5)
   ↓
REST API (JSON)
   ↓
Express App (App / Routes / Controllers)
   ↓
Service Layer (Business Logic & IDF Matcher)
   ↓
PostgreSQL Database
   ↓
Career Intelligence Data & Pre-computed ML Results
```

- **Layered Structure**: Separation of concerns between Routes → Controllers → Services → DB Access.
- **Dynamic Matching**: `POST /api/match` dynamically computes IDF-weighted match scores in the Service layer using database values.
- **Offline ML Pre-computation**: Overall market skill demand and user learning recommendations are computed offline via `ml/src/data/load_to_postgres.py` and stored in PostgreSQL for fast API retrieval.

---

## Database Schema

The database consists of 10 relational tables:

1. **`skills`**: `id`, `name` (unique canonical skill), `category`.
2. **`users`**: `id`, `name`, `created_at`.
3. **`user_skills`**: `(user_id, skill_id)` composite primary key, `proficiency` (0–4 scale).
4. **`user_target_roles`**: `(user_id, role_name)` target career domains.
5. **`jobs`**: `id`, `job_id` (LinkedIn identifier), `title`, `company_name`, `location`, `experience_level`, `work_type`, `is_remote`, `min_salary`, `max_salary`, `normalized_salary`, `role_category`, `listed_time`.
6. **`job_skills`**: `(job_id, skill_id)` many-to-many lookup table.
7. **`roles`**: `id`, `name` (6 primary CS role domains).
8. **`role_skills`**: `(role_id, skill_id)`, `frequency` (fraction of postings requiring skill).
9. **`market_demand`**: `id`, `skill_id`, `posting_count`, `demand_percentage`.
10. **`recommendations`**: `id`, `user_id`, `skill_id`, `priority_score`, `demand_level`, `role_relevance_pct`, `market_demand_pct`, `explanation`.

---

## API Endpoints

### 1. Jobs API
- **`GET /api/jobs`**: List and filter job postings.
  - *Query Parameters*: `role`, `location`, `skill`, `experience`, `remote` (`true`/`false`), `limit` (default 50), `offset` (default 0).
- **`GET /api/jobs/:id`**: Retrieve single job details by LinkedIn `job_id`, including associated skills.

### 2. Skills API
- **`GET /api/skills`**: Retrieve all canonical skills grouped by domain category.
- **`GET /api/skills/:id`**: Retrieve skill details by ID.

### 3. Market API
- **`GET /api/market/skills`**: Overall skill demand statistics across all CS job postings.
- **`GET /api/market/roles`**: Skill demand statistics broken down per role category.

### 4. Roles API
- **`GET /api/roles`**: List all CS role categories with top required skills.
- **`GET /api/roles/:id`**: Retrieve specific role category details.

### 5. Profile API
- **`GET /api/profile`**: Retrieve user profile (skills and target roles).
- **`PUT /api/profile`**: Update user profile name, skill proficiencies, or target roles.

### 6. Job Match API
- **`POST /api/match`**: Calculate IDF-weighted match score and skill gaps between candidate profile and a specific `jobId`.
  - *Request Body*: `{ "jobId": 175485704 }`

### 7. Recommendations API
- **`GET /api/recommendations`**: Retrieve candidate's top learning priority recommendations.

---

## Request & Response Examples

### Job Match (`POST /api/match`)

**Request**:
```json
POST /api/match
Content-Type: application/json

{
  "jobId": 175485704
}
```

**Response**:
```json
{
  "jobId": 175485704,
  "title": "Software Engineer",
  "company": "GOYT",
  "matchScore": 0.3904,
  "matchedSkills": [
    "HTML/CSS",
    "JavaScript"
  ],
  "missingSkills": [
    "MySQL",
    "PHP"
  ],
  "matchedSkillCount": 2,
  "missingSkillCount": 2
}
```

### Learning Recommendations (`GET /api/recommendations`)

**Response**:
```json
{
  "count": 10,
  "recommendations": [
    {
      "skill": "Java",
      "category": "Programming Languages",
      "priority": 0.2078,
      "demandLevel": "High",
      "roleRelevancePct": 24.22,
      "marketDemandPct": 15.61,
      "reason": "Appears in 24.22% of postings for your target roles (Software Engineering, Data & AI) and 15.61% of total CS market jobs."
    },
    {
      "skill": "AWS",
      "category": "Cloud & DevOps",
      "priority": 0.2061,
      "demandLevel": "High",
      "roleRelevancePct": 21.8,
      "marketDemandPct": 18.83,
      "reason": "Appears in 21.8% of postings for your target roles (Software Engineering, Data & AI) and 18.83% of total CS market jobs."
    }
  ]
}
```

---

## Error Handling

Errors are returned in a uniform JSON format with standard HTTP status codes:
- **`400 Bad Request`**: Validation failures (e.g. invalid jobId, invalid proficiency range).
- **`404 Not Found`**: Non-existent resource (e.g. invalid job ID or route).
- **`500 Internal Server Error`**: Database or internal server failures.

```json
{
  "error": "Job not found."
}
```

---

## Environment Variables

Configured in `backend/.env`:
```ini
DATABASE_URL=postgresql://postgres:123@localhost:5432/career_intelligence
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## How to Run Locally & Test

1. **Initialize Database & Load Data**:
   ```bash
   python ml/src/data/load_to_postgres.py
   ```
2. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Run Backend Test Suite**:
   ```bash
   cd backend
   npm test
   ```
