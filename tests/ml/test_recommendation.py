"""
test_recommendation.py
Unit tests for learning priority recommendations and market demand calculations.
"""

import unittest
import pandas as pd
from ml.src.models.user_profile import UserProfile
from ml.src.models.recommendation import LearningPriorityEngine


class TestRecommendationEngine(unittest.TestCase):

    def setUp(self):
        self.cs_df = pd.DataFrame([
            {"job_id": 201, "title": "Software Engineer", "role_category": "Software Engineering"},
            {"job_id": 202, "title": "Software Developer", "role_category": "Software Engineering"},
            {"job_id": 203, "title": "Data Engineer", "role_category": "Data & AI"},
        ])
        
        self.long_df = pd.DataFrame([
            {"job_id": 201, "skill": "Python", "category": "Programming Languages"},
            {"job_id": 201, "skill": "AWS", "category": "Cloud & DevOps"},
            {"job_id": 202, "skill": "Python", "category": "Programming Languages"},
            {"job_id": 202, "skill": "AWS", "category": "Cloud & DevOps"},
            {"job_id": 203, "skill": "SQL", "category": "Programming Languages"},
        ])
        
        self.engine = LearningPriorityEngine(self.cs_df, self.long_df)

    def test_learning_priority_determinism(self):
        user = UserProfile(
            target_roles=["Software Engineering"],
            skills={"Python": 3}  # User has Python, lacks AWS and SQL
        )
        
        rec_df, top_rec = self.engine.recommend_next_skills(user, top_n=2)
        
        # AWS should be top recommended because it appears in 100% of Software Engineering roles in synthetic data
        self.assertEqual(rec_df.iloc[0]["skill"], "AWS")
        self.assertNotIn("Python", rec_df["skill"].values)  # Known skill excluded from recommendations
        self.assertEqual(top_rec["recommended_skill"], "AWS")

    def test_known_skills_excluded_from_gaps(self):
        user = UserProfile(
            target_roles=["Software Engineering"],
            skills={"Python": 4, "AWS": 4, "SQL": 4}
        )
        
        rec_df, _ = self.engine.recommend_next_skills(user, top_n=10)
        self.assertNotIn("Python", rec_df["skill"].values)
        self.assertNotIn("AWS", rec_df["skill"].values)
        self.assertNotIn("SQL", rec_df["skill"].values)


if __name__ == "__main__":
    unittest.main()
