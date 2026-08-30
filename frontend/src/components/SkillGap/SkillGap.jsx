import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import './SkillGap.css';

export default function SkillGap({ matchedSkills = [], missingSkills = [] }) {
  const hasMatched = matchedSkills.length > 0;
  const hasMissing = missingSkills.length > 0;

  if (!hasMatched && !hasMissing) {
    return (
      <div className="skill-gap-empty">
        <p>No skill analysis data available.</p>
      </div>
    );
  }

  return (
    <div className="skill-gap-container">
      {/* Matched Skills Column */}
      <div className="skill-gap-card skill-gap-matched">
        <div className="skill-gap-header">
          <div className="header-badge matched-badge">
            <Check size={16} />
            <span>Matched Skills</span>
          </div>
          <span className="skill-count">{matchedSkills.length}</span>
        </div>

        {hasMatched ? (
          <div className="skill-list">
            {matchedSkills.map((skill, idx) => (
              <div key={idx} className="skill-item skill-matched-item">
                <Check size={14} className="icon-check" />
                <span>{skill}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-skills-msg">No skills currently matched for this position.</p>
        )}
      </div>

      {/* Missing Skills Column */}
      <div className="skill-gap-card skill-gap-missing">
        <div className="skill-gap-header">
          <div className="header-badge missing-badge">
            <X size={16} />
            <span>Missing Skills</span>
          </div>
          <span className="skill-count">{missingSkills.length}</span>
        </div>

        {hasMissing ? (
          <div className="skill-list">
            {missingSkills.map((skill, idx) => (
              <div key={idx} className="skill-item skill-missing-item">
                <X size={14} className="icon-x" />
                <span>{skill}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="all-matched-msg">
            <Sparkles size={18} />
            <span>Awesome! You meet all required skills for this job.</span>
          </div>
        )}
      </div>
    </div>
  );
}
