import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { fetchRates, PRODUCT, RatesError, ratesUrl } from './octopusClient';

const NOW = Date.parse('2026-10-15T10:07:00Z');
const PATTERN = /api\.octopus\.energy\/v1\/products\/.*\/standard-unit-rates\//;

const body = {
  count: 2,
  next: null,
  results: [
    {
      value_exc_vat: 29.5,
      value_inc_vat: 31.0,
      valid_from: '2026-10-15T10:30:00Z',
      valid_to: '2026-10-15T11:00:00Z',
    },
    {
      value_exc_vat: 28.0,
      value_inc_vat: 29.4,
      valid_from: '2026-10-15T10:00:00Z',
      valid_to: '2026-10-15T10:30:00Z',
    },
  ],
};

describe('ratesUrl', () => {
  it('asks for the region tariff from the start of the current half hour', () => {
    const url = new URL(ratesUrl('C', NOW));
    expect(url.pathname).toBe(
      `/v1/products/${PRODUCT}/electricity-tariffs/E-1R-${PRODUCT}-C/standard-unit-rates/`,
    );
    expect(url.searchParams.get('period_from')).toBe('2026-10-15T10:00:00.000Z');
    expect(url.searchParams.get('page_size')).toBe('200');
  });
});

describe('fetchRates', () => {
  it('returns validated slots in time order, using the price including VAT', async () => {
    server.use(http.get(PATTERN, () => HttpResponse.json(body)));

    const slots = await fetchRates('C', NOW);

    expect(slots.map((s) => s.pence)).toEqual([29.4, 31.0]);
  });

  it('sends the region and start time it was asked for', async () => {
    let requested = '';
    server.use(
      http.get(PATTERN, ({ request }) => {
        requested = request.url;
        return HttpResponse.json(body);
      }),
    );

    await fetchRates('P', NOW);

    expect(requested).toContain('E-1R-AGILE-24-10-01-P');
    expect(requested).toContain('period_from=2026-10-15T10%3A00%3A00.000Z');
  });

  it('reports an unknown region as an http error', async () => {
    server.use(http.get(PATTERN, () => HttpResponse.json({ detail: 'Not found' }, { status: 404 })));

    await expect(fetchRates('C', NOW)).rejects.toMatchObject({ kind: 'http', status: 404 });
  });

  it('reports a dropped connection as a network error', async () => {
    server.use(http.get(PATTERN, () => HttpResponse.error()));

    await expect(fetchRates('C', NOW)).rejects.toMatchObject({ kind: 'network' });
  });

  it('reports a body that is not JSON', async () => {
    server.use(http.get(PATTERN, () => new HttpResponse('<html>oops</html>')));

    await expect(fetchRates('C', NOW)).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('reports a response in an unexpected shape rather than showing nonsense', async () => {
    server.use(http.get(PATTERN, () => HttpResponse.json({ results: [{ value_inc_vat: 'cheap' }] })));

    const error = await fetchRates('C', NOW).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RatesError);
    expect(error).toMatchObject({ kind: 'invalid' });
  });

  it('passes an abort through unchanged', async () => {
    server.use(http.get(PATTERN, () => HttpResponse.json(body)));
    const controller = new AbortController();
    controller.abort();

    await expect(fetchRates('C', NOW, controller.signal)).rejects.not.toBeInstanceOf(RatesError);
  });
});
