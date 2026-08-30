import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Career Intelligence Engine &copy; 2026</span>
          <span>IDF Matcher &bull; Modular express REST API &bull; PostgreSQL Data Engine</span>
        </div>
      </footer>
    </div>
  );
}
