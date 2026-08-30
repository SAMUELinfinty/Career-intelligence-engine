import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, ArrowRight } from 'lucide-react';
import './JobCard.css';

export default function JobCard({ job, matchScore }) {
  if (!job) return null;

  const formattedSalary = job.salary
    ? `$${(job.salary / 1000).toFixed(0)}k/yr`
    : job.minSalary && job.maxSalary
    ? `$${(job.minSalary / 1000).toFixed(0)}k - $${(job.maxSalary / 1000).toFixed(0)}k/yr`
    : null;

  const displayedSkills = (job.skills || []).slice(0, 5);
  const hiddenCount = (job.skills || []).length - displayedSkills.length;

  return (
    <div className="card card-interactive job-card">
      <div className="job-card-header">
        <div className="job-card-title-group">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
        </div>

        {matchScore !== undefined && matchScore !== null && (
          <div className={`match-badge ${matchScore >= 0.7 ? 'match-high' : matchScore >= 0.4 ? 'match-med' : 'match-low'}`}>
            <span>Match</span>
            <strong>{Math.round(matchScore * 100)}%</strong>
          </div>
        )}
      </div>

      <div className="job-card-meta">
        <span className="meta-item">
          <MapPin size={14} />
          {job.isRemote ? 'Remote' : job.location || 'Flexible'}
        </span>
        {job.experienceLevel && (
          <span className="meta-item">
            <Briefcase size={14} />
            {job.experienceLevel}
          </span>
        )}
        {formattedSalary && (
          <span className="meta-item salary-tag">
            <DollarSign size={14} />
            {formattedSalary}
          </span>
        )}
      </div>

      <div className="job-card-skills">
        {displayedSkills.map((skill, idx) => (
          <span key={idx} className="badge badge-neutral">
            {skill}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="badge badge-neutral hidden-skills">+ {hiddenCount} more</span>
        )}
      </div>

      <div className="job-card-footer">
        <span className="job-category">{job.roleCategory || 'Tech & Engineering'}</span>
        <Link to={`/jobs/${job.id}`} className="btn btn-secondary btn-sm">
          <span>View Job</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
