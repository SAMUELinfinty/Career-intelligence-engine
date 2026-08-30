import React from 'react';
import { Award, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import './MatchScore.css';

/**
 * Threshold Strategy for Match Scores:
 * - score >= 0.70 (70% - 100%): Strong Match
 * - score >= 0.40 (40% - 69%): Moderate Match
 * - score < 0.40 (0% - 39%): Low Match
 */
export function getScoreInterpretation(score) {
  const percentage = Math.round(score * 100);
  if (score >= 0.7) {
    return {
      level: 'Strong Match',
      colorClass: 'match-strong',
      icon: <CheckCircle className="match-icon" size={24} />,
      description: 'You match most of the important skills required for this position.',
    };
  }
  if (score >= 0.4) {
    return {
      level: 'Moderate Match',
      colorClass: 'match-moderate',
      icon: <Award className="match-icon" size={24} />,
      description: 'You have a solid base for this role, but a few key skills are missing.',
    };
  }
  return {
    level: 'Low Match',
    colorClass: 'match-low-level',
    icon: <AlertCircle className="match-icon" size={24} />,
    description: 'Significant skill gaps exist for this role. Review missing skills and learning recommendations.',
  };
}

export default function MatchScore({ score }) {
  if (score === undefined || score === null) {
    return null;
  }

  const numericScore = typeof score === 'number' ? score : parseFloat(score) || 0;
  const percentage = Math.round(numericScore * 100);
  const interpretation = getScoreInterpretation(numericScore);

  return (
    <div className={`match-score-card ${interpretation.colorClass}`}>
      <div className="match-score-visual">
        <div className="score-ring">
          <span className="score-number">{percentage}%</span>
          <span className="score-label">IDF Match</span>
        </div>
      </div>

      <div className="match-score-details">
        <div className="interpretation-header">
          {interpretation.icon}
          <h3>{interpretation.level}</h3>
        </div>
        <p className="interpretation-desc">{interpretation.description}</p>
        
        <div className="score-progress-bar">
          <div
            className="score-progress-fill"
            style={{ width: `${Math.min(Math.max(percentage, 5), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
