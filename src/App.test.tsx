import { act, screen, waitFor, within } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { http, HttpResponse } from 'msw';
import { server } from './test/server';
import { NOW, RATES, renderApp, respondWith } from './test/renderApp';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
});
afterEach(() => {
  vi.useRealTimers();
  onlineManager.setOnline(true);
});

// Slots start at 11:00 UK time; the cheap ones (9p and 8p) are 12:00 to 13:00
const PRICES = [30, 28, 9, 8, 27, 29, 31, 33];

const summary = () => screen.getByRole('region', { name: 'Cheapest time to charge' });

describe('the planner', () => {
  it('shows a loading message, then the cheapest time to charge', async () => {
    respondWith(PRICES);
    renderApp('?hours=1');

    expect(screen.getByText(/Loading prices/)).toBeInTheDocument();

    expect(await screen.findByText('12:00 to 13:00')).toBeInTheDocument();
    expect(screen.getByText(/Live Agile prices from Octopus Energy/)).toBeInTheDocument();
  });

  it('works out the cost for the charger power chosen', async () => {
    respondWith(PRICES);
    renderApp('?hours=1&kw=7');

    await screen.findByText('12:00 to 13:00');
    // two slots at 9p and 8p, 7 kW: 7 kWh at an average of 8.5p is £0.60
    expect(screen.getByText('8.5p per kWh')).toBeInTheDocument();
    expect(screen.getByText('7 kWh')).toBeInTheDocument();
    expect(screen.getByText('£0.60')).toBeInTheDocument();
  });

  it('says how much starting now would cost and what is saved', async () => {
    respondWith(PRICES);
    renderApp('?hours=1&kw=7');

    await screen.findByText('12:00 to 13:00');
    // now: 30p and 28p slots, 7 kW is 7 kWh at 29p = £2.03
    expect(screen.getByText(/£2\.03, so this saves £1\.44/)).toBeInTheDocument();
  });

  it('recalculates when the duration changes, and keeps it in the URL', async () => {
    respondWith(PRICES);
    const user = userEvent.setup();
    renderApp('?hours=1');
    await screen.findByText('12:00 to 13:00');

    await user.selectOptions(screen.getByLabelText('How long to charge'), '0.5');

    await waitFor(() => expect(summary()).toHaveTextContent('12:30 to 13:00'));
    expect(window.location.search).toBe('?hours=0.5');
  });

  it('lets a flexible charge pause between cheap slots', async () => {
    respondWith([30, 5, 40, 6, 40, 40]);
    const user = userEvent.setup();
    renderApp('?hours=1');
    await waitFor(() => expect(summary()).toHaveTextContent('11:00 to 12:00'));

    await user.click(screen.getByLabelText(/Flexible/));

    await waitFor(() => expect(summary()).toHaveTextContent('11:30 to 12:00, 12:30 to 13:00'));
    expect(window.location.search).toContain('mode=flexible');
  });

  it('reads every choice from the URL so a link reproduces the view', async () => {
    respondWith(PRICES);
    renderApp('?region=P&hours=2&kw=11&mode=flexible&within=12');

    expect(screen.getByLabelText('Region')).toHaveValue('P');
    expect(screen.getByLabelText('How long to charge')).toHaveValue('2');
    expect(screen.getByLabelText('Charger power')).toHaveValue('11');
    expect(screen.getByLabelText('Charge within')).toHaveValue('12');
    expect(screen.getByLabelText(/Flexible/)).toBeChecked();
    await screen.findByText(/Live Agile prices/);
  });

  it('ignores nonsense in the URL and uses the defaults', async () => {
    respondWith(PRICES);
    renderApp('?region=ZZ&hours=banana&kw=9000&mode=sideways&within=-3');

    expect(screen.getByLabelText('Region')).toHaveValue('C');
    expect(screen.getByLabelText('How long to charge')).toHaveValue('3');
    expect(screen.getByLabelText('Charger power')).toHaveValue('7');
    await screen.findByText(/Live Agile prices/);
  });

  it('asks for the prices of the region chosen', async () => {
    const urls: string[] = [];
    server.use(
      http.get(RATES, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json({ results: [] });
      }),
    );
    const user = userEvent.setup();
    renderApp();
    await waitFor(() => expect(urls).toHaveLength(1));

    await user.selectOptions(screen.getByLabelText('Region'), 'P');

    await waitFor(() => expect(urls).toHaveLength(2));
    expect(urls[0]).toContain('-C/');
    expect(urls[1]).toContain('-P/');
  });
});

