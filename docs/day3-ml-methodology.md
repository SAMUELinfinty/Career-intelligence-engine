 Core Career Intelligence Engine — ML & Recommendation Methodology

## Overview
This document details the mathematical formulation, system architecture, matching logic, skill weighting strategy, learning priority recommendation heuristic, machine learning experiments, evaluation metrics, and practical trade-offs implemented during **Day 3** for the **Career Intelligence Engine**.

---

## 1. Problem Definition

The core objective of the Career Intelligence Engine is to answer five essential candidate questions:
1. **Match Score**: How well does a candidate's skill profile match a specific job posting?
2. **Skill Inventory**: Which required skills does the candidate currently possess?
3. **Skill Gap Analysis**: Which high-value skills is the candidate missing for target roles?
4. **Job Ranking**: What are the top matching job postings available in the market?
5. **Learning Priorities**: Which single next skill should the candidate learn to maximize career advancement?

---

## 2. User Profile Representation

Candidates are represented via a structured JSON / Python object (`UserProfile`) avoiding unnecessary early user-management or authentication overhead:

```json
{
    "candidate_name": "Alex Rivera",
    "target_roles": ["Software Engineering", "Data & AI", "Web Development"],
    "skills": {
        "Python": 4,
        "SQL": 4,
        "Git": 3,
        "JavaScript": 3,
        "React": 2,
        "PostgreSQL": 3,
        "HTML/CSS": 3,
        "Docker": 1,
        "AWS": 0,
        "Kubernetes": 0,
        "Linux": 2,
        "REST API": 3
    }
}
```

### Proficiency Scale (0–4):
- **0 (None)**: No experience or skill absent.
- **1 (Beginner)**: Familiar with basic syntax and core concepts.
- **2 (Intermediate)**: Can build working applications and write queries.
- **3 (Advanced)**: Proficient in production engineering and best practices.
- **4 (Expert)**: Deep domain mastery and architectural design.

---

## 3. Job Representation

Each job posting $j$ is represented in two complementary ways:
1. **Binary Skill Vector**: $\mathbf{x}_j \in \{0, 1\}^M$ where $M = 83$ canonical technical micro-skills.
2. **Text Corpus & TF-IDF Vector**: Concatenation of job title, cleaned description (`description_clean`), and extracted canonical skills vectorized via TF-IDF into $\mathbf{v}_j \in \mathbb{R}^V$ ($V = 1000$ max features).

---

## 4. Baseline Matching Method & Skill Weighting

### Mathematical Formulation:
To prevent ubiquitous basic skills (e.g. HTML/CSS or Git) from dominating match scores over rare specialized requirements, we implement **Inverse Document Frequency (IDF) Skill Weighting**:

$$IDF(s) = \ln\left(\frac{N + 1}{DF(s) + 1}\right) + 1.0$$

Where $N = 12,196$ total CS postings and $DF(s)$ is the document frequency of skill $s$.

The **IDF-Weighted Match Score** for job $j$ given candidate user skills $U$ is:

$$\text{Match Score}(U, j) = \frac{\sum_{s \in U \cap J_j} IDF(s)}{\sum_{s \in J_j} IDF(s)}$$

Where $J_j$ is the set of required skills for job $j$.

### Output Properties:
- **Range**: $[0.00, 1.00]$ (0.0% to 100.0%).
- **Deterministic**: Guarantees consistent job rankings.
- **Interpretable**: Returns explicit lists of `matched_skills` and `missing_skills`.

---

## 5. Role Matching

The dataset's 12,196 CS postings were grouped into 6 primary role categories. For each role category $R$, the skill frequency profile $P_R(s)$ was derived directly from dataset occurrences:

$$P_R(s) = \frac{\text{Count}(s, R)}{N_R}$$

A candidate profile is matched against each target role domain by scoring user skills against the important skills ($\ge 10\%$ frequency) of that role:

