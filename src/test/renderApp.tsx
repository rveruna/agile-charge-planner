import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import App from '../App';
import { HALF_HOUR_MS } from '../domain/slot';
import { server } from './server';

/** 10:07 UTC on 15 October 2026, which is 11:07 in the UK (BST). */
export const NOW = Date.parse('2026-10-15T10:07:00Z');
export const RATES = /api\.octopus\.energy\/v1\/products\/.*\/standard-unit-rates\//;

/** An API body of back-to-back slots from 10:00 UTC. */
export function ratesBody(prices: number[], start = Date.parse('2026-10-15T10:00:00Z')) {
  return {
    count: prices.length,
    next: null,
    results: prices
      .map((value, i) => ({
        value_exc_vat: value,
        value_inc_vat: value,
        valid_from: new Date(start + i * HALF_HOUR_MS).toISOString(),
        valid_to: new Date(start + (i + 1) * HALF_HOUR_MS).toISOString(),
        payment_method: null,
      }))
      .reverse(),
  };
}

export function respondWith(prices: number[]) {
  server.use(http.get(RATES, () => HttpResponse.json(ratesBody(prices))));
}

export function renderApp(search = '') {
  window.history.replaceState(null, '', `/${search}`);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>,
    ),
  };
}
