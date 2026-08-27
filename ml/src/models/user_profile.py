"""
user_profile.py
Candidate User Skill Profile representation for the Career Intelligence Engine.
"""

import json
from pathlib import Path
from typing import Dict, List, Set, Union


class UserProfile:
    """
    Represents a candidate/student skill profile including target role preferences
    and skill proficiency ratings.
    
    Proficiency Rating Scale:
        0: None (No experience / skill missing)
        1: Beginner (Familiar with basic syntax and concepts)
        2: Intermediate (Can build working applications / write queries)
        3: Advanced (Proficient in production engineering / best practices)
        4: Expert (Deep domain mastery / architecture design)
    """

    def __init__(
        self,
        candidate_name: str = "Candidate",
        target_roles: List[str] = None,
        skills: Dict[str, int] = None,
    ):
        self.candidate_name = candidate_name
        self.target_roles = target_roles if target_roles is not None else []
        self.skills = skills if skills is not None else {}

    @classmethod
    def from_dict(cls, data: dict) -> "UserProfile":
        """Constructs UserProfile instance from dictionary."""
        return cls(
            candidate_name=data.get("candidate_name", "Candidate"),
            target_roles=data.get("target_roles", []),
            skills=data.get("skills", {}),
        )

    @classmethod
    def load_from_json(cls, file_path: Union[str, Path]) -> "UserProfile":
        """Loads UserProfile from JSON file."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"User profile JSON not found at {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)

    def to_dict(self) -> dict:
        """Converts UserProfile to dictionary representation."""
        return {
            "candidate_name": self.candidate_name,
            "target_roles": self.target_roles,
            "skills": self.skills,
        }

    def save_to_json(self, file_path: Union[str, Path]) -> None:
        """Saves UserProfile instance to JSON file."""
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=4)

    def get_known_skills(self, min_proficiency: int = 1) -> Set[str]:
        """
        Returns set of canonical skill names where proficiency >= min_proficiency.
        
        Args:
            min_proficiency (int): Minimum proficiency threshold (default: 1).
            
        Returns:
            Set[str]: Set of skill names candidate possesses.
        """
        return {
            skill for skill, prof in self.skills.items()
            if prof >= min_proficiency
        }

    def get_skill_proficiency(self, skill_name: str) -> int:
        """Returns proficiency score (0-4) for a given skill."""
        return self.skills.get(skill_name, 0)

    def get_binary_vector(self, canonical_skills: List[str]) -> List[int]:
        """
        Generates a binary vector (1/0) corresponding to canonical_skills order.
        
        Args:
            canonical_skills (List[str]): List of canonical skill names.
            
        Returns:
            List[int]: Binary indicator vector.
        """
        known = self.get_known_skills()
        return [1 if s in known else 0 for s in canonical_skills]


def get_default_sample_profile() -> UserProfile:
    """Returns a realistic sample candidate profile for testing/demonstration."""
    return UserProfile(
        candidate_name="Alex Rivera (Early Career Developer)",
        target_roles=[
            "Software Engineering",
            "Data & AI",
            "Web Development",
        ],
        skills={
            "Python": 4,
            "SQL": 4,
            "Git": 3,
            "JavaScript": 3,
            "React": 2,
            "PostgreSQL": 3,
            "HTML/CSS": 3,
            "Docker": 1,
            "AWS": 0,
            "Kubernetes": 0,
            "Linux": 2,
            "REST API": 3,
        },
    )
