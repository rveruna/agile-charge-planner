import { DEFAULT_SETTINGS, parseSettings, settingsToSearch, withinHours } from './settings';

describe('parseSettings', () => {
  it('uses London, 3 hours, 7 kW, together and all prices by default', () => {
    expect(parseSettings('')).toEqual({
      region: 'C',
      hours: 3,
      kw: 7,
      mode: 'together',
      within: 'all',
      sample: undefined,
    });
  });

  it('reads valid values', () => {
    expect(parseSettings('?region=P&hours=1.5&kw=22&mode=flexible&within=6&sample=1')).toEqual({
      region: 'P',
      hours: 1.5,
      kw: 22,
      mode: 'flexible',
      within: '6',
      sample: '1',
    });
  });

  it.each([
    ['an unknown region', '?region=I', 'region', 'C'],
    ['a lower-case region', '?region=p', 'region', 'C'],
    ['a duration that is not offered', '?hours=0.25', 'hours', 3],
    ['a duration above the maximum', '?hours=13', 'hours', 3],
    ['a power that is not offered', '?kw=50', 'kw', 7],
    ['an unknown mode', '?mode=x', 'mode', 'together'],
    ['an unknown horizon', '?within=48', 'within', 'all'],
  ] as const)('falls back to the default for %s', (_name, search, key, expected) => {
    expect(parseSettings(search)[key]).toBe(expected);
  });

  it('keeps valid values when others are invalid', () => {
    expect(parseSettings('?region=P&hours=nope').region).toBe('P');
  });

  it('only turns sample on for the exact value 1', () => {
    expect(parseSettings('?sample=true').sample).toBeUndefined();
  });
});

describe('settingsToSearch', () => {
  it('writes nothing for the defaults', () => {
    expect(settingsToSearch(DEFAULT_SETTINGS)).toBe('');
  });

  it('writes only what differs from the defaults', () => {
    expect(settingsToSearch({ ...DEFAULT_SETTINGS, region: 'P', mode: 'flexible' })).toBe(
      '?region=P&mode=flexible',
    );
  });

  it('round-trips every choice', () => {
    const settings = {
      region: 'N',
      hours: 4.5,
      kw: 11,
      mode: 'flexible',
      within: '24',
      sample: '1',
    } as const;
    expect(parseSettings(settingsToSearch(settings))).toEqual(settings);
  });
});

describe('withinHours', () => {
  it('is null for all prices and a number otherwise', () => {
    expect(withinHours('all')).toBeNull();
    expect(withinHours('12')).toBe(12);
  });
});
