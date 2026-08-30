import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RefreshCw, AlertCircle, Briefcase, SlidersHorizontal } from 'lucide-react';
import { fetchJobs, fetchRoles, matchJob } from '../services/api';
import JobCard from '../components/JobCard/JobCard';
import './Jobs.css';

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state initialized from URL query params
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [skill, setSkill] = useState(searchParams.get('skill') || '');
  const [experience, setExperience] = useState(searchParams.get('experience') || '');
  const [remote, setRemote] = useState(searchParams.get('remote') || '');

  const [jobs, setJobs] = useState([]);
  const [jobMatches, setJobMatches] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load roles list for filter dropdown
  useEffect(() => {
    fetchRoles()
      .then((res) => setAvailableRoles(res.roles || []))
      .catch(() => {});
  }, []);

  // Fetch jobs whenever filters change
  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        role,
        location,
        skill,
        experience,
        remote,
        limit: 50,
      };

      const res = await fetchJobs(filters);
      const fetchedJobs = res.jobs || [];
      setJobs(fetchedJobs);

      // Compute match scores for the fetched jobs
      if (fetchedJobs.length > 0) {
        const matchPromises = fetchedJobs.slice(0, 20).map((job) =>
          matchJob(job.id)
            .then((mRes) => ({ id: job.id, score: mRes.matchScore }))
            .catch(() => ({ id: job.id, score: null }))
        );
        const results = await Promise.all(matchPromises);
        const map = {};
        results.forEach((item) => {
          if (item.score !== null) map[item.id] = item.score;
        });
        setJobMatches(map);
      } else {
        setJobMatches({});
      }
    } catch (err) {
      setError(err.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [role, location, skill, experience, remote]);

  // Update query params in URL
  const handleFilterSubmit = (e) => {
    if (e) e.preventDefault();
    const params = {};
    if (role) params.role = role;
    if (location) params.location = location;
    if (skill) params.skill = skill;
    if (experience) params.experience = experience;
    if (remote) params.remote = remote;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setRole('');
    setLocation('');
    setSkill('');
    setExperience('');
    setRemote('');
    setSearchParams({});
  };

  return (
    <div className="app-container">
      <div className="jobs-page-header">
        <div>
          <h1>Job Discovery</h1>
          <p className="subtitle">
            Explore technology job postings and inspect automated IDF skill match scores.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <form className="card jobs-filter-card" onSubmit={handleFilterSubmit}>
        <div className="filter-header">
          <SlidersHorizontal size={18} className="filter-icon" />
          <span>Filter Job Postings</span>
        </div>

        <div className="filter-grid">
          {/* Role Filter */}
          <div className="form-group">
            <label htmlFor="role-filter">Role Category</label>
            <select
              id="role-filter"
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">All Role Categories</option>
              {availableRoles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Filter */}
          <div className="form-group">
            <label htmlFor="skill-filter">Skill Keyword</label>
            <input
              id="skill-filter"
              type="text"
              className="input"
              placeholder="e.g. Python, Docker, SQL..."
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>

          {/* Location Filter */}
          <div className="form-group">
            <label htmlFor="location-filter">Location</label>
            <input
              id="location-filter"
              type="text"
              className="input"
              placeholder="e.g. San Francisco, NY..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Experience Filter */}
          <div className="form-group">
            <label htmlFor="exp-filter">Experience Level</label>
            <select
              id="exp-filter"
              className="select"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="">All Experience Levels</option>
              <option value="Internship">Internship</option>
              <option value="Entry level">Entry Level</option>
              <option value="Associate">Associate</option>
              <option value="Mid-Senior level">Mid-Senior Level</option>
            </select>
          </div>

          {/* Remote Toggle */}
          <div className="form-group">
            <label htmlFor="remote-filter">Work Location</label>
            <select
              id="remote-filter"
              className="select"
              value={remote}
              onChange={(e) => setRemote(e.target.value)}
            >
              <option value="">All Work Types</option>
              <option value="true">Remote Only</option>
              <option value="false">On-site / Hybrid Only</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
            Clear Filters
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            <Search size={14} />
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* Main Results Content */}
      {loading ? (
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '220px' }} />
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load jobs:</strong> {error}
            <button onClick={loadJobs} className="btn btn-secondary btn-sm" style={{ marginLeft: '1rem' }}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          <Briefcase size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3>No jobs found matching your filters</h3>
          <p>Try clearing your search query or loosening filter criteria (such as role, skill, or location).</p>
          <button className="btn btn-secondary" onClick={handleResetFilters}>
            Reset All Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="results-count-bar">
            <span>Showing <strong>{jobs.length}</strong> technology job postings</span>
          </div>

          <div className="grid-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                matchScore={jobMatches[job.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
