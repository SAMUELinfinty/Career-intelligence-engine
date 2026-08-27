"""
evaluate.py
Evaluation module comparing Baseline Skill Overlap Matcher vs Machine Learning (TF-IDF Cosine Similarity).
"""

import time
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from typing import Dict, List, Tuple

from ml.src.models.user_profile import UserProfile
from ml.src.models.matching import BaselineMatcher, TFIDFSimilarityMatcher


def evaluate_baseline_vs_ml(
    user_profile: UserProfile,
    baseline_matcher: BaselineMatcher,
    tfidf_matcher: TFIDFSimilarityMatcher,
    top_k_eval_list: List[int] = [10, 20, 50]
) -> Dict:
    """
    Evaluates and compares Baseline Skill Matching vs TF-IDF Cosine Similarity.
    
    Args:
        user_profile (UserProfile): Candidate profile.
        baseline_matcher (BaselineMatcher): Fitted baseline matcher.
        tfidf_matcher (TFIDFSimilarityMatcher): Fitted TF-IDF matcher.
        top_k_eval_list (List[int]): Top-K cutoffs for rank overlap evaluation.
        
    Returns:
        Dict: Comprehensive evaluation comparison results.
    """
    # 1. Measure Baseline Matching Execution Time & Rankings
    t0 = time.time()
    baseline_results = baseline_matcher.rank_jobs(user_profile, top_n=100)
    baseline_time = (time.time() - t0) * 1000.0  # ms
    
    # 2. Measure TF-IDF Matching Execution Time & Rankings
    t0 = time.time()
    tfidf_results = tfidf_matcher.rank_jobs(user_profile, top_n=100)
    tfidf_time = (time.time() - t0) * 1000.0  # ms
    
    # Merge rankings on job_id for top 100
    merged = baseline_results[["job_id", "title", "match_score"]].merge(
        tfidf_results[["job_id", "tfidf_match_score"]],
        on="job_id",
        how="inner"
    )
    
    # Spearman Rank Correlation
    if len(merged) > 5:
        corr, p_value = spearmanr(merged["match_score"], merged["tfidf_match_score"])
    else:
        corr, p_value = 0.0, 1.0
        
    # Top-K Overlap Analysis
    top_k_overlap = {}
    for k in top_k_eval_list:
        base_top_k = set(baseline_results.head(k)["job_id"])
        tfidf_top_k = set(tfidf_results.head(k)["job_id"])
        intersection = base_top_k.intersection(tfidf_top_k)
        jaccard = len(intersection) / k if k > 0 else 0.0
        top_k_overlap[f"Overlap@{k}"] = f"{round(jaccard * 100, 1)}%"
        
    evaluation_summary = {
        "candidate_profile": user_profile.candidate_name,
        "baseline_execution_time_ms": round(baseline_time, 2),
        "tfidf_execution_time_ms": round(tfidf_time, 2),
        "spearman_rank_correlation": round(corr, 4) if not np.isnan(corr) else 0.0,
        "top_k_ranking_overlap": top_k_overlap,
        "comparison_insights": {
            "baseline_advantages": [
                "100% transparent and interpretable (exact skill matched vs missing breakdown).",
                "Directly actionable for candidate skill gap analysis.",
                "Zero risk of hallucination or unexplainable similarity scores."
            ],
            "tfidf_advantages": [
                "Captures semantic text context beyond exact skill keyword list.",
                "Considers full job description language and industry terminology.",
                "Handles subtle variations in job titles and role descriptions."
            ],
            "recommendation": "Use Baseline IDF-Weighted Matching as primary user-facing engine for transparent skill gap analysis, and use TF-IDF Cosine Similarity for semantic context ranking enhancement."
        }
    }
    
    return evaluation_summary
