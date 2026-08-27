"""
run_day3_pipeline.py
Main Day 3 execution runner for Career Intelligence Engine.
Executes User Profile Matching, Skill Weighting, Role Matching, Job Ranking,
Skill Gap Analysis, Learning Priority Engine, ML TF-IDF Matching, K-Means Clustering,
and Baseline vs ML Evaluation.
"""

import os
import sys
import time
import joblib
from pathlib import Path
import pandas as pd

# Ensure project root is in sys.path
project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from ml.src.data.load_data import get_processed_data_dir, get_project_root
from ml.src.models.user_profile import get_default_sample_profile, UserProfile
from ml.src.models.matching import (
    BaselineMatcher,
    RoleMatcher,
    TFIDFSimilarityMatcher,
    train_kmeans_skill_clusters,
)
from ml.src.models.recommendation import (
    MarketDemandAnalyzer,
    LearningPriorityEngine,
)
from ml.src.evaluation.evaluate import evaluate_baseline_vs_ml


def get_trained_models_dir() -> Path:
    """Returns path to ml/models/trained_models directory."""
    root = get_project_root()
    models_dir = root / "ml" / "models" / "trained_models"
    models_dir.mkdir(parents=True, exist_ok=True)
    return models_dir


def main():
    print("=" * 70, flush=True)
    print("CAREER INTELLIGENCE ENGINE — DAY 3 CORE INTELLIGENCE PIPELINE", flush=True)
    print("=" * 70, flush=True)
    
    start_time = time.time()
    
    # 1. Load Processed Datasets
    print("\n[1/8] Loading Day 2 processed datasets...", flush=True)
    processed_dir = get_processed_data_dir()
    cs_df = pd.read_csv(processed_dir / "cs_job_postings.csv")
    matrix_df = pd.read_csv(processed_dir / "job_skill_matrix.csv")
    long_df = pd.read_csv(processed_dir / "job_skills_long.csv")
    
    print(f"  [OK] Loaded CS Job Postings: {len(cs_df):,} rows", flush=True)
    print(f"  [OK] Loaded Job Skill Matrix: {matrix_df.shape}", flush=True)
    print(f"  [OK] Loaded Long Skill Records: {len(long_df):,} rows", flush=True)
    
    # 2. Instantiate User Profile
    print("\n[2/8] Loading Candidate User Profile...", flush=True)
    profile = get_default_sample_profile()
    user_json_path = processed_dir / "sample_user_profile.json"
    profile.save_to_json(user_json_path)
    
    print(f"  Candidate Name: {profile.candidate_name}", flush=True)
    print(f"  Target Roles:   {', '.join(profile.target_roles)}", flush=True)
    print(f"  Known Skills:   {', '.join(sorted(profile.get_known_skills()))}", flush=True)
    
    # 3. Baseline Skill Matching & Job Ranking
    print("\n[3/8] Running Baseline Skill Overlap Matching & Job Ranking...", flush=True)
    baseline_matcher = BaselineMatcher(matrix_df, cs_df, use_idf_weights=True)
    top_jobs = baseline_matcher.rank_jobs(profile, top_n=10)
    
    print("\nTOP 5 MATCHED JOBS (IDF-Weighted Baseline Matcher):", flush=True)
    for idx, (_, row) in enumerate(top_jobs.head(5).iterrows(), 1):
        pct = round(row["match_score"] * 100, 1)
        print(f"  {idx:2d}. {row['title']:<35} | Company: {row['company_name']:<20} | Match: {pct}%", flush=True)
        print(f"      Matched Skills: {row['matched_skills']}", flush=True)
        print(f"      Missing Skills: {row['missing_skills']}\n", flush=True)
        
    # 4. Role-Level Matching
    print("[4/8] Running Role-Level Matching against derived dataset role profiles...", flush=True)
    role_matcher = RoleMatcher(cs_df, long_df)
    role_matches = role_matcher.match_user_to_roles(profile)
    print("\nROLE MATCHING RESULTS:", flush=True)
    for _, row in role_matches.iterrows():
        print(f"  * {row['role_category']:<25} Match: {row['role_match_percentage']:<8} (Top Skills: {row['top_role_skills']})", flush=True)
        
    # 5. Market Demand & Skill Gap Analysis
    print("\n[5/8] Analyzing Market Skill Demand & Skill Gaps...", flush=True)
    market_analyzer = MarketDemandAnalyzer(cs_df, long_df)
    demand_df = market_analyzer.get_overall_skill_demand()
    
    print("\nTOP 10 MARKET DEMAND SKILLS OVERALL:", flush=True)
    for _, row in demand_df.head(10).iterrows():
        print(f"  * {row['skill']:<20} Category: {row['category']:<22} Demand: {row['demand_percentage']}%", flush=True)
        
    # 6. Learning Priority Recommendation Engine
    print("\n[6/8] Running Learning Priority Recommendation Engine...", flush=True)
    rec_engine = LearningPriorityEngine(cs_df, long_df)
    rec_df, top_rec = rec_engine.recommend_next_skills(profile, top_n=5)
    
    print("\nRECOMMENDED SKILLS TO LEARN (Ranked by Priority Score):", flush=True)
    for idx, (_, row) in enumerate(rec_df.iterrows(), 1):
        print(f"  {idx:2d}. {row['skill']:<18} | Priority: {row['priority_score']:<6} | Level: {row['demand_level']:<6} | Target Role Rel: {row['role_relevance_pct']}", flush=True)
        print(f"      Why: {row['explanation']}\n", flush=True)
        
    print(f"  -> {top_rec['reason']}", flush=True)
    
    # 7. Machine Learning (TF-IDF Cosine Similarity & K-Means Clustering) & Model Saving
    print("\n[7/8] Fitting ML Models (TF-IDF & K-Means) and Persisting Artifacts...", flush=True)
    tfidf_matcher = TFIDFSimilarityMatcher(cs_df, max_features=1000)
    models_dir = get_trained_models_dir()
    
    # Save vectorizer artifact
    vectorizer_path = models_dir / "tfidf_vectorizer.joblib"
    joblib.dump(tfidf_matcher.vectorizer, vectorizer_path)
    print(f"  [OK] Saved TF-IDF Vectorizer Artifact: {vectorizer_path}", flush=True)
    
    # Train K-Means Clustering
    kmeans_model, cluster_df = train_kmeans_skill_clusters(matrix_df, n_clusters=5)
    kmeans_path = models_dir / "kmeans_skill_clusters.joblib"
    joblib.dump(kmeans_model, kmeans_path)
    print(f"  [OK] Saved K-Means Cluster Model: {kmeans_path}", flush=True)
    
    # 8. Evaluation: Baseline vs ML Comparison
    print("\n[8/8] Evaluating Baseline Skill Overlap Matcher vs ML TF-IDF Cosine Similarity...", flush=True)
    eval_results = evaluate_baseline_vs_ml(profile, baseline_matcher, tfidf_matcher)
    
    print("\n" + "=" * 70, flush=True)
    print("EVALUATION & BASELINE VS ML COMPARISON REPORT", flush=True)
    print("=" * 70, flush=True)
    print(f"Candidate Evaluated:          {eval_results['candidate_profile']}", flush=True)
    print(f"Baseline Matcher Speed:      {eval_results['baseline_execution_time_ms']} ms", flush=True)
    print(f"TF-IDF Matcher Speed:        {eval_results['tfidf_execution_time_ms']} ms", flush=True)
    print(f"Spearman Rank Correlation:   {eval_results['spearman_rank_correlation']}", flush=True)
    print("Top-K Ranking Overlap:", flush=True)
    for k, val in eval_results["top_k_ranking_overlap"].items():
        print(f"  * {k}: {val}", flush=True)
        
    print("\nBaseline Advantages:", flush=True)
    for adv in eval_results["comparison_insights"]["baseline_advantages"]:
        print(f"  * {adv}", flush=True)
        
    print("\nTF-IDF ML Advantages:", flush=True)
    for adv in eval_results["comparison_insights"]["tfidf_advantages"]:
        print(f"  * {adv}", flush=True)
        
    print(f"\nFinal Recommendation: {eval_results['comparison_insights']['recommendation']}", flush=True)
    
    elapsed = time.time() - start_time
    print("\n" + "=" * 70, flush=True)
    print(f"DAY 3 PIPELINE COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS", flush=True)
    print("=" * 70, flush=True)


if __name__ == "__main__":
    main()
