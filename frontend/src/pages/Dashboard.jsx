import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  Flame,
  Briefcase,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import {
  fetchProfile,
  fetchMarketSkills,
  fetchMarketRoles,
  fetchRecommendations,
  fetchJobs,
  matchJob
} from '../services/api';
import JobCard from '../components/JobCard/JobCard';
import SkillChart from '../components/SkillChart/SkillChart';
import './Dashboard.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [marketSkills, setMarketSkills] = useState([]);
  const [marketRoles, setMarketRoles] = useState([]);
  const [topRecommendation, setTopRecommendation] = useState(null);
  const [topJobs, setTopJobs] = useState([]);
  const [jobMatches, setJobMatches] = useState({});

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel API fetching
      const [profileRes, marketSkillsRes, marketRolesRes, recsRes, jobsRes] = await Promise.allSettled([
        fetchProfile(),
        fetchMarketSkills(),
        fetchMarketRoles(),
        fetchRecommendations(1),
        fetchJobs({ limit: 6 }),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      if (marketSkillsRes.status === 'fulfilled') setMarketSkills(marketSkillsRes.value.skills || []);
      if (marketRolesRes.status === 'fulfilled') setMarketRoles(marketRolesRes.value.roles || []);
      if (recsRes.status === 'fulfilled' && recsRes.value.recommendations?.length > 0) {
        setTopRecommendation(recsRes.value.recommendations[0]);
      }

      if (jobsRes.status === 'fulfilled') {
        const fetchedJobs = jobsRes.value.jobs || [];
        setTopJobs(fetchedJobs);

        // Calculate match scores for the top 6 jobs in parallel
        const matchPromises = fetchedJobs.map((job) =>
          matchJob(job.id)
            .then((res) => ({ id: job.id, score: res.matchScore }))
            .catch(() => ({ id: job.id, score: null }))
        );
        const matchResults = await Promise.all(matchPromises);
        const matchMap = {};
        matchResults.forEach((item) => {
          if (item.score !== null) matchMap[item.id] = item.score;
        });
        setJobMatches(matchMap);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="app-container dashboard-loading">
        <div className="loading-banner">
          <div className="spinner" />
          <p>Analyzing job market & computing career matches...</p>
        </div>
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <div className="skeleton" style={{ height: '140px' }} />
          <div className="skeleton" style={{ height: '140px' }} />
          <div className="skeleton" style={{ height: '140px' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load dashboard:</strong> {error}
          </div>
        </div>
        <button onClick={loadDashboardData} className="btn btn-primary">
          <RefreshCw size={16} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const userSkillCount = profile?.skills?.length || 0;
  const userTargetRoles = profile?.targetRoles || [];

  return (
    <div className="app-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div>
          <h1>Career Intelligence Dashboard</h1>
          <p className="subtitle">
            Welcome back, <strong>{profile?.name || 'Candidate'}</strong>! Here is your tech job market pulse & skill alignment overview.
          </p>
        </div>
        <Link to="/jobs" className="btn btn-primary">
          <span>Explore All Jobs</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Metrics Banner */}
      <div className="grid-4 metrics-overview">
        <div className="card metric-card">
          <div className="metric-icon primary-icon">
            <Cpu size={22} />
          </div>
          <div>
            <span className="metric-title">Your Skills</span>
            <h3 className="metric-number">{userSkillCount}</h3>
            <span className="metric-sub">Tracked in Profile</span>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon emerald-icon">
            <Target size={22} />
          </div>
          <div>
            <span className="metric-title">Target Roles</span>
            <h3 className="metric-number">{userTargetRoles.length}</h3>
            <span className="metric-sub">{userTargetRoles.join(', ') || 'All Roles'}</span>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon amber-icon">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="metric-title">Market Skills</span>
            <h3 className="metric-number">{marketSkills.length}</h3>
            <span className="metric-sub">Analyzed Postings</span>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-icon cyan-icon">
            <Briefcase size={22} />
          </div>
          <div>
            <span className="metric-title">Active Postings</span>
            <h3 className="metric-number">{topJobs.length > 0 ? `${topJobs.length}+` : '0'}</h3>
            <span className="metric-sub">Ready for Match</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Intelligence Highlights & Recommended Skill */}
        <div className="dashboard-left">
          {/* Top Priority Recommended Skill Highlight */}
          {topRecommendation && (
            <div className="card highlight-card">
              <div className="highlight-badge">
                <Flame size={18} className="flame-pulse" />
                <span>TOP LEARNING RECOMMENDATION</span>
              </div>
              <div className="highlight-body">
                <h2>{topRecommendation.skill}</h2>
                <span className="badge badge-amber">{topRecommendation.category}</span>
                <p className="highlight-reason">{topRecommendation.reason}</p>

                <div className="highlight-stats">
                  <div className="h-stat">
                    <span>Demand Level</span>
                    <strong>{topRecommendation.demandLevel}</strong>
                  </div>
                  <div className="h-stat">
                    <span>Role Relevance</span>
                    <strong>{topRecommendation.roleRelevancePct.toFixed(1)}%</strong>
                  </div>
                  <div className="h-stat">
                    <span>Market Demand</span>
                    <strong>{topRecommendation.marketDemandPct.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
              <div className="highlight-footer">
                <Link to="/recommendations" className="btn btn-outline btn-sm">
                  <span>View All Recommendations</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* Top Job Matches */}
          <div className="section-block">
            <div className="section-header">
              <h2>Top Job Matches</h2>
              <Link to="/jobs" className="see-all-link">
                See all jobs &rarr;
              </Link>
            </div>

            <div className="grid-2">
              {topJobs.slice(0, 4).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  matchScore={jobMatches[job.id]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Market Intelligence & Skills */}
        <div className="dashboard-right">
          <div className="card market-card-section">
            <div className="section-header">
              <h3>
                <TrendingUp size={18} className="header-icon" />
                Market Skill Demand
              </h3>
              <span className="badge badge-primary">CS Postings</span>
            </div>
            <p className="section-subtext">
              Top technical skills required across tech job postings in the database.
            </p>
            <SkillChart skills={marketSkills} limit={8} />
          </div>

          {/* Target Role Breakdown */}
          <div className="card roles-overview-section" style={{ marginTop: '1.5rem' }}>
            <h3>
              <Target size={18} className="header-icon" />
              Target Role Skill Insights
            </h3>
            <div className="roles-list">
              {marketRoles.slice(0, 4).map((r, idx) => (
                <div key={idx} className="role-insight-item">
                  <div className="role-title-row">
                    <span className="role-name">{r.role}</span>
                    <span className="badge badge-neutral">{r.topSkills.length} key skills</span>
                  </div>
                  <div className="role-skills-flex">
                    {r.topSkills.slice(0, 4).map((sk, sIdx) => (
                      <span key={sIdx} className="badge badge-cyan">
                        {sk.skill} ({(sk.frequency * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
