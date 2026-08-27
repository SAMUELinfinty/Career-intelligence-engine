"""
skill_dictionary.py
Centralized Technical Skill Dictionary & Pattern Matching Engine for the Career Intelligence Engine.
"""

import re
from typing import Dict, List, Set

# Comprehensive Skill Catalog: Name -> {category, patterns}
SKILL_CATALOG: Dict[str, Dict] = {
    # -------------------------------------------------------------------------
    # Programming Languages
    # -------------------------------------------------------------------------
    "Python": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bpython\b"]
    },
    "Java": {
        "category": "Programming Languages",
        "patterns": [r"\bJava\b(?!\s*Script|\s*script)"]
    },
    "JavaScript": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bjavascript\b", r"(?i)\bjs\b", r"(?i)\becmascript\b"]
    },
    "TypeScript": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\btypescript\b", r"(?i)\bts\b"]
    },
    "C++": {
        "category": "Programming Languages",
        "patterns": [r"\bC\+\+(?!\w)", r"(?i)\bcpp\b"]
    },
    "C#": {
        "category": "Programming Languages",
        "patterns": [r"\bC#(?!\w)", r"(?i)\bc\s*sharp\b"]
    },
    "C": {
        "category": "Programming Languages",
        "patterns": [r"\bC\b(?!\s*#|\s*\+\+|\s*programming|\s*suite)", r"(?i)\bc\s+programming\b"]
    },
    "Go": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bgolang\b", r"(?i)\bgo\s+programming\b", r"(?i)\bgo\s+language\b", r"\bGo\b\s+(?:developer|engineer|code)"]
    },
    "Rust": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\brust\b", r"(?i)\brustlang\b"]
    },
    "SQL": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bsql\b", r"(?i)\bstructured\s+query\s+language\b"]
    },
    "R": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\br\s+programming\b", r"(?i)\br\s+language\b", r"\bR\b\s+(?:studio|stats|data)"]
    },
    "PHP": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bphp\b"]
    },
    "Ruby": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bruby\b", r"(?i)\bruby\s+on\s+rails\b"]
    },
    "Kotlin": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bkotlin\b"]
    },
    "Swift": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bswift\b"]
    },
    "Scala": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bscala\b"]
    },
    "Bash/Shell": {
        "category": "Programming Languages",
        "patterns": [r"(?i)\bbash\b", r"(?i)\bshell\s+scripting\b", r"(?i)\bpowershell\b", r"(?i)\bzsh\b"]
    },

    # -------------------------------------------------------------------------
    # Web & Frameworks
    # -------------------------------------------------------------------------
    "React": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\breact(?:\.js|js)?\b", r"(?i)\breactnative\b", r"(?i)\breact\s+native\b"]
    },
    "Node.js": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bnode(?:\.js|js)?\b", r"(?i)\bnodejs\b"]
    },
    "Express": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bexpress(?:\.js|js)?\b", r"(?i)\bexpressjs\b"]
    },
    "Angular": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bangular(?:\.js|js)?\b", r"(?i)\bangularjs\b"]
    },
    "Vue": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bvue(?:\.js|js)?\b", r"(?i)\bvuejs\b"]
    },
    "Next.js": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bnext(?:\.js|js)?\b", r"(?i)\bnextjs\b"]
    },
    "Django": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bdjango\b"]
    },
    "Flask": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bflask\b"]
    },
    "FastAPI": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bfastapi\b"]
    },
    "Spring Boot": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bspring\s*boot\b", r"(?i)\bspring\s+framework\b"]
    },
    "ASP.NET": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\basp\.net\b", r"(?i)\bdotnet\b", r"(?i)\b\.net\b"]
    },
    "HTML/CSS": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bhtml5?\b", r"(?i)\bcss3?\b", r"(?i)\bhtml\s*/\s*css\b"]
    },
    "Tailwind": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\btailwind(?:\s*css)?\b"]
    },
    "GraphQL": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\bgraphql\b"]
    },
    "REST API": {
        "category": "Web & Frameworks",
        "patterns": [r"(?i)\brestful\b", r"(?i)\brest\s+apis?\b", r"(?i)\brest\s+web\s+services\b"]
    },

    # -------------------------------------------------------------------------
    # Databases
    # -------------------------------------------------------------------------
    "PostgreSQL": {
        "category": "Databases",
        "patterns": [r"(?i)\bpostgres\b", r"(?i)\bpostgresql\b"]
    },
    "MySQL": {
        "category": "Databases",
        "patterns": [r"(?i)\bmysql\b"]
    },
    "MongoDB": {
        "category": "Databases",
        "patterns": [r"(?i)\bmongodb\b", r"(?i)\bmongo\b"]
    },
    "Redis": {
        "category": "Databases",
        "patterns": [r"(?i)\bredis\b"]
    },
    "SQLite": {
        "category": "Databases",
        "patterns": [r"(?i)\bsqlite\b"]
    },
    "Oracle": {
        "category": "Databases",
        "patterns": [r"(?i)\boracle\s+db\b", r"(?i)\boracle\s+database\b"]
    },
    "Cassandra": {
        "category": "Databases",
        "patterns": [r"(?i)\bcassandra\b"]
    },
    "Elasticsearch": {
        "category": "Databases",
        "patterns": [r"(?i)\belasticsearch\b", r"(?i)\belastic\s+search\b"]
    },
    "DynamoDB": {
        "category": "Databases",
        "patterns": [r"(?i)\bdynamodb\b", r"(?i)\bdynamo\b"]
    },

    # -------------------------------------------------------------------------
    # Cloud & DevOps
    # -------------------------------------------------------------------------
    "AWS": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\baws\b", r"(?i)\bamazon\s+web\s+services\b"]
    },
    "Azure": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bazure\b", r"(?i)\bmicrosoft\s+azure\b"]
    },
    "GCP": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bgcp\b", r"(?i)\bgoogle\s+cloud(?:\s+platform)?\b"]
    },
    "Docker": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bdocker\b", r"(?i)\bcontainerization\b"]
    },
    "Kubernetes": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bkubernetes\b", r"(?i)\bk8s\b"]
    },
    "Terraform": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bterraform\b", r"(?i)\binfrastructure\s+as\s+code\b", r"(?i)\biac\b"]
    },
    "CI/CD": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bci\s*/\s*cd\b", r"(?i)\bcontinuous\s+integration\b"]
    },
    "Jenkins": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bjenkins\b"]
    },
    "Ansible": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bansible\b"]
    },
    "Linux": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\blinux\b", r"(?i)\bunix\b", r"(?i)\bubuntu\b", r"(?i)\bredhat\b"]
    },
    "Git": {
        "category": "Cloud & DevOps",
        "patterns": [r"(?i)\bgit\b", r"(?i)\bgithub\b", r"(?i)\bgitlab\b", r"(?i)\bbitbucket\b"]
    },

    # -------------------------------------------------------------------------
    # Data & Analytics
    # -------------------------------------------------------------------------
    "Pandas": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bpandas\b"]
    },
    "NumPy": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bnumpy\b"]
    },
    "Spark": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bpyspark\b", r"(?i)\bapache\s+spark\b"]
    },
    "Tableau": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\btableau\b"]
    },
    "Power BI": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bpower\s*bi\b"]
    },
    "Hadoop": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bhadoop\b"]
    },
    "Snowflake": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bsnowflake\b"]
    },
    "Databricks": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bdatabricks\b"]
    },
    "BigQuery": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bbigquery\b"]
    },
    "Airflow": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bapache\s+airflow\b", r"(?i)\bairflow\b"]
    },
    "Excel": {
        "category": "Data & Analytics",
        "patterns": [r"(?i)\bmicrosoft\s+excel\b", r"(?i)\bexcel\b"]
    },

    # -------------------------------------------------------------------------
    # Machine Learning & AI
    # -------------------------------------------------------------------------
    "Scikit-Learn": {
        "category": "ML & AI",
        "patterns": [r"(?i)\bscikit-learn\b", r"(?i)\bsklearn\b"]
    },
    "TensorFlow": {
        "category": "ML & AI",
        "patterns": [r"(?i)\btensorflow\b", r"(?i)\btf\b"]
    },
    "PyTorch": {
        "category": "ML & AI",
        "patterns": [r"(?i)\bpytorch\b"]
    },
    "Keras": {
        "category": "ML & AI",
        "patterns": [r"(?i)\bkeras\b"]
    },
    "NLP": {
        "category": "ML & AI",
        "patterns": [r"(?i)\bnlp\b", r"(?i)\bnatural\s+language\s+processing\b"]
    },
    "Computer Vision": {
        "category": "ML & AI",
        "patterns": [r"(?i)\bcomputer\s+vision\b", r"(?i)\bopencv\b"]
    },
    "Generative AI / LLM": {
        "category": "ML & AI",
        "patterns": [r"(?i)\bllm\b", r"(?i)\bllms\b", r"(?i)\blarge\s+language\s+models?\b", r"(?i)\bgenerative\s+ai\b", r"(?i)\bgenai\b"]
    },

    # -------------------------------------------------------------------------
    # Cybersecurity
    # -------------------------------------------------------------------------
    "SIEM": {
        "category": "Cybersecurity",
        "patterns": [r"(?i)\bsiem\b"]
    },
    "SOC": {
        "category": "Cybersecurity",
        "patterns": [r"(?i)\bsoc\b", r"(?i)\bsecurity\s+operations\s+center\b"]
    },
    "Splunk": {
        "category": "Cybersecurity",
        "patterns": [r"(?i)\bsplunk\b"]
    },
    "Penetration Testing": {
        "category": "Cybersecurity",
        "patterns": [r"(?i)\bpen\s+testing\b", r"(?i)\bpenetration\s+testing\b", r"(?i)\bethical\s+hacking\b"]
    },
    "Vulnerability Management": {
        "category": "Cybersecurity",
        "patterns": [r"(?i)\bvulnerability\s+management\b", r"(?i)\bvulnerability\s+assessment\b"]
    },
    "IAM": {
        "category": "Cybersecurity",
        "patterns": [r"(?i)\biam\b", r"(?i)\bidentity\s+and\s+access\s+management\b"]
    },
    "Network Security": {
        "category": "Cybersecurity",
        "patterns": [r"(?i)\bnetwork\s+security\b", r"(?i)\bfirewall\b", r"(?i)\bwireshark\b"]
    },

    # -------------------------------------------------------------------------
    # GRC & Compliance
    # -------------------------------------------------------------------------
    "Risk Assessment": {
        "category": "GRC & Compliance",
        "patterns": [r"(?i)\brisk\s+assessment\b", r"(?i)\brisk\s+management\b"]
    },
    "Compliance": {
        "category": "GRC & Compliance",
        "patterns": [r"(?i)\bregulatory\s+compliance\b", r"(?i)\bcompliance\b"]
    },
    "ISO 27001": {
        "category": "GRC & Compliance",
        "patterns": [r"(?i)\biso\s*27001\b"]
    },
    "SOC 2": {
        "category": "GRC & Compliance",
        "patterns": [r"(?i)\bsoc\s*2\b"]
    },
    "NIST": {
        "category": "GRC & Compliance",
        "patterns": [r"(?i)\bnist\b"]
    },
    "Governance & Audit": {
        "category": "GRC & Compliance",
        "patterns": [r"(?i)\bit\s+governance\b", r"(?i)\bit\s+audit\b", r"(?i)\bgdpr\b", r"(?i)\bhipaa\b"]
    }
}


