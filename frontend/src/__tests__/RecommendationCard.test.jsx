import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import RecommendationCard from '../components/RecommendationCard/RecommendationCard';

describe('RecommendationCard Component', () => {
  const sampleRec = {
    skill: 'Docker',
    category: 'Cloud & DevOps',
    priority: 0.205,
    demandLevel: 'High',
    roleRelevancePct: 24.2,
    marketDemandPct: 18.8,
    reason: 'Docker appears frequently in your target roles and is currently missing from your skill profile.',
  };

  it('renders recommendation skill name and priority badge', () => {
    render(
      <BrowserRouter>
        <RecommendationCard recommendation={sampleRec} />
      </BrowserRouter>
    );

    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Cloud & DevOps')).toBeInTheDocument();
  });

  it('renders market demand and role relevance percentages', () => {
    render(
      <BrowserRouter>
        <RecommendationCard recommendation={sampleRec} />
      </BrowserRouter>
    );

    expect(screen.getByText('18.8%')).toBeInTheDocument();
    expect(screen.getByText('24.2%')).toBeInTheDocument();
  });

  it('renders reason explanation', () => {
    render(
      <BrowserRouter>
        <RecommendationCard recommendation={sampleRec} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Docker appears frequently in your target roles/i)).toBeInTheDocument();
  });
});
