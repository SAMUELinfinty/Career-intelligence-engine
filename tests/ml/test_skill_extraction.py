"""
test_skill_extraction.py
Unit tests for granular skill extraction, alias resolution, and false-positive prevention.
"""

import unittest
from ml.src.features.skill_dictionary import extract_skills_from_text


class TestSkillExtraction(unittest.TestCase):

    def test_extract_skills_known_matches(self):
        text = "We are seeking a Full Stack Engineer proficient in Python, SQL, PostgreSQL, and Docker."
        skills = extract_skills_from_text(text)
        self.assertIn("Python", skills)
        self.assertIn("SQL", skills)
        self.assertIn("PostgreSQL", skills)
        self.assertIn("Docker", skills)

    def test_skill_alias_normalization(self):
        text_1 = "Experience with React.js, Node.js, and Amazon Web Services."
        skills_1 = extract_skills_from_text(text_1)
        self.assertIn("React", skills_1)
        self.assertIn("Node.js", skills_1)
        self.assertIn("AWS", skills_1)

        text_2 = "Proficient in reactjs, nodejs, and aws cloud."
        skills_2 = extract_skills_from_text(text_2)
        self.assertIn("React", skills_2)
        self.assertIn("Node.js", skills_2)
        self.assertIn("AWS", skills_2)

    def test_avoid_false_positives(self):
        # Avoiding matching letter 'R' inside words like 'Developer' or 'R&D'
        text = "Seeking a Retail Developer to manage customer relationship."
        skills = extract_skills_from_text(text)
        self.assertNotIn("R", skills)
        self.assertNotIn("C", skills)

        # C++ and C# distinction
        text_cpp = "We require C++ and C# expertise."
        skills_cpp = extract_skills_from_text(text_cpp)
        self.assertIn("C++", skills_cpp)
        self.assertIn("C#", skills_cpp)
        self.assertNotIn("C", skills_cpp)

    def test_cybersecurity_and_grc(self):
        text = "Responsibilities include vulnerability management, NIST framework, SOC 2 compliance, and Splunk SIEM."
        skills = extract_skills_from_text(text)
        self.assertIn("Vulnerability Management", skills)
        self.assertIn("NIST", skills)
        self.assertIn("SOC 2", skills)
        self.assertIn("Splunk", skills)
        self.assertIn("SIEM", skills)


if __name__ == "__main__":
    unittest.main()