describe('caching', () => {
  it('treats prices as fresh for five minutes, matching how long Octopus caches them', async () => {
    respondWith(PRICES);
    const { client } = renderApp('?hours=1');
    await screen.findByText('12:00 to 13:00');

    const query = client.getQueryCache().find({ queryKey: ['rates', 'C'] })!;
    expect(query.observers[0]!.options.staleTime).toBe(5 * 60 * 1000);
    expect(query.isStaleByTime(5 * 60 * 1000)).toBe(false);
  });
});

describe('when the prices are not enough', () => {
  it('explains that the data is too short for the charge', async () => {
    respondWith([10, 10]);
    renderApp('?hours=3');

    expect(await screen.findByRole('alert')).toHaveTextContent(/not enough for this charge/);
  });
});

describe('the chart and the table', () => {
  it('shows the same slots in both, with the chosen ones marked', async () => {
    respondWith(PRICES);
    renderApp('?hours=1');
    await screen.findByText('12:00 to 13:00');

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(PRICES.length + 1);
    expect(within(table).getAllByText('Charge here')).toHaveLength(2);

    const chart = screen.getByTestId('rate-chart');
    expect(chart.querySelectorAll('rect[data-chosen]')).toHaveLength(PRICES.length);
    expect(chart.querySelectorAll('rect[data-chosen="true"]')).toHaveLength(2);
    // the chosen slots are also marked with a strip under the axis, so colour is not the only cue
    expect(chart.querySelectorAll('rect[data-marker]')).toHaveLength(2);
  });

  it('labels the time axis every three hours, starting with the first slot', async () => {
    respondWith(Array.from({ length: 14 }, () => 20));
    renderApp('?hours=1');
    await screen.findByText(/Live Agile prices/);

    const labels = [...screen.getByTestId('rate-chart').querySelectorAll('text')]
      .map((t) => t.textContent)
      .filter((t) => /^\d\d:\d\d$/.test(t ?? ''));
    expect(labels).toEqual(['11:00', '14:00', '17:00']);
  });

  it('describes the chart for screen readers and points to the table', async () => {
    respondWith(PRICES);
    renderApp('?hours=1');
    await screen.findByText('12:00 to 13:00');

    const chart = screen.getByRole('img', { name: /Bar chart of half-hourly prices/ });
    expect(chart).toHaveAccessibleName(/8\.0p to 33\.0p per kWh/);
    expect(chart).toHaveAccessibleName(/The cheapest charge is 12:00 to 13:00/);
    expect(chart).toHaveAccessibleName(/table below/);
  });

  it('draws negative prices below the zero line', async () => {
    respondWith([20, -5, -6, 20]);
    renderApp('?hours=1');
    await screen.findByText(/Live Agile prices/);

    const bars = [...screen.getByTestId('rate-chart').querySelectorAll('rect[data-chosen]')];
    const zeroLine = Number(screen.getByTestId('rate-chart').querySelector('line')!.getAttribute('y1'));
    const [positive, negative] = [bars[0]!, bars[1]!];
    expect(Number(positive.getAttribute('y')) + Number(positive.getAttribute('height'))).toBeCloseTo(
      zeroLine,
    );
    expect(Number(negative.getAttribute('y'))).toBeCloseTo(zeroLine);
  });

  it('lets keyboard users scroll the table and the chart', async () => {
    respondWith(PRICES);
    renderApp('?hours=1');
    await screen.findByText('12:00 to 13:00');

    expect(screen.getByRole('region', { name: /Prices table/ })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('region', { name: /Price chart/ })).toHaveAttribute('tabindex', '0');
  });
});

