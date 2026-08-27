"""
test_matching.py
Unit tests for core baseline skill matching, score calculations, and job ranking.
"""

import unittest
import pandas as pd
from ml.src.models.user_profile import UserProfile
from ml.src.models.matching import BaselineMatcher


class TestMatchingEngine(unittest.TestCase):

    def setUp(self):
        # Create minimal synthetic postings and skill matrix for deterministic testing
        self.cs_df = pd.DataFrame([
            {"job_id": 101, "title": "Python Engineer", "company_name": "TechCorp", "role_category": "Software Engineering"},
            {"job_id": 102, "title": "Data Analyst", "company_name": "DataInc", "role_category": "Data & AI"},
            {"job_id": 103, "title": "DevOps Engineer", "company_name": "CloudCo", "role_category": "Cloud & DevOps"},
        ])
        
        self.matrix_df = pd.DataFrame([
            {"job_id": 101, "Python": 1, "SQL": 1, "Docker": 1, "AWS": 0},
            {"job_id": 102, "Python": 1, "SQL": 1, "Docker": 0, "AWS": 0},
            {"job_id": 103, "Python": 0, "SQL": 0, "Docker": 1, "AWS": 1},
        ])
        
        self.matcher = BaselineMatcher(self.matrix_df, self.cs_df, use_idf_weights=False)

    def test_identical_skills_match(self):
        user = UserProfile(skills={"Python": 3, "SQL": 3, "Docker": 3})
        res = self.matcher.match_single_job(user, 101)
        self.assertEqual(res["match_score"], 1.0)
        self.assertEqual(len(res["missing_skills"]), 0)
        self.assertEqual(set(res["matched_skills"]), {"Python", "SQL", "Docker"})

    def test_zero_overlap_match(self):
        user = UserProfile(skills={"Java": 3, "React": 3})
        res = self.matcher.match_single_job(user, 101)
        self.assertEqual(res["match_score"], 0.0)
        self.assertEqual(len(res["matched_skills"]), 0)
        self.assertEqual(set(res["missing_skills"]), {"Python", "SQL", "Docker"})

    def test_partial_match_and_skill_gap(self):
        user = UserProfile(skills={"Python": 3, "SQL": 3})
        res = self.matcher.match_single_job(user, 101)
        self.assertEqual(res["match_score"], round(2 / 3, 4))
        self.assertEqual(set(res["matched_skills"]), {"Python", "SQL"})
        self.assertEqual(res["missing_skills"], ["Docker"])

    def test_deterministic_job_ranking(self):
        user = UserProfile(skills={"Python": 3, "SQL": 3, "Docker": 3})
        ranked = self.matcher.rank_jobs(user, top_n=3)
        self.assertEqual(ranked.iloc[0]["job_id"], 101)
        self.assertEqual(ranked.iloc[0]["match_score"], 1.0)


if __name__ == "__main__":
    unittest.main()
