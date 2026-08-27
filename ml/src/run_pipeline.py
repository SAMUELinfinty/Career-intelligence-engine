"""
run_pipeline.py
Main Day 2 pipeline runner for Career Intelligence Engine.
Processes raw dataset into cleaned CS job postings, skill matrices, and engineered features.
Optimized order of operations and column selection for high speed.
"""

import os
import sys
import time
from pathlib import Path

# Ensure project root is in sys.path
project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from ml.src.data.load_data import load_raw_postings, get_processed_data_dir
from ml.src.data.clean_data import clean_postings_dataframe, filter_cs_tech_jobs
from ml.src.features.feature_engineering import generate_skill_tables


def main():
    print("=" * 60, flush=True)
    print("CAREER INTELLIGENCE ENGINE — DATA PIPELINE RUNNER", flush=True)
    print("=" * 60, flush=True)
    
    start_time = time.time()
    
    # 1. Load Essential Columns of Raw Postings
    print("\n[1/5] Loading raw job postings dataset...", flush=True)
    essential_cols = [
        'job_id', 'company_name', 'title', 'description', 'max_salary', 
        'pay_period', 'location', 'company_id', 'views', 'med_salary', 
        'min_salary', 'formatted_work_type', 'remote_allowed', 
        'formatted_experience_level', 'currency', 'normalized_salary', 
        'listed_time', 'posting_domain', 'sponsored'
    ]
    df_raw = load_raw_postings(usecols=essential_cols)
    raw_count = len(df_raw)
    print(f"Loaded {raw_count:,} raw postings from postings.csv.", flush=True)
    
    # 2. Filter CS / Technology Job Roles FIRST
    print("\n[2/5] Filtering CS / Technology job roles...", flush=True)
    df_cs_raw = filter_cs_tech_jobs(df_raw)
    cs_raw_count = len(df_cs_raw)
    print(f"Target CS/Tech postings matched: {cs_raw_count:,} ({cs_raw_count / raw_count * 100:.2f}% of total dataset)", flush=True)
    
    # 3. Perform Data Cleaning & Description Preprocessing on CS Subset
    print("\n[3/5] Performing data cleaning & HTML description preprocessing on CS postings...", flush=True)
    df_cs = clean_postings_dataframe(df_cs_raw)
    cs_count = len(df_cs)
    print(f"Cleaned CS postings count after deduplication & text cleaning: {cs_count:,}", flush=True)
    
    # 4. Skill Extraction & Feature Engineering
    print("\n[4/5] Running granular skill extraction & feature engineering...", flush=True)
    df_cs_featured, job_skill_matrix, job_skills_long = generate_skill_tables(df_cs)
    
    # 5. Save Processed Datasets
    print("\n[5/5] Saving processed datasets to ml/data/processed/...", flush=True)
    processed_dir = get_processed_data_dir()
    
    cs_postings_path = processed_dir / "cs_job_postings.csv"
    matrix_path = processed_dir / "job_skill_matrix.csv"
    long_skills_path = processed_dir / "job_skills_long.csv"
    
    df_cs_featured.to_csv(cs_postings_path, index=False)
    job_skill_matrix.to_csv(matrix_path, index=False)
    job_skills_long.to_csv(long_skills_path, index=False)
    
    print(f"  [OK] Saved CS Postings: {cs_postings_path}", flush=True)
    print(f"  [OK] Saved Job Skill Matrix: {matrix_path}", flush=True)
    print(f"  [OK] Saved Job Skills Long: {long_skills_path}", flush=True)
    
    # Execution Summary
    elapsed = time.time() - start_time
    print("\n" + "=" * 60, flush=True)
    print("PIPELINE SUMMARY STATISTICS", flush=True)
    print("=" * 60, flush=True)
    print(f"Raw Job Postings:               {raw_count:,}", flush=True)
    print(f"Matched CS Job Postings:        {cs_raw_count:,}", flush=True)
    print(f"Cleaned CS Job Postings:        {cs_count:,}", flush=True)
    print(f"Total Unique Skills Detected:   {job_skills_long['skill'].nunique()}", flush=True)
    print(f"Total Skill Mentions Extracted: {len(job_skills_long):,}", flush=True)
    print(f"Average Skills per CS Job:      {df_cs_featured['skill_count'].mean():.2f}", flush=True)
    
    print("\nTOP 20 EXTRACTED MICRO-SKILLS IN CS ROLES:", flush=True)
    top_skills = job_skills_long["skill"].value_counts().head(20)
    for rank, (skill, count) in enumerate(top_skills.items(), 1):
        pct = (count / cs_count) * 100
        print(f"  {rank:2d}. {skill:<22} {count:5,d} postings ({pct:.1f}%)", flush=True)
        
    print(f"\nPipeline completed successfully in {elapsed:.2f} seconds.", flush=True)


if __name__ == "__main__":
    main()
