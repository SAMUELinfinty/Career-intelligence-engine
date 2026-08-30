import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MatchScore, { getScoreInterpretation } from '../components/MatchScore/MatchScore';

describe('MatchScore Component & Interpretation Logic', () => {
  it('correctly classifies score >= 0.70 as Strong Match', () => {
    const info = getScoreInterpretation(0.82);
    expect(info.level).toBe('Strong Match');

    render(<MatchScore score={0.82} />);
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('Strong Match')).toBeInTheDocument();
  });

  it('correctly classifies score between 0.40 and 0.69 as Moderate Match', () => {
    const info = getScoreInterpretation(0.55);
    expect(info.level).toBe('Moderate Match');

    render(<MatchScore score={0.55} />);
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('Moderate Match')).toBeInTheDocument();
  });

  it('correctly classifies score < 0.40 as Low Match', () => {
    const info = getScoreInterpretation(0.25);
    expect(info.level).toBe('Low Match');

    render(<MatchScore score={0.25} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Low Match')).toBeInTheDocument();
  });
});