describe('when something goes wrong', () => {
  it('reports an unreachable service and offers to retry or use sample prices', async () => {
    server.use(http.get(RATES, () => HttpResponse.error()));
    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach Octopus Energy.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use sample prices' })).toBeInTheDocument();
  });

  it('recovers when Try again succeeds', async () => {
    respondWith(PRICES);
    server.use(http.get(RATES, () => HttpResponse.error(), { once: true }));
    const user = userEvent.setup();
    renderApp('?hours=1');
    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('12:00 to 13:00')).toBeInTheDocument();
  });

  it('explains an http error with its status', async () => {
    server.use(http.get(RATES, () => HttpResponse.json({}, { status: 503 })));
    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent('status 503');
  });

  it('explains prices it cannot read', async () => {
    server.use(http.get(RATES, () => HttpResponse.json({ nope: true })));
    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not read/);
  });

  it('keeps showing saved prices when a refresh fails', async () => {
    respondWith(PRICES);
    const { client } = renderApp('?hours=1');
    await screen.findByText('12:00 to 13:00');

    server.use(http.get(RATES, () => HttpResponse.error()));
    await client.refetchQueries({ queryKey: ['rates'] });

    expect(
      await screen.findByText(/Could not refresh the prices\. Showing the prices saved at/),
    ).toBeInTheDocument();
    expect(screen.getByText('12:00 to 13:00')).toBeInTheDocument();
  });
});

describe('sample prices', () => {
  it('can be switched on after a failure, and are clearly labelled', async () => {
    server.use(http.get(RATES, () => HttpResponse.error()));
    const user = userEvent.setup();
    renderApp('?hours=1');

    await user.click(await screen.findByRole('button', { name: 'Use sample prices' }));

    expect(await screen.findByRole('note')).toHaveTextContent(/sample prices, not real ones/);
    expect(window.location.search).toContain('sample=1');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText(/Cheapest time to charge/)).toBeInTheDocument();
  });

  it('never touch the network', async () => {
    const requested = vi.fn();
    server.use(
      http.get(RATES, () => {
        requested();
        return HttpResponse.json({ results: [] });
      }),
    );
    renderApp('?sample=1&hours=1');

    await screen.findByRole('note');
    expect(requested).not.toHaveBeenCalled();
  });

  it('can be switched off to go back to live prices', async () => {
    respondWith(PRICES);
    const user = userEvent.setup();
    renderApp('?sample=1&hours=1');

    await user.click(await screen.findByRole('button', { name: 'Use live prices' }));

    expect(await screen.findByText(/Live Agile prices/)).toBeInTheDocument();
    expect(window.location.search).not.toContain('sample');
  });
});

describe('accessibility', () => {
  it('has no axe violations with prices on screen', async () => {
    respondWith(PRICES);
    const { container } = renderApp('?hours=1');
    await screen.findByText('12:00 to 13:00');

    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('has no axe violations in the error state', async () => {
    server.use(http.get(RATES, () => HttpResponse.error()));
    const { container } = renderApp();
    await screen.findByRole('alert');

    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('has one main landmark and one h1', async () => {
    respondWith(PRICES);
    renderApp();
    await screen.findByText(/Live Agile prices/);

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('offline', () => {
  it('shows saved prices, marked as such, when the connection drops', async () => {
    respondWith(PRICES);
    const { client } = renderApp('?hours=1');
    await screen.findByText('12:00 to 13:00');

    act(() => onlineManager.setOnline(false));
    void client.refetchQueries({ queryKey: ['rates'] });

    expect(await screen.findByText(/You are offline\. Showing the prices saved at/)).toBeInTheDocument();
    expect(screen.getByText('12:00 to 13:00')).toBeInTheDocument();
  });

  it('offers sample prices when offline with nothing saved', async () => {
    onlineManager.setOnline(false);
    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(/offline and there are no saved prices/);
    expect(screen.getByRole('button', { name: 'Use sample prices' })).toBeInTheDocument();
  });
});

describe('settings controls', () => {
  it('writes power, horizon and region changes to the URL', async () => {
    respondWith(PRICES);
    const user = userEvent.setup();
    renderApp();
    await screen.findByText(/Live Agile prices/);

    await user.selectOptions(screen.getByLabelText('Charger power'), '11');
    await user.selectOptions(screen.getByLabelText('Charge within'), '12');
    await user.selectOptions(screen.getByLabelText('Region'), 'N');
    await user.click(screen.getByLabelText(/Flexible/));
    await user.click(screen.getByLabelText(/Together/));

    expect(new URLSearchParams(window.location.search).toString()).toBe('region=N&kw=11&within=12');
  });

  it('follows the back button', async () => {
    respondWith(PRICES);
    renderApp('?hours=1');
    await screen.findByText(/Live Agile prices/);

    act(() => {
      window.history.replaceState(null, '', '/?hours=2');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByLabelText('How long to charge')).toHaveValue('2');
  });
});
