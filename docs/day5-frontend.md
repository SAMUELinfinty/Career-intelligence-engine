# Day 5 — Frontend Architecture & UI Documentation

## Overview

The Day 5 React frontend for the **Career Intelligence Engine** provides a modern, responsive, data-dense web application for analyzing job posting alignment, missing skill gaps, market demand, and prioritized learning recommendations.

The application connects to the **Express + Node.js + PostgreSQL** backend API.

---

## Frontend Architecture

```
React (18) + Vite
   │
   ├── App.jsx (React Router v6 Layout & Routes)
   │     ├── Navbar (Sticky Top Navigation & Mobile Drawer)
   │     ├── Pages (Dashboard, Jobs, JobDetails, Profile, Recommendations)
   │     └── Footer
   │
   ├── Services Layer
   │     └── api.js (Centralized REST fetch client for Express API)
   │
   └── Components System
         ├── JobCard (Reusable Job Snippet)
         ├── MatchScore (Visual IDF Match Gauge & Interpretation)
         ├── SkillGap (Matched ✓ vs Missing ✗ Breakdown)
         ├── RecommendationCard (Priority Skill Learning Highlights)
         └── SkillChart (Accessible CSS Bar Chart for Market Demand)
```

---

## Pages

1. **Dashboard (`/`)**:
   - Market metrics overview (User skills, target roles, market skills tracked, active postings).
   - High-priority learning recommendation hero card.
   - Top Job Matches preview cards with automated match scores.
   - Market skill demand horizontal bar chart.
   - Target role skill frequency breakdown.

2. **Job Discovery (`/jobs`)**:
   - Search & multi-parameter filter bar (Role Category, Skill Keyword, Location, Experience Level, Remote status).
   - Responsive grid of `JobCard` instances displaying salary, location, required skills, and IDF match percentage.
   - Skeleton loading, error retry states, and empty filter result handlers.

3. **Job Details & Match Analysis (`/jobs/:id`)**:
   - Complete job posting metadata display (Company, Location, Remote status, Salary range, Experience level, full required skills list).
   - **Analyze Match** trigger calling `POST /api/match`.
   - `MatchScore` visual ring & threshold interpretation ("Strong Match", "Moderate Match", "Low Match").
   - `SkillGap` displaying Matched skills (✓ green badges) and Missing skills (✗ red badges).
   - Direct CTA banner to Recommendations ("What Should I Learn Next?").

4. **User Profile (`/profile`)**:
   - Candidate full name editing.
   - Target career role domain checkboxes (`Software Engineering`, `Data & AI`, `Cloud & DevOps`, `Cybersecurity`, `GRC`, `Web Development`).
   - Technical skill proficiencies list with interactive range sliders (1 = Beginner, 2 = Intermediate, 3 = Advanced, 4 = Expert).
   - Add new skills dropdown from canonical database skills list.
   - Saves profile state to database via `PUT /api/profile`.

5. **Learning Recommendations (`/recommendations`)**:
   - Screen answering "What should I learn next?".
   - Category filtering pills (`Cloud & DevOps`, `Programming Languages`, `Data & Analytics`, etc.).
   - `RecommendationCard` instances displaying priority level (🔥 High / Medium / Low), Market Demand %, Target Role Relevance %, and reasoning explanation.

---

## Components

- **`Navbar`**: Responsive top navigation header with active tab indicators and mobile drawer navigation.
- **`JobCard`**: Scannable job snippet card showing title, company, location, remote tag, salary, top 5 skill badges, match score, and CTA link.
- **`MatchScore`**: Visual match score ring, percentage calculation, threshold interpretation rating, and progress meter.
- **`SkillGap`**: Visual breakdown of matched skills vs missing skills with count badges.
- **`RecommendationCard`**: Priority learning recommendation card with market demand %, role relevance %, reason box, and action link.
- **`SkillChart`**: Accessible CSS horizontal bar chart for visualizing market skill demand percentages and posting counts.

---

## API Integration

All backend communications are centralized in `frontend/src/services/api.js`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/jobs` | Retrieve paginated/filtered list of jobs |
| `GET` | `/api/jobs/:id` | Retrieve single job by ID |
| `GET` | `/api/skills` | List all canonical database skills |
| `GET` | `/api/market/skills` | Retrieve overall market skill demand stats |
| `GET` | `/api/market/roles` | Retrieve skill demand broken down by role |
| `GET` | `/api/roles` | List CS role categories with top skills |
| `GET` | `/api/profile` | Retrieve user profile (skills + target roles) |
| `PUT` | `/api/profile` | Update user profile (name, skills, target roles) |
| `POST` | `/api/match` | Calculate IDF-weighted match score & skill gaps |
| `GET` | `/api/recommendations` | Retrieve top learning priority recommendations |

---

## State Management

- **Local & Component State**: React `useState` and `useEffect` for page-level data fetching, filter parameters, loading states, and error handling.
- **URL Query State**: `useSearchParams` in `Jobs` page for persistent sharing of search filters via URL params.
- **No Over-engineering**: No Redux or complex global stores required for this single-user MVP architecture.

---

## UI & Design Aesthetics

- **Theme**: Dark slate palette (`#090d16` background, `#111827` surface, `#161e2e` cards).
- **Accents**: Primary indigo (`#6366f1`), Emerald success (`#10b981`), Amber warning (`#f59e0b`), Rose alert (`#f43f5e`), Cyan highlight (`#06b6d4`).
- **Typography**: Google Inter font family with crisp hierarchies and data legibility.
- **Micro-interactions**: Subtle hover elevations, ring gauge transitions, and pulse animations.

---

## Responsive Design

- Mobile-first CSS Grid and Flexbox layouts.
- Breakpoints:
  - Mobile: `< 640px` (single column layout, drawer menu).
  - Tablet: `640px – 1024px` (2-column grids).
  - Desktop: `> 1024px` (3/4-column grids and multi-pane dashboard).

---

## Error & Empty States

- **Loading**: Pulse skeletons and loading banners prevent blank screens.
- **Error Handling**: Graceful error alert banners with explicit **Retry** triggers.
- **Empty States**: Helpful messages encouraging users to adjust filters when zero results match.

---

## How to Run

1. **Ensure Backend is Running**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

3. **Run Frontend Tests**:
   ```bash
   cd frontend
   npm test
   ```

4. **Build Production Bundle**:
   ```bash
   cd frontend
   npm run build
   ```
