import React from 'react';
import { Flame, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './RecommendationCard.css';

export default function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const {
    skill,
    category,
    priority,
    demandLevel,
    roleRelevancePct,
    marketDemandPct,
    reason,
  } = recommendation;

  const isHighPriority = demandLevel === 'High' || priority > 0.15;
  const isMediumPriority = demandLevel === 'Medium' || (priority >= 0.08 && priority <= 0.15);

  return (
    <div className="card card-interactive recommendation-card">
      <div className="rec-card-header">
        <div className="rec-title-group">
          <div className="rec-skill-name">
            {isHighPriority && <Flame className="flame-icon" size={20} />}
            <h3>{skill}</h3>
          </div>
          <span className="rec-category-badge">{category}</span>
        </div>

        <div className={`rec-priority-badge ${isHighPriority ? 'p-high' : isMediumPriority ? 'p-med' : 'p-low'}`}>
          <span>Priority</span>
          <strong>{demandLevel || (isHighPriority ? 'High' : 'Medium')}</strong>
        </div>
      </div>

      <p className="rec-reason">{reason}</p>

      <div className="rec-metrics-grid">
        <div className="metric-box">
          <span className="metric-label">
            <TrendingUp size={13} />
            Market Demand
          </span>
          <span className="metric-value">{marketDemandPct ? `${marketDemandPct.toFixed(1)}%` : 'N/A'}</span>
          <div className="metric-bar">
            <div className="metric-bar-fill market-fill" style={{ width: `${Math.min(marketDemandPct || 0, 100)}%` }} />
          </div>
        </div>

        <div className="metric-box">
          <span className="metric-label">
            <Target size={13} />
            Target Role Relevance
          </span>
          <span className="metric-value">{roleRelevancePct ? `${roleRelevancePct.toFixed(1)}%` : 'N/A'}</span>
          <div className="metric-bar">
            <div className="metric-bar-fill role-fill" style={{ width: `${Math.min(roleRelevancePct || 0, 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="rec-card-footer">
        <Link to={`/jobs?skill=${encodeURIComponent(skill)}`} className="btn btn-secondary btn-sm">
          <span>Find jobs requiring {skill}</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
