import { ratesResponseSchema, floorToHalfHour, toSlots, type Slot } from '../domain/slot';
import type { RegionCode } from '../domain/regions';

export const PRODUCT = 'AGILE-24-10-01';
const BASE_URL = 'https://api.octopus.energy/v1';

export type RatesErrorKind = 'network' | 'http' | 'invalid';

/** A failure to get usable prices, with a kind the interface can explain. */
export class RatesError extends Error {
  readonly kind: RatesErrorKind;
  readonly status?: number;

  constructor(kind: RatesErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'RatesError';
    this.kind = kind;
    this.status = status;
  }
}

export function ratesUrl(region: RegionCode, from: number): string {
  const params = new URLSearchParams({
    period_from: new Date(floorToHalfHour(from)).toISOString(),
    page_size: '200',
  });
  const tariff = `E-1R-${PRODUCT}-${region}`;
  return `${BASE_URL}/products/${PRODUCT}/electricity-tariffs/${tariff}/standard-unit-rates/?${params}`;
}

/**
 * Fetches the Agile unit rates from the start of the current half hour onwards. No API key is needed for
 * this endpoint. The response is validated, so a change in its shape is reported rather than shown as nonsense.
 */
export async function fetchRates(region: RegionCode, from: number, signal?: AbortSignal): Promise<Slot[]> {
  let response: Response;
  try {
    response = await fetch(ratesUrl(region, from), { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new RatesError('network', 'Could not reach Octopus Energy.');
  }

  if (!response.ok) {
    throw new RatesError('http', `Octopus Energy answered with status ${response.status}.`, response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new RatesError('invalid', 'Octopus Energy sent a response that was not JSON.');
  }

  const parsed = ratesResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new RatesError('invalid', 'Octopus Energy sent prices in a shape this app does not recognise.');
  }
  return toSlots(parsed.data);
}
