import React from 'react';
import './SkillChart.css';

export default function SkillChart({ skills = [], limit = 10 }) {
  if (!skills || skills.length === 0) {
    return (
      <div className="skill-chart-empty">
        <p>No skill demand data available.</p>
      </div>
    );
  }

  const topSkills = skills.slice(0, limit);
  const maxDemand = Math.max(...topSkills.map((s) => s.demand || 0), 1);

  return (
    <div className="skill-chart-container">
      <div className="chart-bars">
        {topSkills.map((item, idx) => {
          const percentage = item.demand || 0;
          const barWidth = Math.max(Math.round((percentage / maxDemand) * 100), 4);

          return (
            <div key={idx} className="chart-row">
              <div className="chart-label">
                <span className="skill-rank">#{idx + 1}</span>
                <span className="skill-name">{item.skill}</span>
                {item.category && <span className="skill-cat">{item.category}</span>}
              </div>

              <div className="chart-bar-area">
                <div className="chart-bar-bg">
                  <div
                    className="chart-bar-fill"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="chart-value">
                  <strong>{percentage.toFixed(1)}%</strong>
                  {item.postingCount !== undefined && (
                    <span className="posting-count">({item.postingCount} jobs)</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
