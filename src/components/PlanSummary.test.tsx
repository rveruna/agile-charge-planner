import { render, screen } from '@testing-library/react';
import type { Plan } from '../domain/planner';
import { PlanSummary } from './PlanSummary';

const START = Date.parse('2026-01-15T01:00:00Z');
const plan: Plan = {
  chosen: [
    { start: START, end: START + 1_800_000, pence: 1 },
    { start: START + 1_800_000, end: START + 3_600_000, pence: 20 },
  ],
  energyKwh: 7,
  costPence: 73.5,
  averagePence: 10.5,
  startNowCostPence: null,
  savingPence: null,
};

describe('PlanSummary', () => {
  it('says starting now is not known, rather than showing a price, when the prices have a gap', () => {
    render(<PlanSummary result={{ kind: 'ok', plan, considered: plan.chosen }} />);

    expect(screen.getByText('Not known, as there is a gap in the prices')).toBeInTheDocument();
    expect(screen.queryByText(/saves|about the same/)).not.toBeInTheDocument();
  });
});
