import { useQuery } from '@tanstack/react-query';
import { fetchRates, RatesError } from '../api/octopusClient';
import { sampleRates } from '../api/sampleRates';
import type { RegionCode } from '../domain/regions';
import type { Slot } from '../domain/slot';

/** Octopus caches this endpoint for five minutes, so asking more often gains nothing. */
export const STALE_TIME_MS = 5 * 60 * 1000;
export const KEEP_MS = 24 * 60 * 60 * 1000;

export type DataStatus =
  | { kind: 'loading' }
  | { kind: 'live'; updatedAt: number }
  | { kind: 'saved'; updatedAt: number; reason: 'offline' | 'error' }
  | { kind: 'offline-empty' }
  | { kind: 'error'; error: RatesError | Error }
  | { kind: 'sample' };

export interface RatesState {
  slots: Slot[];
  status: DataStatus;
  retry: () => void;
}

/**
 * Prices for a region. With `sample` on, the network is never touched and illustrative prices are
 * returned, clearly marked as such by the status.
 */
export function useRates(region: RegionCode, sample: boolean, now: number): RatesState {
  const query = useQuery({
    queryKey: ['rates', region],
    queryFn: ({ signal }) => fetchRates(region, Date.now(), signal),
    staleTime: STALE_TIME_MS,
    gcTime: KEEP_MS,
    enabled: !sample,
  });

  if (sample) {
    return { slots: sampleRates(now), status: { kind: 'sample' }, retry: () => undefined };
  }

  const retry = () => void query.refetch();

  if (query.data) {
    const slots = query.data;
    if (query.isError)
      return { slots, status: { kind: 'saved', updatedAt: query.dataUpdatedAt, reason: 'error' }, retry };
    if (query.fetchStatus === 'paused') {
      return { slots, status: { kind: 'saved', updatedAt: query.dataUpdatedAt, reason: 'offline' }, retry };
    }
    return { slots, status: { kind: 'live', updatedAt: query.dataUpdatedAt }, retry };
  }

  if (query.isError) return { slots: [], status: { kind: 'error', error: query.error }, retry };
  if (query.fetchStatus === 'paused') return { slots: [], status: { kind: 'offline-empty' }, retry };
  return { slots: [], status: { kind: 'loading' }, retry };
}
