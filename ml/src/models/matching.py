"""
matching.py
Core Baseline Skill Matching, Skill Weighting, Role Matching, and ML TF-IDF Engine
for the Career Intelligence Engine.
"""

import math
import numpy as np
import pandas as pd
from typing import Dict, List, Set, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans

from ml.src.models.user_profile import UserProfile
from ml.src.features.skill_dictionary import get_all_canonical_skills, get_skill_category_map


def compute_skill_idf_weights(job_skill_matrix: pd.DataFrame) -> Dict[str, float]:
    """
    Computes Inverse Document Frequency (IDF) weights for each skill from the skill matrix.
    
    Formula:
        IDF(s) = ln((N + 1) / (DF(s) + 1)) + 1
        
    Args:
        job_skill_matrix (pd.DataFrame): Binary skill matrix (job_id + 83 skill columns).
        
    Returns:
        Dict[str, float]: Mapping of skill_name -> IDF weight.
    """
    N = len(job_skill_matrix)
    skill_cols = [c for c in job_skill_matrix.columns if c != "job_id"]
    weights = {}
    
    for skill in skill_cols:
        df_count = job_skill_matrix[skill].sum()
        idf = math.log((N + 1.0) / (df_count + 1.0)) + 1.0
        weights[skill] = round(idf, 4)
        
    return weights


