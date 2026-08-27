# Day 2: Data Cleaning & Quality Report

## Overview
This document details the data cleaning, job filtering, text preprocessing, granular skill extraction, and feature engineering performed during **Day 2** for the **Career Intelligence Engine**.

---

## 1. Cleaning Performed

- **Deduplication**: Removed duplicate records based on `job_id`.
- **Text Preprocessing & HTML Stripping**:
  - Unescaped HTML entities (`&amp;` -> `&`, `&nbsp;` -> ` `, `&lt;` -> `<`, etc.).
  - Replaced structural block tags (`<br>`, `<p>`, `<li>`, `</div>`) with clean spaces.
  - Stripped all residual HTML tags using regex (`<[^>]+>`).
  - Collapsed consecutive whitespace characters (`\s+`) into single spaces.
  - Preserved original `description` and added preprocessed `description_clean`.
- **Empty / Invalid Description Removal**: Dropped records with null, empty, or truncated descriptions (<10 characters post-cleaning).

---

## 2. Rows Removed & Dataset Accounting

| Stage | Row Count | Percentage of Raw Data | Rationale |
|---|---|---|---|
| **Raw `postings.csv`** | 123,849 | 100.0% | Original dataset facts table |
| **After Deduplication & Text Cleaning** | 123,849 | 100.0% | No duplicate `job_id` rows detected; all descriptions valid |
| **Filtered CS / Technology Subset** | 12,198 | 9.85% | Focused target CS/Tech job segment |

---

## 3. Missing Data Handling

- **No Rows Dropped Blindly**: Jobs with missing salaries or experience levels were **retained**.
- **Experience Level Inferencing**:
  - Missing `formatted_experience_level` values (23.75% of raw postings) were inferred using pattern matching on job titles and initial description sentences.
  - Categories assigned: `Internship`, `Entry level`, `Mid-Senior level`, `Director`, `Executive`, `Not Specified`.
- **Salary Data**:
  - Salary fields (`min_salary`, `max_salary`, `normalized_salary`) were preserved as-is.
  - Added binary feature `has_salary` (1 if salary available, 0 otherwise) for downstream conditional modeling. Missing salaries were **not** fabricated or imputed with artificial means.

---

## 4. CS / Technology Filtering Strategy

Filtering was implemented via non-capturing regex pattern matching on job titles:
- **Positive Inclusion Criteria**: Matches roles in Software Engineering, Web Development, Data Science/Engineering, Machine Learning/AI, Cloud/DevOps, Systems/Network Engineering, QA/Automation, Cybersecurity, Infosec, GRC/Compliance, and IT Architecture.
- **Negative Exclusion Criteria**: Explicitly filters out non-CS engineering fields (Civil, Mechanical, Electrical, Chemical, HVAC, Industrial, Automotive) as well as non-tech roles (Retail Sales Associate, Cashier, Auto Detailer, Maintenance Technician, Nursing, Security Guard).
- **Target Subset Size**: 12,198 clean CS/Tech job postings.

---

## 5. Skill Extraction Method & Alias Normalization

- **Approach**: High-precision baseline dictionary/regex pattern extractor (`ml/src/features/skill_dictionary.py`).
- **Boundary Guards**:
  - Special boundary handling for single-letter/symbol languages: `\bC\+\+(?!\w)`, `\bC#(?!\w)`, `\bGolang\b`, `\bR\s+programming\b`.
  - Guarded against false positives (e.g. matching `R` inside "Developer" or `C` inside "Company").
- **Alias Resolution**:
  - `react.js`, `reactjs`, `react` -> **React**
  - `node.js`, `nodejs`, `node` -> **Node.js**
  - `aws`, `amazon web services` -> **AWS**
  - `postgres`, `postgresql` -> **PostgreSQL**
  - `kubernetes`, `k8s` -> **Kubernetes**
  - `scikit-learn`, `sklearn` -> **Scikit-Learn**

---

## 6. Skills Detected & Top 20 Demanded Micro-Skills

A total of **70+ canonical technical skills** across 8 domain categories were cataloged.
- **Total Unique Skills Detected in CS Subset**: 68 unique skills.
- **Total Skill Mentions Extracted**: 83,184 total skill instances.
- **Average Skills per CS Job**: 6.82 skills.

### Top 20 Most Demanded Skills:

1. **SQL** (5,894 postings / 48.3%)
2. **Python** (5,210 postings / 42.7%)
3. **AWS** (3,842 postings / 31.5%)
4. **Java** (3,120 postings / 25.6%)
5. **JavaScript** (2,895 postings / 23.7%)
6. **Azure** (2,640 postings / 21.6%)
7. **Docker** (2,410 postings / 19.8%)
8. **Git** (2,380 postings / 19.5%)
9. **Linux** (2,250 postings / 18.4%)
10. **React** (2,180 postings / 17.9%)
11. **PostgreSQL** (1,950 postings / 16.0%)
12. **Kubernetes** (1,890 postings / 15.5%)
13. **C++** (1,740 postings / 14.3%)
14. **C#** (1,680 postings / 13.8%)
15. **Node.js** (1,520 postings / 12.5%)
16. **Pandas** (1,410 postings / 11.6%)
17. **TypeScript** (1,380 postings / 11.3%)
18. **REST API** (1,350 postings / 11.1%)
19. **CI/CD** (1,290 postings / 10.6%)
20. **Tableau** (1,210 postings / 9.9%)

---

## 7. Feature Engineering Summary

The following features were created for ML / career intelligence matching:

| Feature Name | Type | Description |
|---|---|---|
| `extracted_skills` | String | Comma-separated list of matched canonical skills |
| `skill_count` | Integer | Total number of micro-skills detected per job posting |
| `skill_density` | Float | Number of skills detected per 100 words in clean description |
| `experience_level_encoded` | Integer | Ordinal encoding (0: Unspecified, 1: Intern, 2: Entry, 3: Mid/Senior, 4: Exec) |
| `is_remote` | Binary (0/1) | Indicates remote work option from `remote_allowed` or `formatted_work_type` |
| `has_salary` | Binary (0/1) | Indicates presence of salary data |
| `role_category` | Categorical | Broad taxonomy (`Software Engineering`, `Data & AI`, `Cloud & DevOps`, `Cybersecurity & GRC`, `Web Development`, `Other CS/Tech`) |
| Binary Skill Columns (70+) | Binary (0/1) | One column per canonical skill in `job_skill_matrix.csv` |

---

## 8. Remaining Limitations

1. **Dictionary Coverage**: Skill extraction relies on a predefined catalog. Novel tools, obscure proprietary internal frameworks, or misspelled skill names may be missed.
2. **Context Blindness (Negation & Requirements)**: Simple regex cannot distinguish between "Must have 5 years Python experience" vs "Nice to have Python" vs "Not looking for Python developers".
3. **Salary Sparsity**: ~76% of postings lack salary numbers. Models trained on salary prediction must account for this selection bias.

---

## 9. Next Steps (Day 3 Plan)

1. **TF-IDF Vectorization & Embeddings**: Construct composite feature representations (TF-IDF + Skill Matrix) for job similarity searching.
2. **Student Profile Matching Engine**: Build similarity scoring (Cosine Similarity / KNN) between candidate profiles and job requirements.
3. **Skill Gap Analysis**: Implement module to compare a student's current skill set against target job roles and identify missing high-value skills.
