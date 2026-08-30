# Career Intelligence Engine

> A practical data-driven portfolio application analyzing technology job postings and user skill profiles to answer core career questions:
> 1. Which jobs are a good match for me?
> 2. Which career roles fit my current skills?
> 3. Why does a job match me?
> 4. What skills am I missing?
> 5. What skills should I learn next?

---

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │   React (Vite) Frontend   │
                          │        (Port 3000)        │
                          └─────────────┬─────────────┘
                                        │ REST API (JSON)
                                        ▼
                          ┌───────────────────────────┐
                          │   Node.js + Express API   │
                          │        (Port 3001)        │
                          └─────────────┬─────────────┘
                                        │ SQL Queries
                                        ▼
                          ┌───────────────────────────┐
                          │    PostgreSQL Database    │
                          │   (career_intelligence)   │
                          └─────────────▲─────────────┘
                                        │ Load pre-computed ML
                          ┌─────────────┴─────────────┐
                          │ Python / Pandas / SciKit  │
                          │    Matching & ML Pipeline │
                          └───────────────────────────┘
```

---

## Features

- **Career Intelligence Dashboard**: High-level market overview, target role alignment, top job matches, and market skill demand charts.
- **Job Discovery & Filtering**: Search tech jobs by role category, skill keywords, location, experience level, or remote status.
- **Dynamic IDF Match Engine**: Computes Inverse Document Frequency (IDF)-weighted skill compatibility between candidate profile and specific job postings (`POST /api/match`).
- **Skill Gap Analysis**: Visual breakdown of matched skills (✓) vs missing skills (✗).
- **Prioritized Learning Recommendations**: Ranks missing skills using market demand percentage and target role relevance (`GET /api/recommendations`).
- **User Profile Management**: View and update candidate name, skill proficiencies (0–4 scale), and target career role domains (`PUT /api/profile`).

---

## Project Structure

```
career-intelligence-engine/
├── backend/                # Node.js + Express REST API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic & IDF match computation
│   │   ├── db/             # PostgreSQL connection pool
│   │   └── app.js          # Express app entry
│   └── tests/              # Jest API test suite (23 passing tests)
│
├── frontend/               # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/     # JobCard, MatchScore, SkillGap, RecommendationCard, SkillChart, Navbar
│   │   ├── pages/          # Dashboard, Jobs, JobDetails, Profile, Recommendations
│   │   ├── services/       # Centralized api.js REST client
│   │   └── __tests__/      # Vitest unit test suite (12 passing tests)
│   └── index.css           # Custom slate dark mode design system
│
├── database/               # PostgreSQL relational schema & migrations
│   ├── schema.sql          # 10 relational tables
│   └── seed.sql            # Core seed data
│
├── ml/                     # Python data cleaning, skill extraction & pre-computation
│   └── src/
│       └── data/           # PostgreSQL loading scripts
│
└── docs/                   # Day-by-day implementation documentation
    ├── day1-data-audit.md
    ├── day2-data-quality.md
    ├── day3-ml-methodology.md
    ├── day4-backend.md
    └── day5-frontend.md
```

---

## How to Run

### 1. Database Setup
Ensure PostgreSQL is running and initialize the database schema and pre-computed data:
```bash
python ml/src/data/load_to_postgres.py
```

### 2. Backend REST API
```bash
cd backend
npm install
npm run dev
```
The Express API will be live at `http://localhost:3001`.

Run backend tests:
```bash
npm test
```

### 3. Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:3000`.

Run frontend unit tests:
```bash
npm test
```

Build production bundle:
```bash
npm run build
```

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Lucide React, Vitest, React Testing Library.
- **Backend**: Node.js, Express, `pg` (PostgreSQL client), Jest, Supertest.
- **Database**: PostgreSQL relational database.
- **Data / ML**: Python, Pandas, NumPy, scikit-learn.
