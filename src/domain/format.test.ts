import { describeSlots, formatClock, formatDay, formatPence, formatPounds, formatRange } from './format';
import { slotsFrom } from '../test/slots';
import { HALF_HOUR_MS } from './slot';

describe('UK time formatting', () => {
  it('shows British Summer Time in summer', () => {
    expect(formatClock(Date.parse('2026-07-01T22:30:00Z'))).toBe('23:30');
  });

  it('shows Greenwich Mean Time in winter', () => {
    expect(formatClock(Date.parse('2026-12-01T22:30:00Z'))).toBe('22:30');
  });

  it('follows the clocks going back on 25 October 2026', () => {
    // 00:30 UTC is 01:30 BST; the next hour, 01:30 UTC, is 01:30 GMT
    expect(formatClock(Date.parse('2026-10-25T00:30:00Z'))).toBe('01:30');
    expect(formatClock(Date.parse('2026-10-25T01:30:00Z'))).toBe('01:30');
    expect(formatClock(Date.parse('2026-10-25T02:00:00Z'))).toBe('02:00');
  });

  it('shows midnight as 00:00, not 24:00', () => {
    expect(formatClock(Date.parse('2026-12-01T00:00:00Z'))).toBe('00:00');
  });

  it('uses the UK day, not the UTC day', () => {
    expect(formatDay(Date.parse('2026-07-01T23:30:00Z'))).toBe('Thu 2 Jul');
  });

  it('formats a range', () => {
    expect(formatRange(Date.parse('2026-12-01T21:30:00Z'))).toBe('21:30 to 22:00');
  });
});

describe('money formatting', () => {
  it.each([
    [12.345, '12.3p'],
    [-2.44, '-2.4p'],
    [0, '0.0p'],
    [100, '100.0p'],
  ])('formats %s pence per kWh as %s', (value, text) => {
    expect(formatPence(value)).toBe(text);
  });

  it.each([
    [123, '£1.23'],
    [0, '£0.00'],
    [-40, '-£0.40'],
    [-0.1, '£0.00'],
    [5, '£0.05'],
    [59.5, '£0.60'],
    [-59.5, '-£0.60'],
  ])('formats %s pence as %s', (value, text) => {
    expect(formatPounds(value)).toBe(text);
  });
});

describe('describeSlots', () => {
  it('joins back-to-back slots into one range', () => {
    const slots = slotsFrom([1, 1, 1], Date.parse('2026-12-01T00:30:00Z'));
    expect(describeSlots(slots)).toBe('00:30 to 02:00');
  });

  it('lists separate ranges', () => {
    const a = slotsFrom([1, 1], Date.parse('2026-12-01T00:30:00Z'));
    const b = slotsFrom([1], Date.parse('2026-12-01T04:00:00Z'));
    expect(describeSlots([...a, ...b])).toBe('00:30 to 01:30, 04:00 to 04:30');
  });

  it('is empty for no slots', () => {
    expect(describeSlots([])).toBe('');
  });

  it('keeps slots that touch only at an hour boundary together', () => {
    const slots = slotsFrom([1, 1], Date.parse('2026-12-01T00:00:00Z'));
    expect(slots[1]!.start - slots[0]!.start).toBe(HALF_HOUR_MS);
    expect(describeSlots(slots)).toBe('00:00 to 01:00');
  });
});
