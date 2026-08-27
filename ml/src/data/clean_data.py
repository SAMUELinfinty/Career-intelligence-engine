"""
clean_data.py
Data cleaning and CS job filtering module for the Career Intelligence Engine.
Optimized for high performance execution.
"""

import html
import re
import pandas as pd
import numpy as np


# Regex pattern to match CS / Technology job titles
CS_TITLE_INCLUDE_PATTERN = (
    r'(?i)\b(?:software|developer|programmer|coder|backend|back\s*end|frontend|front\s*end|'
    r'full\s*stack|fullstack|web\s*dev|data|database|dba|machine\s*learning|ai|artificial\s*intelligence|'
    r'deep\s*learning|nlp|computer\s*vision|devops|sre|site\s*reliability|cloud|infrastructure|'
    r'sysadmin|system\s*admin|systems\s*engineer|cybersecurity|cyber|infosec|security\s*(?:engineer|analyst|architect|specialist)|'
    r'network|qa|quality\s*assurance|automation\s*engineer|test\s*engineer|grc|compliance\s*(?:analyst|specialist)|'
    r'risk\s*(?:analyst|engineer)|solutions\s*architect|it\s*(?:specialist|support|analyst|engineer|manager|director)|'
    r'helpdesk|scrum\s*master|tech\s*lead|technical\s*program\s*manager|technology)\b'
)

# Regex pattern to exclude non-CS engineering / retail / physical labor roles
CS_TITLE_EXCLUDE_PATTERN = (
    r'(?i)\b(?:civil|mechanical|electrical|structural|chemical|biomedical|industrial|manufacturing|'
    r'petroleum|environmental|hvac|automotive|maintenance|auto\s*glass|auto\s*detailer|retail|'
    r'sales\s*associate|cashier|janitor|nursing|nurse|store\s*support|security\s*guard|security\s*officer|'
    r'driver|warehouse)\b'
)


def clean_html_tags(text: str) -> str:
    """
    Cleans HTML tags and unescapes HTML entities from text.
    
    Args:
        text (str): Raw text string.
        
    Returns:
        str: Cleaned text string with normalized whitespace.
    """
    if not isinstance(text, str) or pd.isna(text):
        return ""
        
    # Unescape HTML entities (&amp;, &nbsp;, &lt;, etc.)
    text = html.unescape(text)
    
    # Replace HTML break tags / list items with spaces
    text = re.sub(r'(?i)<br\s*/?>|</p>|</li>|</div>', ' ', text)
    
    # Strip remaining HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    
    # Normalize multiple whitespace characters to a single space
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def filter_cs_tech_jobs(df: pd.DataFrame) -> pd.DataFrame:
    """
    Filters job postings to select CS / Technology related positions.
    
    Args:
        df (pd.DataFrame): Raw or cleaned job postings dataframe.
        
    Returns:
        pd.DataFrame: CS/Tech job postings subset.
    """
    if "title" not in df.columns:
        raise ValueError("DataFrame must contain 'title' column for CS job filtering.")
        
    titles = df["title"].astype(str)
    
    cs_mask = titles.str.contains(CS_TITLE_INCLUDE_PATTERN, regex=True, na=False) & \
              ~titles.str.contains(CS_TITLE_EXCLUDE_PATTERN, regex=True, na=False)
              
    return df[cs_mask].copy()


def infer_experience_level(title: str, description: str, raw_level: str = None) -> str:
    """
    Infers experience level if raw_level is missing or unformatted.
    
    Args:
        title (str): Job title.
        description (str): Cleaned job description.
        raw_level (str, optional): Raw experience level field.
        
    Returns:
        str: Inferred experience level.
    """
    if isinstance(raw_level, str) and raw_level.strip() and raw_level != "nan" and raw_level.lower() != "none":
        return raw_level.strip()
        
    title_lower = str(title).lower()
    desc_lower = str(description).lower()[:500]  # inspect first 500 chars of desc
    
    if any(k in title_lower for k in ["intern", "internship", "co-op", "trainee"]):
        return "Internship"
    if any(k in title_lower for k in ["entry level", "junior", "jr.", "jr", "associate", "graduate"]):
        return "Entry level"
    if any(k in title_lower for k in ["executive", "vp", "vice president", "cfo", "cto", "cio"]):
        return "Executive"
    if any(k in title_lower for k in ["director", "head of"]):
        return "Director"
    if any(k in title_lower for k in ["senior", "sr.", "sr", "lead", "principal", "staff", "manager"]):
        return "Mid-Senior level"
        
    # Check description snippet if title didn't match
    if any(k in desc_lower for k in ["internship", "intern", "entry-level", "entry level", "no experience required"]):
        return "Entry level"
        
    return "Not Specified"


def clean_postings_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Performs core data cleaning on postings dataframe:
    - Removes duplicate job_ids
    - Removes rows with missing title or description
    - Adds cleaned job description column ('description_clean')
    - Infers missing experience levels ('experience_level_inferred')
    - Formats remote and work type indicators
    
    Args:
        df (pd.DataFrame): Raw postings dataframe.
        
    Returns:
        pd.DataFrame: Cleaned postings dataframe.
    """
    cleaned_df = df.copy()
    
    # 1. Deduplicate by job_id
    if "job_id" in cleaned_df.columns:
        cleaned_df = cleaned_df.drop_duplicates(subset=["job_id"]).copy()
        
    # 2. Filter out rows with invalid/empty title or description
    cleaned_df = cleaned_df[
        cleaned_df["title"].notna() & 
        (cleaned_df["title"].astype(str).str.strip() != "") &
        cleaned_df["description"].notna() & 
        (cleaned_df["description"].astype(str).str.strip() != "")
    ].copy()
    
    # 3. Create description_clean while preserving original description (using vectorized list comprehension)
    descriptions = cleaned_df["description"].astype(str).tolist()
    cleaned_df["description_clean"] = [clean_html_tags(d) for d in descriptions]
    
    # 4. Filter out descriptions that became empty after HTML cleaning
    cleaned_df = cleaned_df[cleaned_df["description_clean"].str.len() > 10].copy()
    
    # 5. Infer experience levels using fast zip iterator
    titles = cleaned_df["title"].astype(str).tolist()
    clean_descs = cleaned_df["description_clean"].astype(str).tolist()
    
    raw_levels = cleaned_df["formatted_experience_level"].astype(str).tolist() if "formatted_experience_level" in cleaned_df.columns else [None] * len(cleaned_df)
    
    inferred_levels = [
        infer_experience_level(t, d, r) 
        for t, d, r in zip(titles, clean_descs, raw_levels)
    ]
        
    cleaned_df["experience_level_inferred"] = inferred_levels
    
    # 6. Remote allowed binary flag (fill NaN with 0)
    if "remote_allowed" in cleaned_df.columns:
        cleaned_df["remote_allowed"] = cleaned_df["remote_allowed"].fillna(0).astype(int)
        
    return cleaned_df