$$\text{Role Match Score}(U, R) = \frac{\sum_{s \in U \cap P_R} P_R(s)}{\sum_{s \in P_R} P_R(s)}$$

### Real Dataset Role Matches (Sample Profile):
- **Web Development**: **58.3%**
- **Software Engineering**: **49.9%**
- **Other CS/Tech**: **39.0%**
- **Data & AI**: **36.3%**
- **Cloud & DevOps**: **29.5%**
- **Cybersecurity & GRC**: **12.1%**

---

## 6. Learning Priority Recommendation Heuristic

Rather than using opaque machine learning for recommendations, we implement a transparent, defensible **Learning Priority Score**:

$$\text{Priority Score}(s) = G(s) \times \left[ 0.4 \times \frac{\text{MarketDemand}(s)}{100} + 0.6 \times \frac{\text{RoleRelevance}(s)}{100} \right]$$

Where:
- $G(s) = 1$ if skill $s$ is missing from candidate profile ($prof < 1$), else $0$.
- $\text{MarketDemand}(s)$ = Percentage of total dataset postings requesting skill $s$.
- $\text{RoleRelevance}(s)$ = Percentage of candidate target role postings requesting skill $s$.

### Sample Top Recommendations Produced:
1. **Java** (Priority: **0.2078** | Demand: High | Role Rel: 24.22%)
   *Reason*: Appears in 24.22% of target role postings (Software Engineering, Data & AI) and 15.61% of total market postings.
2. **AWS** (Priority: **0.2061** | Demand: High | Role Rel: 21.80%)
   *Reason*: Appears in 21.80% of target role postings and 18.83% of total market postings.
3. **Azure** (Priority: **0.1660** | Demand: Medium | Role Rel: 16.64%)

---

## 7. Machine Learning Experiments

Two ML techniques were implemented and evaluated:
1. **TF-IDF + Cosine Similarity**:
   - Vectorized full job text and user profile string using scikit-learn `TfidfVectorizer(max_features=1000)`.
   - Computed Cosine Similarity score $S_{\text{TF-IDF}} = \frac{\mathbf{u} \cdot \mathbf{v}_j}{\|\mathbf{u}\| \|\mathbf{v}_j\|}$.
2. **K-Means Skill Clustering**:
   - Fitted $K=5$ clusters on `job_skill_matrix.csv` to group job roles by skill co-occurrences.
   - Models persisted under `ml/models/trained_models/` (`tfidf_vectorizer.joblib`, `kmeans_skill_clusters.joblib`).

---

## 8. Baseline vs. Machine Learning Evaluation

| Metric / Dimension | Baseline Skill Overlap Matcher | ML (TF-IDF Cosine Similarity) |
|---|---|---|
| **Execution Speed** | 540.74 ms (12,196 jobs) | **37.83 ms** (12,196 jobs) |
| **Interpretability** | **100% Transparent** (exact matched vs missing breakdown) | Opaque similarity float |
| **Skill Gap Derivation** | **Direct & Exact** | Indirect / Requires secondary lookup |
| **Semantic Context** | Exact keyword matching | **Captures natural language context** |
| **Hallucination Risk** | **0%** | Low/Medium (unexplainable scores) |
| **Ranking Overlap@20** | Reference | 15.0% |

### Strategic Recommendation:
Use **Baseline IDF-Weighted Matching** as the primary engine for candidate skill gap analysis and user-facing dashboards. Use **TF-IDF Cosine Similarity** as an optional semantic re-ranking layer.

---

## 9. Limitations & Future Work

1. **No Ground-Truth Fit Labels**: LinkedIn job postings dataset lacks candidate hire outcome labels; evaluation relies on rank correlation and top-K overlap metrics.
2. **Static Proficiency Weights**: User skill ratings rely on self-assessment (0-4 scale).
3. **Future (Day 4+)**: Connect core Python engine to PostgreSQL schema and expose REST API endpoints via Node.js/Express.
