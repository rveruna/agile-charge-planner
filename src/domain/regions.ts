/** The 14 distribution regions Octopus prices Agile for. The letters skip I and O. */
export const REGIONS = [
  { code: 'A', name: 'Eastern England' },
  { code: 'B', name: 'East Midlands' },
  { code: 'C', name: 'London' },
  { code: 'D', name: 'Merseyside and North Wales' },
  { code: 'E', name: 'West Midlands' },
  { code: 'F', name: 'North East England' },
  { code: 'G', name: 'North West England' },
  { code: 'H', name: 'Southern England' },
  { code: 'J', name: 'South East England' },
  { code: 'K', name: 'South Wales' },
  { code: 'L', name: 'South West England' },
  { code: 'M', name: 'Yorkshire' },
  { code: 'N', name: 'Southern Scotland' },
  { code: 'P', name: 'Northern Scotland' },
] as const;

export type RegionCode = (typeof REGIONS)[number]['code'];

export const REGION_CODES = REGIONS.map((r) => r.code) as [RegionCode, ...RegionCode[]];

export const DEFAULT_REGION: RegionCode = 'C';

export function regionName(code: RegionCode): string {
  return REGIONS.find((r) => r.code === code)?.name ?? code;
}
