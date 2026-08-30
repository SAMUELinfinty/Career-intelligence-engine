import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SkillGap from '../components/SkillGap/SkillGap';

describe('SkillGap Component', () => {
  const matched = ['Python', 'SQL', 'Git'];
  const missing = ['Docker', 'AWS'];

  it('renders matched and missing skills lists correctly', () => {
    render(<SkillGap matchedSkills={matched} missingSkills={missing} />);

    expect(screen.getByText('Matched Skills')).toBeInTheDocument();
    expect(screen.getByText('Missing Skills')).toBeInTheDocument();

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByText('Git')).toBeInTheDocument();

    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();
  });

  it('shows special message when no missing skills exist', () => {
    render(<SkillGap matchedSkills={['Python', 'Docker']} missingSkills={[]} />);

    expect(screen.getByText(/meet all required skills/i)).toBeInTheDocument();
  });
});
