import React, { useEffect, useState } from 'react';
import { Lightbulb, Flame, RefreshCw, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { fetchRecommendations } from '../services/api';
import RecommendationCard from '../components/RecommendationCard/RecommendationCard';
import './Recommendations.css';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecommendations(20);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err.message || 'Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  // Collect unique categories
  const categories = ['All', ...new Set(recommendations.map((r) => r.category).filter(Boolean))];

  const filteredRecommendations = selectedCategory === 'All'
    ? recommendations
    : recommendations.filter((r) => r.category === selectedCategory);

  return (
    <div className="app-container">
      <div className="recommendations-header">
        <div>
          <div className="rec-title-tag">
            <Sparkles size={16} />
            <span>SKILL PRIORITY ENGINE</span>
          </div>
          <h1>What Should I Learn Next?</h1>
          <p className="subtitle">
            Prioritized skill recommendations computed from your current profile gaps, target roles, and real market job posting frequency.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      {!loading && !error && categories.length > 1 && (
        <div className="rec-filter-bar">
          <span className="filter-label">
            <Filter size={14} />
            Category:
          </span>
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'pill-active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="grid-2" style={{ marginTop: '1.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '240px' }} />
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load recommendations:</strong> {error}
            <button onClick={loadRecommendations} className="btn btn-secondary btn-sm" style={{ marginLeft: '1rem' }}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          <Lightbulb size={36} style={{ color: 'var(--amber)', marginBottom: '0.75rem' }} />
          <h3>No recommendations found for this category</h3>
          <p>You may already have acquired all key skills in this domain or need to update your target roles in your profile.</p>
        </div>
      ) : (
        <div className="grid-2" style={{ marginTop: '1.5rem' }}>
          {filteredRecommendations.map((rec, idx) => (
            <RecommendationCard key={idx} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
