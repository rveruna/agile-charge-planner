import { slotsFrom, T0 } from '../test/slots';
import { cheapestFlexible, cheapestTogether, consideredSlots, planCharge, slotsNeeded } from './planner';
import { HALF_HOUR_MS } from './slot';

describe('slotsNeeded', () => {
  it.each([
    [0.5, 1],
    [1, 2],
    [1.2, 3],
    [3, 6],
    [0.1, 1],
  ])('%s hours needs %s slots', (hours, count) => {
    expect(slotsNeeded(hours)).toBe(count);
  });
});

describe('consideredSlots', () => {
  const slots = slotsFrom([10, 11, 12, 13, 14, 15], T0);

  it('drops slots that have already finished and keeps the current one', () => {
    const now = T0 + HALF_HOUR_MS + 60_000;
    expect(consideredSlots(slots, now, null).map((s) => s.pence)).toEqual([11, 12, 13, 14, 15]);
  });

  it('keeps only slots that start inside the horizon', () => {
    const considered = consideredSlots(slots, T0, 1);
    expect(considered.map((s) => s.pence)).toEqual([10, 11]);
  });

  it('keeps everything when there is no horizon', () => {
    expect(consideredSlots(slots, T0, null)).toHaveLength(6);
  });

  it('drops a slot that ends exactly now', () => {
    expect(consideredSlots(slots, T0 + HALF_HOUR_MS, null).map((s) => s.pence)).toEqual([11, 12, 13, 14, 15]);
  });

  it('drops a slot that starts exactly at the horizon', () => {
    expect(consideredSlots(slots, T0, 1).map((s) => s.pence)).toEqual([10, 11]);
  });
});

describe('cheapestTogether', () => {
  it('finds the cheapest run of back-to-back slots', () => {
    const slots = slotsFrom([30, 12, 11, 40, 5, 50]);
    expect(cheapestTogether(slots, 2).map((s) => s.pence)).toEqual([12, 11]);
  });

  it('prefers the earliest run when two cost the same', () => {
    const slots = slotsFrom([10, 10, 30, 10, 10]);
    expect(cheapestTogether(slots, 2)[0]!.start).toBe(T0);
  });

  it('never joins slots across a gap in the data', () => {
    const before = slotsFrom([1, 50]);
    const after = slotsFrom([50, 1], T0 + 4 * HALF_HOUR_MS);
    const result = cheapestTogether([...before, ...after], 2);
    expect(result.map((s) => s.pence)).toEqual([1, 50]);
    expect(result[0]!.start).toBe(T0);
  });

  it('returns nothing when no unbroken run is long enough', () => {
    const gappy = [...slotsFrom([1]), ...slotsFrom([1], T0 + 3 * HALF_HOUR_MS)];
    expect(cheapestTogether(gappy, 2)).toEqual([]);
  });

  it('handles negative prices', () => {
    const slots = slotsFrom([5, -3, -4, 9]);
    expect(cheapestTogether(slots, 2).map((s) => s.pence)).toEqual([-3, -4]);
  });
});

describe('cheapestFlexible', () => {
  it('takes the cheapest slots wherever they are, returned in time order', () => {
    const slots = slotsFrom([30, 12, 25, 11, 40]);
    expect(cheapestFlexible(slots, 2).map((s) => s.pence)).toEqual([12, 11]);
  });

  it('breaks ties by the earlier slot', () => {
    const slots = slotsFrom([10, 20, 10, 10]);
    const chosen = cheapestFlexible(slots, 2);
    expect(chosen.map((s) => s.start)).toEqual([T0, T0 + 2 * HALF_HOUR_MS]);
  });

  it('breaks ties by the earlier slot whatever order the slots arrive in', () => {
    const slots = slotsFrom([10, 20, 10, 10]).reverse();
    const chosen = cheapestFlexible(slots, 2);
    expect(chosen.map((s) => s.start)).toEqual([T0, T0 + 2 * HALF_HOUR_MS]);
  });

  it('does not change the slots it is given', () => {
    const slots = slotsFrom([30, 12, 25]);
    cheapestFlexible(slots, 1);
    expect(slots.map((s) => s.pence)).toEqual([30, 12, 25]);
  });
});

describe('planCharge', () => {
  const base = { now: T0, withinHours: null, powerKw: 7, mode: 'together' as const };

  it('prices a charge from the chosen slots and the charger power', () => {
    const slots = slotsFrom([30, 10, 10, 30]);
    const result = planCharge({ ...base, slots, hours: 1 });
    if (result.kind !== 'ok') throw new Error('expected a plan');
    // 2 slots at 10p, 7 kW for 1 hour: 7 kWh at 10p each
    expect(result.plan.energyKwh).toBe(7);
    expect(result.plan.costPence).toBeCloseTo(70);
    expect(result.plan.averagePence).toBeCloseTo(10);
  });

  it('compares with starting now in the first slots', () => {
    const slots = slotsFrom([30, 30, 10, 10]);
    const result = planCharge({ ...base, slots, hours: 1 });
    if (result.kind !== 'ok') throw new Error('expected a plan');
    expect(result.plan.startNowCostPence).toBeCloseTo(210);
    expect(result.plan.savingPence).toBeCloseTo(140);
  });

  it('reports a saving of zero when now is already the cheapest', () => {
    const slots = slotsFrom([5, 5, 30, 30]);
    const result = planCharge({ ...base, slots, hours: 1 });
    if (result.kind !== 'ok') throw new Error('expected a plan');
    expect(result.plan.savingPence).toBeCloseTo(0);
  });

  it('can report a negative cost when prices are below zero', () => {
    const slots = slotsFrom([-5, -5, 20, 20]);
    const result = planCharge({ ...base, slots, hours: 1 });
    if (result.kind !== 'ok') throw new Error('expected a plan');
    expect(result.plan.costPence).toBeLessThan(0);
  });

  it('says so when the data is too short for the charge', () => {
    const slots = slotsFrom([10, 10]);
    const result = planCharge({ ...base, slots, hours: 3 });
    expect(result).toMatchObject({ kind: 'too-short', available: 2, needed: 6 });
  });

  it('reports the longest unbroken run for a charge that must run together', () => {
    const slots = [...slotsFrom([10, 10, 10]), ...slotsFrom([10, 10], T0 + 5 * HALF_HOUR_MS)];
    const result = planCharge({ ...base, slots, hours: 2 });
    expect(result).toMatchObject({ kind: 'too-short', available: 3, needed: 4 });
  });

  it('lets a flexible charge use slots on either side of a gap', () => {
    const slots = [...slotsFrom([10, 10, 10]), ...slotsFrom([10, 10], T0 + 5 * HALF_HOUR_MS)];
    const result = planCharge({ ...base, slots, hours: 2, mode: 'flexible' });
    expect(result.kind).toBe('ok');
  });

  it('only plans inside the chosen horizon', () => {
    const slots = slotsFrom([30, 30, 1, 1]);
    const result = planCharge({ ...base, slots, hours: 1, withinHours: 1 });
    if (result.kind !== 'ok') throw new Error('expected a plan');
    expect(result.plan.chosen.map((s) => s.pence)).toEqual([30, 30]);
  });
});
