import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { fetchJobById, matchJob } from '../services/api';
import MatchScore from '../components/MatchScore/MatchScore';
import SkillGap from '../components/SkillGap/SkillGap';
import './JobDetails.css';

export default function JobDetails() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState(null);

  const loadJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobById(id);
      setJob(data);

      // Auto-trigger initial match analysis
      runMatch(data.id);
    } catch (err) {
      setError(err.message || 'Job not found.');
    } finally {
      setLoading(false);
    }
  };

  const runMatch = async (jobIdToMatch) => {
    setMatching(true);
    try {
      const result = await matchJob(jobIdToMatch || id);
      setMatchData(result);
    } catch (err) {
      console.error('Match failed:', err);
    } finally {
      setMatching(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  if (loading) {
    return (
      <div className="app-container">
        <div className="skeleton" style={{ height: '300px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: '200px' }} />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="app-container">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>{error || 'Job posting not found.'}</div>
        </div>
        <Link to="/jobs" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Jobs</span>
        </Link>
      </div>
    );
  }

  const formattedSalary = job.normalizedSalary
    ? `$${(job.normalizedSalary / 1000).toFixed(0)}k/yr`
    : job.minSalary && job.maxSalary
    ? `$${(job.minSalary / 1000).toFixed(0)}k - $${(job.maxSalary / 1000).toFixed(0)}k/yr`
    : 'Competitive / Not specified';

  return (
    <div className="app-container">
      {/* Back Link */}
      <div className="back-link-wrapper">
        <Link to="/jobs" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Job Listings</span>
        </Link>
      </div>

      {/* Main Job Overview Card */}
      <div className="card job-details-header-card">
        <div className="header-meta-row">
          <span className="badge badge-primary">{job.roleCategory || 'Engineering'}</span>
          <span className="job-id-tag">Posting ID: {job.id}</span>
        </div>

        <h1 className="job-details-title">{job.title}</h1>
        
        <div className="job-company-row">
          <Building2 size={18} className="company-icon" />
          <span className="company-name">{job.company}</span>
        </div>

        <div className="job-tags-grid">
          <div className="tag-box">
            <MapPin size={16} />
            <span>{job.isRemote ? 'Remote Work' : job.location || 'On-Site'}</span>
          </div>

          <div className="tag-box">
            <Briefcase size={16} />
            <span>{job.experienceLevel || 'All Levels'} ({job.workType || 'Full-Time'})</span>
          </div>

          <div className="tag-box salary-box">
            <DollarSign size={16} />
            <span>{formattedSalary}</span>
          </div>
        </div>

        {/* Skill Pills */}
        <div className="required-skills-section">
          <h4>Required Skills ({job.skills?.length || 0})</h4>
          <div className="skills-pill-flex">
            {(job.skills || []).map((skill, idx) => (
              <span key={idx} className="badge badge-neutral">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Match Analysis Section */}
      <div className="match-analysis-section" style={{ marginTop: '2rem' }}>
        <div className="match-section-title">
          <div>
            <h2>Candidate Match Analysis</h2>
            <p className="subtitle" style={{ marginBottom: '1rem' }}>
              IDF-weighted skill compatibility calculated by backend intelligence engine.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => runMatch(job.id)}
            disabled={matching}
          >
            <RefreshCw size={14} className={matching ? 'spin' : ''} />
            <span>Re-Analyze Match</span>
          </button>
        </div>

        {matching && !matchData ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
            <p>Computing IDF skill weights against your profile...</p>
          </div>
        ) : matchData ? (
          <div className="match-results-stack">
            {/* Match Score Display */}
            <MatchScore score={matchData.matchScore} />

            {/* Skill Gap Component */}
            <div style={{ marginTop: '1.5rem' }}>
              <SkillGap
                matchedSkills={matchData.matchedSkills}
                missingSkills={matchData.missingSkills}
              />
            </div>

            {/* Next Steps CTA */}
            {matchData.missingSkills?.length > 0 && (
              <div className="card cta-learning-card" style={{ marginTop: '1.5rem' }}>
                <div className="cta-content">
                  <Lightbulb size={24} className="cta-icon" />
                  <div>
                    <h4>Want to improve your match for this role?</h4>
                    <p>
                      You are missing <strong>{matchData.missingSkills.length} key skill(s)</strong>: {matchData.missingSkills.join(', ')}. View prioritized market recommendations to close this gap.
                    </p>
                  </div>
                </div>
                <Link to="/recommendations" className="btn btn-primary">
                  <span>What Should I Learn Next?</span>
                  <Sparkles size={16} />
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
