import { z } from 'zod';
import { DEFAULT_REGION, REGION_CODES } from './regions';

export const DURATION_OPTIONS = Array.from({ length: 24 }, (_, i) => (i + 1) / 2);
export const POWER_OPTIONS = [3.6, 7, 11, 22] as const;
export const WITHIN_OPTIONS = ['all', '6', '12', '24'] as const;

const choice = <T extends string>(values: readonly [T, ...T[]], fallback: T) =>
  z.enum(values).catch(fallback);

/** What the user has chosen. Anything missing or not recognised in the URL falls back to its default. */
export const settingsSchema = z.object({
  region: choice(REGION_CODES, DEFAULT_REGION),
  hours: z.coerce
    .number()
    .refine((n) => DURATION_OPTIONS.includes(n))
    .catch(3),
  kw: z.coerce
    .number()
    .refine((n) => (POWER_OPTIONS as readonly number[]).includes(n))
    .catch(7),
  mode: choice(['together', 'flexible'], 'together'),
  within: choice(WITHIN_OPTIONS, 'all'),
  sample: z.enum(['1']).optional().catch(undefined),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = settingsSchema.parse({});

export function parseSettings(search: string): Settings {
  const params = new URLSearchParams(search);
  return settingsSchema.parse(Object.fromEntries(params));
}

/** Writes only what differs from the defaults, so a shared link stays short. */
export function settingsToSearch(settings: Settings): string {
  const params = new URLSearchParams();
  for (const key of ['region', 'hours', 'kw', 'mode', 'within', 'sample'] as const) {
    const value = settings[key];
    if (value !== undefined && value !== DEFAULT_SETTINGS[key]) params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function withinHours(within: Settings['within']): number | null {
  return within === 'all' ? null : Number(within);
}
