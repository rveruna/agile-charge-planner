import { sampleRates } from './sampleRates';
import { HALF_HOUR_MS } from '../domain/slot';

const NOW = Date.parse('2026-10-15T10:07:00Z');

describe('sampleRates', () => {
  it('starts at the current half hour and is back to back', () => {
    const slots = sampleRates(NOW);
    expect(slots[0]!.start).toBe(Date.parse('2026-10-15T10:00:00Z'));
    slots.forEach((slot, i) => {
      expect(slot.end - slot.start).toBe(HALF_HOUR_MS);
      if (i > 0) expect(slot.start).toBe(slots[i - 1]!.end);
    });
  });

  it('gives the same prices for the same day', () => {
    expect(sampleRates(NOW)).toEqual(sampleRates(NOW + 60_000));
  });

  it('is cheaper overnight than in the evening peak', () => {
    const slots = sampleRates(Date.parse('2026-10-15T00:00:00Z'));
    const at = (iso: string) => slots.find((s) => s.start === Date.parse(iso))!.pence;
    expect(at('2026-10-15T03:00:00Z')).toBeLessThan(at('2026-10-15T17:30:00Z') - 15);
  });

  it('returns the number of slots asked for', () => {
    expect(sampleRates(NOW, 10)).toHaveLength(10);
  });
});
