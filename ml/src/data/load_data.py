"""
load_data.py
Data loading module for the Career Intelligence Engine.
Handles loading raw dataset CSV files safely and efficiently.
"""

import os
from pathlib import Path
import pandas as pd


def get_project_root() -> Path:
    """Finds the root directory of the project."""
    current_dir = Path(__file__).resolve().parent
    # ml/src/data -> root is 3 levels up
    root_dir = current_dir.parent.parent.parent
    return root_dir


def get_raw_data_dir() -> Path:
    """Returns path to raw data directory, checking case variations."""
    root = get_project_root()
    possible_paths = [
        root / "ml" / "Data" / "Raw",
        root / "ml" / "data" / "raw",
    ]
    for p in possible_paths:
        if p.exists():
            return p
    return root / "ml" / "Data" / "Raw"


def get_processed_data_dir() -> Path:
    """Returns path to processed data directory, creating it if needed."""
    root = get_project_root()
    processed_dir = root / "ml" / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    return processed_dir


def load_raw_postings(nrows=None, usecols=None) -> pd.DataFrame:
    """
    Loads raw postings.csv table.
    
    Args:
        nrows (int, optional): Number of rows to read.
        usecols (list, optional): Subset of columns to load.
        
    Returns:
        pd.DataFrame: Raw postings dataframe.
    """
    raw_dir = get_raw_data_dir()
    postings_path = raw_dir / "postings.csv"
    if not postings_path.exists():
        raise FileNotFoundError(f"Raw postings file not found at {postings_path}")
        
    df = pd.read_csv(postings_path, nrows=nrows, usecols=usecols, low_memory=False)
    return df


def load_all_raw_data() -> dict:
    """
    Loads all raw relational tables from raw data directory.
    
    Returns:
        dict: Mapping of dataset name -> pd.DataFrame
    """
    raw_dir = get_raw_data_dir()
    data = {}
    
    # Load postings
    data["postings"] = pd.read_csv(raw_dir / "postings.csv", low_memory=False)
    
    # Load companies
    comp_dir = raw_dir / "companies"
    if comp_dir.exists():
        if (comp_dir / "companies.csv").exists():
            data["companies"] = pd.read_csv(comp_dir / "companies.csv", low_memory=False)
        if (comp_dir / "company_industries.csv").exists():
            data["company_industries"] = pd.read_csv(comp_dir / "company_industries.csv", low_memory=False)
        if (comp_dir / "company_specialities.csv").exists():
            data["company_specialities"] = pd.read_csv(comp_dir / "company_specialities.csv", low_memory=False)
        if (comp_dir / "employee_counts.csv").exists():
            data["employee_counts"] = pd.read_csv(comp_dir / "employee_counts.csv", low_memory=False)

    # Load jobs relational tables
    jobs_dir = raw_dir / "jobs"
    if jobs_dir.exists():
        if (jobs_dir / "benefits.csv").exists():
            data["benefits"] = pd.read_csv(jobs_dir / "benefits.csv", low_memory=False)
        if (jobs_dir / "job_industries.csv").exists():
            data["job_industries"] = pd.read_csv(jobs_dir / "job_industries.csv", low_memory=False)
        if (jobs_dir / "job_skills.csv").exists():
            data["job_skills"] = pd.read_csv(jobs_dir / "job_skills.csv", low_memory=False)
        if (jobs_dir / "salaries.csv").exists():
            data["salaries"] = pd.read_csv(jobs_dir / "salaries.csv", low_memory=False)

    # Load mappings
    map_dir = raw_dir / "mappings"
    if map_dir.exists():
        if (map_dir / "industries.csv").exists():
            data["industries"] = pd.read_csv(map_dir / "industries.csv", low_memory=False)
        if (map_dir / "skills.csv").exists():
            data["skills"] = pd.read_csv(map_dir / "skills.csv", low_memory=False)

    return data