class BaselineMatcher:
    """
    Baseline Skill Overlap Matching Engine.
    Calculates exact set intersection and weighted match scores between candidate profiles
    and job postings.
    """

    def __init__(self, job_skill_matrix: pd.DataFrame, cs_postings_df: pd.DataFrame, use_idf_weights: bool = True):
        self.matrix_df = job_skill_matrix.copy()
        self.postings_df = cs_postings_df.copy()
        self.use_idf_weights = use_idf_weights
        
        # Pre-compute IDF weights
        self.idf_weights = compute_skill_idf_weights(self.matrix_df) if use_idf_weights else {}
        
        # Map job_id -> list of required skills
        self.job_skills_map: Dict[int, List[str]] = {}
        skill_cols = [c for c in self.matrix_df.columns if c != "job_id"]
        
        for _, row in self.matrix_df.iterrows():
            j_id = row["job_id"]
            req_skills = [s for s in skill_cols if row[s] == 1]
            self.job_skills_map[j_id] = req_skills

    def match_single_job(self, user_profile: UserProfile, job_id: int) -> dict:
        """
        Calculates match score and skill gaps for a single job posting.
        
        Args:
            user_profile (UserProfile): Candidate profile.
            job_id (int): Job ID to match against.
            
        Returns:
            dict: Structured job match result.
        """
        user_skills = user_profile.get_known_skills()
        job_skills = self.job_skills_map.get(job_id, [])
        
        if not job_skills:
            return {
                "job_id": job_id,
                "match_score": 0.0,
                "matched_skills": [],
                "missing_skills": [],
                "matched_skill_count": 0,
                "missing_skill_count": 0,
            }
            
        matched = [s for s in job_skills if s in user_skills]
        missing = [s for s in job_skills if s not in user_skills]
        
        if self.use_idf_weights:
            total_weight = sum(self.idf_weights.get(s, 1.0) for s in job_skills)
            matched_weight = sum(self.idf_weights.get(s, 1.0) for s in matched)
            match_score = matched_weight / total_weight if total_weight > 0 else 0.0
        else:
            match_score = len(matched) / len(job_skills) if job_skills else 0.0
            
        return {
            "job_id": job_id,
            "match_score": round(match_score, 4),
            "matched_skills": matched,
            "missing_skills": missing,
            "matched_skill_count": len(matched),
            "missing_skill_count": len(missing),
        }

    def rank_jobs(
        self,
        user_profile: UserProfile,
        top_n: int = 20,
        filter_role_category: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Ranks all CS job postings against user profile and returns Top N matched jobs.
        
        Args:
            user_profile (UserProfile): Candidate user profile.
            top_n (int): Number of top ranked jobs to return.
            filter_role_category (str, optional): Filter by role category.
            
        Returns:
            pd.DataFrame: Ranked dataframe of top job matches.
        """
        df_target = self.postings_df.copy()
        if filter_role_category:
            df_target = df_target[df_target["role_category"] == filter_role_category].copy()
            
        user_skills = user_profile.get_known_skills()
        
        scores = []
        matched_lists = []
        missing_lists = []
        matched_counts = []
        missing_counts = []
        
        for _, row in df_target.iterrows():
            j_id = row["job_id"]
            res = self.match_single_job(user_profile, j_id)
            scores.append(res["match_score"])
            matched_lists.append(", ".join(res["matched_skills"]))
            missing_lists.append(", ".join(res["missing_skills"]))
            matched_counts.append(res["matched_skill_count"])
            missing_counts.append(res["missing_skill_count"])
            
        df_target["match_score"] = scores
        df_target["matched_skills"] = matched_lists
        df_target["missing_skills"] = missing_lists
        df_target["matched_skill_count"] = matched_counts
        df_target["missing_skill_count"] = missing_counts
        
        # Sort deterministically by match_score descending, then skill_count descending
        df_target = df_target.sort_values(
            by=["match_score", "matched_skill_count"],
            ascending=[False, False]
        )
        
        return df_target.head(top_n).copy()


class RoleMatcher:
    """
    Role-Level Skill Profile Engine.
    Derives role skill profiles from dataset and matches user against target roles.
    """

    def __init__(self, cs_postings_df: pd.DataFrame, job_skills_long: pd.DataFrame):
        self.postings_df = cs_postings_df.copy()
        self.skills_long = job_skills_long.copy()
        self.role_profiles: Dict[str, Dict[str, float]] = self._derive_role_profiles()

    def _derive_role_profiles(self) -> Dict[str, Dict[str, float]]:
        """Derives skill frequency profiles for each role category from dataset."""
        merged = self.skills_long.merge(
            self.postings_df[["job_id", "role_category"]],
            on="job_id",
            how="inner"
        )
        
        role_counts = merged.groupby("role_category")["job_id"].nunique().to_dict()
        role_skill_counts = merged.groupby(["role_category", "skill"]).size().reset_index(name="count")
        
        profiles = {}
        for role, r_df in role_skill_counts.groupby("role_category"):
            total_jobs = role_counts.get(role, 1)
            # Skill frequency within role
            freq_dict = {
                row["skill"]: round(row["count"] / total_jobs, 4)
                for _, row in r_df.iterrows()
            }
            profiles[role] = freq_dict
            
        return profiles

    def match_user_to_roles(self, user_profile: UserProfile) -> pd.DataFrame:
        """
        Calculates user match percentage across all role categories.
        
        Args:
            user_profile (UserProfile): Candidate user profile.
            
        Returns:
            pd.DataFrame: Table of role match scores.
        """
        user_skills = user_profile.get_known_skills()
        
        results = []
        for role, skill_freqs in self.role_profiles.items():
            # Filter skills that appear in at least 10% of jobs for this role
            important_skills = {s: freq for s, freq in skill_freqs.items() if freq >= 0.10}
            if not important_skills:
                continue
                
            total_freq_weight = sum(important_skills.values())
            user_freq_weight = sum(important_skills[s] for s in important_skills if s in user_skills)
            
            match_score = user_freq_weight / total_freq_weight if total_freq_weight > 0 else 0.0
            
            results.append({
                "role_category": role,
                "role_match_score": round(match_score, 4),
                "role_match_percentage": f"{round(match_score * 100, 1)}%",
                "top_role_skills": ", ".join(sorted(important_skills.keys(), key=lambda x: important_skills[x], reverse=True)[:5])
            })
            
        res_df = pd.DataFrame(results).sort_values(by="role_match_score", ascending=False)
        return res_df


class TFIDFSimilarityMatcher:
    """
    Machine Learning Matcher using TF-IDF Vectorization and Cosine Similarity.
    """

    def __init__(self, cs_postings_df: pd.DataFrame, max_features: int = 1000):
        self.postings_df = cs_postings_df.copy()
        
        # Build text corpus per job (title + clean description + extracted skills)
        self.corpus = (
            self.postings_df["title"].fillna("") + " " +
            self.postings_df["description_clean"].fillna("") + " " +
            self.postings_df["extracted_skills"].fillna("")
        ).tolist()
        
        self.vectorizer = TfidfVectorizer(max_features=max_features, stop_words="english")
        self.job_tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

    def rank_jobs(self, user_profile: UserProfile, top_n: int = 20) -> pd.DataFrame:
        """
        Ranks job postings using TF-IDF Cosine Similarity against user profile.
        
        Args:
            user_profile (UserProfile): Candidate user profile.
            top_n (int): Top N jobs to return.
            
        Returns:
            pd.DataFrame: Ranked dataframe of top ML matches.
        """
        user_text = " ".join(user_profile.target_roles) + " " + " ".join(user_profile.get_known_skills())
        user_vec = self.vectorizer.transform([user_text])
        
        sim_scores = cosine_similarity(user_vec, self.job_tfidf_matrix).flatten()
        
        df_result = self.postings_df.copy()
        df_result["tfidf_match_score"] = np.round(sim_scores, 4)
        
        df_result = df_result.sort_values(by="tfidf_match_score", ascending=False)
        return df_result.head(top_n).copy()


def train_kmeans_skill_clusters(job_skill_matrix: pd.DataFrame, n_clusters: int = 5) -> Tuple[KMeans, pd.DataFrame]:
    """
    Trains K-Means clustering model on skill matrix to discover natural skill role clusters.
    
    Args:
        job_skill_matrix (pd.DataFrame): Binary skill matrix.
        n_clusters (int): Number of clusters (default: 5).
        
    Returns:
        Tuple[KMeans, pd.DataFrame]: (Trained KMeans model, DataFrame with cluster assignments).
    """
    skill_cols = [c for c in job_skill_matrix.columns if c != "job_id"]
    X = job_skill_matrix[skill_cols].values
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X)
    
    res_df = job_skill_matrix[["job_id"]].copy()
    res_df["cluster_id"] = cluster_labels
    return kmeans, res_df