# Precompile regex patterns for maximum extraction speed
COMPILED_SKILL_PATTERNS: Dict[str, List[re.Pattern]] = {}
for skill_name, meta in SKILL_CATALOG.items():
    COMPILED_SKILL_PATTERNS[skill_name] = [re.compile(p) for p in meta["patterns"]]


def extract_skills_from_text(text: str) -> List[str]:
    """
    Extracts canonical skill names present in the text using compiled regex patterns.
    
    Args:
        text (str): Cleaned or raw text string.
        
    Returns:
        List[str]: List of canonical skill names matched in text.
    """
    if not text or not isinstance(text, str):
        return []
        
    matched_skills = []
    for skill_name, patterns in COMPILED_SKILL_PATTERNS.items():
        for pattern in patterns:
            if pattern.search(text):
                matched_skills.append(skill_name)
                break  # Matched once for this skill, move to next skill
                
    return matched_skills


def get_all_canonical_skills() -> List[str]:
    """Returns sorted list of all canonical skill names in dictionary."""
    return sorted(list(SKILL_CATALOG.keys()))


def get_skill_category_map() -> Dict[str, str]:
    """Returns mapping of canonical skill name -> domain category."""
    return {skill_name: meta["category"] for skill_name, meta in SKILL_CATALOG.items()}
