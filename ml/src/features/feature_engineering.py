"""
feature_engineering.py
Feature engineering and skill matrix creation module for the Career Intelligence Engine.
Fast vectorized implementation.
"""

import pandas as pd
import numpy as np
from typing import Tuple, List, Dict
from ml.src.features.skill_dictionary import (
    extract_skills_from_text,
    get_all_canonical_skills,
    get_skill_category_map,
)


def categorize_role(title: str) -> str:
    """
    Categorizes job title into a standard role domain.
    
    Args:
        title (str): Job title string.
        
    Returns:
        str: Grouped role category.
    """
    title_lower = str(title).lower()
    
    if any(k in title_lower for k in ["data analyst", "data engineer", "data scientist", "machine learning", "ai", "deep learning", "nlp", "computer vision", "analytics"]):
        return "Data & AI"
    if any(k in title_lower for k in ["devops", "sre", "cloud", "infrastructure", "sysadmin", "system", "network"]):
        return "Cloud & DevOps"
    if any(k in title_lower for k in ["cybersecurity", "security", "infosec", "grc", "compliance", "risk"]):
        return "Cybersecurity & GRC"
    if any(k in title_lower for k in ["frontend", "front end", "web developer", "react", "angular", "vue", "javascript"]):
        return "Web Development"
    if any(k in title_lower for k in ["software", "developer", "backend", "back end", "full stack", "fullstack", "programmer"]):
        return "Software Engineering"
        
    return "Other CS/Tech"


def encode_experience_level(level: str) -> int:
    """
    Encodes experience level into ordinal integer.
    
    Args:
        level (str): Experience level string.
        
    Returns:
        int: Ordinal integer representation.
    """
    level_str = str(level).lower()
    if "intern" in level_str:
        return 1
    if "entry" in level_str:
        return 2
    if "associate" in level_str or "mid" in level_str or "senior" in level_str:
        return 3
    if "director" in level_str or "executive" in level_str:
        return 4
    return 0


def generate_skill_tables(df_cs: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Extracts skills for all CS postings and builds:
    1. df_cs with extracted skill list and engineered features
    2. job_skill_matrix DataFrame (job_id x binary skill indicators)
    3. job_skills_long DataFrame (job_id, skill, category)
    
    Args:
        df_cs (pd.DataFrame): Processed CS job postings dataframe.
        
    Returns:
        Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
            (df_cs_featured, job_skill_matrix, job_skills_long)
    """
    all_skills = get_all_canonical_skills()
    category_map = get_skill_category_map()
    
    job_ids = df_cs["job_id"].tolist()
    descriptions = df_cs["description_clean"].fillna("").astype(str).tolist()
    
    # Fast list comprehension for skill extraction
    extracted_skills_list = [extract_skills_from_text(d) for d in descriptions]
    
    # Pre-convert extracted skills to sets ONCE for fast O(1) lookup
    skill_sets = [set(s) for s in extracted_skills_list]
    
    # Populate binary matrix columns in bulk
    matrix_data = {"job_id": job_ids}
    long_rows = []
    
    for skill in all_skills:
        matrix_data[skill] = [1 if skill in s_set else 0 for s_set in skill_sets]
        
    for j_id, s_list in zip(job_ids, extracted_skills_list):
        for skill in s_list:
            long_rows.append({
                "job_id": j_id,
                "skill": skill,
                "category": category_map.get(skill, "Other")
            })
            
    # Build DataFrames
    job_skill_matrix = pd.DataFrame(matrix_data)
    job_skills_long = pd.DataFrame(long_rows)
    
    # Feature Engineering on df_cs
    df_featured = df_cs.copy()
    df_featured["extracted_skills"] = [", ".join(s) for s in extracted_skills_list]
    df_featured["skill_count"] = [len(s) for s in extracted_skills_list]
    
    # Calculate skill density (skills per 100 words in clean description)
    word_counts = df_featured["description_clean"].astype(str).str.split().str.len().replace(0, 1)
    df_featured["skill_density"] = ((df_featured["skill_count"] / word_counts) * 100).round(2)
    
    # Encoded features
    exp_col = "experience_level_inferred" if "experience_level_inferred" in df_featured.columns else "formatted_experience_level"
    df_featured["experience_level_encoded"] = df_featured[exp_col].apply(encode_experience_level)
    
    # Remote indicator
    df_featured["is_remote"] = (
        (df_featured.get("remote_allowed", 0) == 1) |
        (df_featured["formatted_work_type"].astype(str).str.lower().str.contains("remote", na=False))
    ).astype(int)
    
    # Salary availability indicator
    sal_col = "normalized_salary" if "normalized_salary" in df_featured.columns else "min_salary"
    df_featured["has_salary"] = df_featured[sal_col].notna().astype(int)
    
    # Role Category
    df_featured["role_category"] = df_featured["title"].apply(categorize_role)
    
    return df_featured, job_skill_matrix, job_skills_long
