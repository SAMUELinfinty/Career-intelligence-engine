import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import JobCard from '../components/JobCard/JobCard';

describe('JobCard Component', () => {
  const sampleJob = {
    id: 101,
    title: 'Software Engineer Intern',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    experienceLevel: 'Entry level',
    isRemote: true,
    salary: 95000,
    roleCategory: 'Software Engineering',
    skills: ['Python', 'SQL', 'Git', 'Docker', 'React'],
  };

  it('renders job title and company correctly', () => {
    render(
      <BrowserRouter>
        <JobCard job={sampleJob} matchScore={0.82} />
      </BrowserRouter>
    );

    expect(screen.getByText('Software Engineer Intern')).toBeInTheDocument();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
  });

  it('renders match score percentage when provided', () => {
    render(
      <BrowserRouter>
        <JobCard job={sampleJob} matchScore={0.82} />
      </BrowserRouter>
    );

    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('renders skill badges', () => {
    render(
      <BrowserRouter>
        <JobCard job={sampleJob} matchScore={0.82} />
      </BrowserRouter>
    );

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('contains link to job details page', () => {
    render(
      <BrowserRouter>
        <JobCard job={sampleJob} matchScore={0.82} />
      </BrowserRouter>
    );

    const link = screen.getByRole('link', { name: /view job/i });
    expect(link).toHaveAttribute('href', '/jobs/101');
  });
});
