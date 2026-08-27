"""
test_clean_data.py
Unit tests for data cleaning utilities.
"""

import unittest
from ml.src.data.clean_data import clean_html_tags, infer_experience_level


class TestCleanData(unittest.TestCase):

    def test_clean_html_tags_basic(self):
        raw = "<p>We are looking for a <b>Python</b> developer.</p><br><ul><li>Remote work</li></ul>"
        expected = "We are looking for a Python developer. Remote work"
        self.assertEqual(clean_html_tags(raw), expected)

    def test_clean_html_entities(self):
        raw = "Required &amp; Preferred Skills: C++ &lt;3 Python &nbsp; Developer"
        expected = "Required & Preferred Skills: C++ <3 Python Developer"
        self.assertEqual(clean_html_tags(raw), expected)

    def test_clean_html_empty_or_none(self):
        self.assertEqual(clean_html_tags(None), "")
        self.assertEqual(clean_html_tags(""), "")
        self.assertEqual(clean_html_tags("   "), "")

    def test_infer_experience_level(self):
        self.assertEqual(infer_experience_level("Software Engineer Intern", "Great opportunity"), "Internship")
        self.assertEqual(infer_experience_level("Junior Developer", "Entry level role"), "Entry level")
        self.assertEqual(infer_experience_level("Senior Data Scientist", "Lead team"), "Mid-Senior level")
        self.assertEqual(infer_experience_level("Software Engineer", "Looking for entry level intern", raw_level=None), "Entry level")
        self.assertEqual(infer_experience_level("Software Engineer", "Description", raw_level="Associate"), "Associate")


if __name__ == "__main__":
    unittest.main()
