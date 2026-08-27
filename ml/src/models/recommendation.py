"""
recommendation.py
Market Demand, Skill Gap Analysis, and Learning Priority Recommendation Engine
for the Career Intelligence Engine.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Set, Tuple
from ml.src.models.user_profile import UserProfile
from ml.src.features.skill_dictionary import get_skill_category_map


class MarketDemandAnalyzer:
    """
    Analyzes skill demand statistics across the processed CS job dataset.
    """

    def __init__(self, cs_postings_df: pd.DataFrame, job_skills_long: pd.DataFrame):
        self.postings_df = cs_postings_df.copy()
        self.skills_long = job_skills_long.copy()
        self.total_jobs = len(self.postings_df)

    def get_overall_skill_demand(self) -> pd.DataFrame:
        """
        Calculates overall market demand frequency for all skills.
        
        Returns:
            pd.DataFrame: Table with skill, count, percentage_demand, category.
        """
        category_map = get_skill_category_map()
        counts = self.skills_long["skill"].value_counts().reset_index()
        counts.columns = ["skill", "posting_count"]
        
        counts["demand_percentage"] = (counts["posting_count"] / self.total_jobs) * 100
        counts["demand_percentage"] = counts["demand_percentage"].round(2)
        counts["category"] = counts["skill"].map(lambda s: category_map.get(s, "Other"))
        
        return counts.sort_values(by="posting_count", ascending=False)

    def get_role_skill_demand(self, role_category: str) -> pd.DataFrame:
        """
        Calculates skill demand within a specific role category.
        
        Args:
            role_category (str): Targeted role category.
            
        Returns:
            pd.DataFrame: Table with skill, count, role_demand_percentage.
        """
        role_jobs = self.postings_df[self.postings_df["role_category"] == role_category]
        role_job_ids = set(role_jobs["job_id"])
        total_role_jobs = max(len(role_job_ids), 1)
        
        filtered_long = self.skills_long[self.skills_long["job_id"].isin(role_job_ids)]
        counts = filtered_long["skill"].value_counts().reset_index()
        counts.columns = ["skill", "posting_count"]
        
        counts["role_demand_percentage"] = (counts["posting_count"] / total_role_jobs) * 100
        counts["role_demand_percentage"] = counts["role_demand_percentage"].round(2)
        
        return counts.sort_values(by="posting_count", ascending=False)


class LearningPriorityEngine:
    """
    Transparent Learning Priority Recommendation Heuristic.
    Combines overall market demand, candidate target role relevance, and candidate skill gaps.
    """

    def __init__(self, cs_postings_df: pd.DataFrame, job_skills_long: pd.DataFrame):
        self.postings_df = cs_postings_df.copy()
        self.skills_long = job_skills_long.copy()
        self.market_analyzer = MarketDemandAnalyzer(self.postings_df, self.skills_long)
        self.overall_demand_df = self.market_analyzer.get_overall_skill_demand()
        self.overall_demand_map = dict(zip(self.overall_demand_df["skill"], self.overall_demand_df["demand_percentage"]))

    def recommend_next_skills(
        self,
        user_profile: UserProfile,
        top_n: int = 10
    ) -> Tuple[pd.DataFrame, dict]:
        """
        Calculates transparent learning priority score for skills missing from candidate profile.
        
        Formula:
            Priority Score(s) = Gap_Indicator(s) * [0.5 * MarketDemandPct(s) + 0.5 * RoleRelevancePct(s)] / 100
            
        Args:
            user_profile (UserProfile): Candidate user profile.
            top_n (int): Top N skills to recommend.
            
        Returns:
            Tuple[pd.DataFrame, dict]:
                (Priority recommendations DataFrame, Top recommended skill dictionary with explanation).
        """
        user_known = user_profile.get_known_skills()
        target_roles = user_profile.target_roles
        
        category_map = get_skill_category_map()
        
        # Calculate role relevance per skill across target_roles
        if target_roles:
            target_job_ids = set(self.postings_df[self.postings_df["role_category"].isin(target_roles)]["job_id"])
            if not target_job_ids:  # Fallback if no direct role_category match
                target_job_ids = set(self.postings_df["job_id"])
        else:
            target_job_ids = set(self.postings_df["job_id"])
            
        total_target_jobs = max(len(target_job_ids), 1)
        role_long = self.skills_long[self.skills_long["job_id"].isin(target_job_ids)]
        role_counts = role_long["skill"].value_counts().to_dict()
        
        recommendations = []
        all_canonical_skills = set(self.overall_demand_map.keys())
        
        for skill in all_canonical_skills:
            if skill in user_known:
                continue  # Candidate already possesses this skill
                
            mkt_demand_pct = self.overall_demand_map.get(skill, 0.0)
            role_rel_cnt = role_counts.get(skill, 0)
            role_rel_pct = round((role_rel_cnt / total_target_jobs) * 100, 2)
            
            # Heuristic calculation: Weighted average of Market Demand & Role Relevance
            priority_score = (0.4 * (mkt_demand_pct / 100.0)) + (0.6 * (role_rel_pct / 100.0))
            priority_score = round(min(priority_score, 1.0), 4)
            
            if mkt_demand_pct >= 20.0 or role_rel_pct >= 20.0:
                demand_level = "High"
            elif mkt_demand_pct >= 10.0 or role_rel_pct >= 10.0:
                demand_level = "Medium"
            else:
                demand_level = "Low"
                
            reason = (
                f"Appears in {role_rel_pct}% of postings for your target roles "
                f"({', '.join(target_roles[:2])}) and {mkt_demand_pct}% of total CS market jobs."
            )
            
            recommendations.append({
                "skill": skill,
                "category": category_map.get(skill, "Other"),
                "priority_score": priority_score,
                "demand_level": demand_level,
                "role_relevance_pct": f"{role_rel_pct}%",
                "market_demand_pct": f"{mkt_demand_pct}%",
                "explanation": reason,
            })
            
        if not recommendations:
            empty_df = pd.DataFrame(columns=["skill", "category", "priority_score", "demand_level", "role_relevance_pct", "market_demand_pct", "explanation"])
            top_skill_summary = {
                "recommended_skill": "None",
                "priority_score": 0.0,
                "demand_level": "N/A",
                "reason": "No missing skills detected; candidate profile possesses all cataloged skills."
            }
            return empty_df, top_skill_summary
            
        rec_df = pd.DataFrame(recommendations).sort_values(by="priority_score", ascending=False)
        rec_df = rec_df.head(top_n).copy()
        
        top_pick = rec_df.iloc[0].to_dict() if len(rec_df) > 0 else {}
        top_skill_summary = {
            "recommended_skill": top_pick.get("skill", "None"),
            "priority_score": top_pick.get("priority_score", 0.0),
            "demand_level": top_pick.get("demand_level", "N/A"),
            "reason": f"Recommended next skill to learn is '{top_pick.get('skill')}' - {top_pick.get('explanation')}"
        }
        
        return rec_df, top_skill_summary
