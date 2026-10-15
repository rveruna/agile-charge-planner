import { floorToHalfHour, HALF_HOUR_MS, ratesResponseSchema, toSlots } from './slot';

const rate = (from: string, to: string, value: number) => ({
  value_exc_vat: value,
  value_inc_vat: value,
  valid_from: from,
  valid_to: to,
  payment_method: null,
});

describe('ratesResponseSchema and toSlots', () => {
  it('turns the API shape into slots in time order', () => {
    const parsed = ratesResponseSchema.parse({
      count: 2,
      results: [
        rate('2026-10-15T21:30:00Z', '2026-10-15T22:00:00Z', 29.57),
        rate('2026-10-15T21:00:00Z', '2026-10-15T21:30:00Z', 31.54),
      ],
    });
    const slots = toSlots(parsed);
    expect(slots.map((s) => s.pence)).toEqual([31.54, 29.57]);
    expect(slots[0]!.start).toBe(Date.parse('2026-10-15T21:00:00Z'));
    expect(slots[0]!.end - slots[0]!.start).toBe(HALF_HOUR_MS);
  });

  it('accepts negative prices', () => {
    const parsed = ratesResponseSchema.parse({
      results: [rate('2026-10-15T03:00:00Z', '2026-10-15T03:30:00Z', -4.2)],
    });
    expect(toSlots(parsed)[0]!.pence).toBe(-4.2);
  });

  it('drops a period that ends before it starts', () => {
    const parsed = ratesResponseSchema.parse({
      results: [rate('2026-10-15T04:00:00Z', '2026-10-15T03:30:00Z', 5)],
    });
    expect(toSlots(parsed)).toEqual([]);
  });

  it('drops a period of zero length', () => {
    const parsed = ratesResponseSchema.parse({
      results: [rate('2026-10-15T04:00:00Z', '2026-10-15T04:00:00Z', 5)],
    });
    expect(toSlots(parsed)).toEqual([]);
  });

  it('keeps one slot when the same start appears twice', () => {
    const parsed = ratesResponseSchema.parse({
      results: [
        rate('2026-10-15T04:00:00Z', '2026-10-15T04:30:00Z', 5),
        rate('2026-10-15T04:00:00Z', '2026-10-15T04:30:00Z', 6),
      ],
    });
    expect(toSlots(parsed)).toHaveLength(1);
  });

  it.each([
    ['a missing results list', {}],
    [
      'a price that is a string',
      {
        results: [rate('2026-10-15T04:00:00Z', '2026-10-15T04:30:00Z', 1)].map((r) => ({
          ...r,
          value_inc_vat: '5',
        })),
      },
    ],
    ['a time that is not a date', { results: [rate('yesterday', '2026-10-15T04:30:00Z', 1)] }],
  ])('rejects %s', (_name, body) => {
    expect(ratesResponseSchema.safeParse(body).success).toBe(false);
  });
});

describe('floorToHalfHour', () => {
  it('rounds down to the start of the half hour', () => {
    expect(floorToHalfHour(Date.parse('2026-10-15T10:29:59Z'))).toBe(Date.parse('2026-10-15T10:00:00Z'));
    expect(floorToHalfHour(Date.parse('2026-10-15T10:30:00Z'))).toBe(Date.parse('2026-10-15T10:30:00Z'));
  });
});
