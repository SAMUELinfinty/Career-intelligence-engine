/**
 * Centralized API Service for Career Intelligence Engine
 * Consumes REST API exposed by Node.js + Express backend
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Jobs API
// ---------------------------------------------------------------------------
export async function fetchJobs(filters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/api/jobs${queryString}`);
}

export async function fetchJobById(id) {
  return request(`/api/jobs/${id}`);
}

// ---------------------------------------------------------------------------
// Skills API
// ---------------------------------------------------------------------------
export async function fetchSkills() {
  return request('/api/skills');
}

export async function fetchSkillById(id) {
  return request(`/api/skills/${id}`);
}

// ---------------------------------------------------------------------------
// Market API
// ---------------------------------------------------------------------------
export async function fetchMarketSkills() {
  return request('/api/market/skills');
}

export async function fetchMarketRoles() {
  return request('/api/market/roles');
}

// ---------------------------------------------------------------------------
// Roles API
// ---------------------------------------------------------------------------
export async function fetchRoles() {
  return request('/api/roles');
}

export async function fetchRoleById(id) {
  return request(`/api/roles/${id}`);
}

// ---------------------------------------------------------------------------
// Profile API
// ---------------------------------------------------------------------------
export async function fetchProfile() {
  return request('/api/profile');
}

export async function updateProfile(payload) {
  return request('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Job Matching API
// ---------------------------------------------------------------------------
export async function matchJob(jobId) {
  return request('/api/match', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
  });
}

// ---------------------------------------------------------------------------
// Recommendations API
// ---------------------------------------------------------------------------
export async function fetchRecommendations(limit = 10) {
  return request(`/api/recommendations?limit=${limit}`);
}
