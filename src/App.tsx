import { useMemo } from 'react';
import { DataStatus } from './components/DataStatus';
import { PlanSummary } from './components/PlanSummary';
import { RateChart } from './components/RateChart';
import { RateTable } from './components/RateTable';
import { SettingsForm } from './components/SettingsForm';
import { ThemeToggle } from './components/ThemeToggle';
import { regionName } from './domain/regions';
import { planCharge } from './domain/planner';
import { withinHours } from './domain/settings';
import { useNow } from './hooks/useNow';
import { useRates } from './hooks/useRates';
import { useSettings } from './hooks/useSettings';

export default function App() {
  const [settings, update] = useSettings();
  const now = useNow();
  const { slots, status, retry } = useRates(settings.region, settings.sample === '1', now);

  const result = useMemo(
    () =>
      slots.length === 0
        ? null
        : planCharge({
            slots,
            now,
            withinHours: withinHours(settings.within),
            hours: settings.hours,
            powerKw: settings.kw,
            mode: settings.mode,
          }),
    [slots, now, settings.within, settings.hours, settings.kw, settings.mode],
  );

  const shown = result?.considered ?? [];
  const chosen = result?.kind === 'ok' ? result.plan.chosen : [];

  return (
    <>
      <header>
        <h1>Agile Charge Planner</h1>
        <ThemeToggle />
      </header>
      <p className="intro">
        The cheapest half-hours to charge an electric car on Agile Octopus in {regionName(settings.region)}.
      </p>
      <main id="main">
        <PlanSummary result={result} />
        <div className="card">
          <SettingsForm settings={settings} onChange={update} />
        </div>
        <DataStatus
          status={status}
          onRetry={retry}
          onUseSample={() => update({ sample: '1' })}
          onUseLive={() => update({ sample: undefined })}
        />
        {shown.length > 0 && (
          <section aria-labelledby="chart-heading" className="card reveal">
            <h2 id="chart-heading">Prices at a glance</h2>
            <RateChart slots={shown} chosen={chosen} now={now} />
          </section>
        )}
        <RateTable slots={shown} chosen={chosen} />
      </main>
      <footer>
        <p>
          Prices come from the public Octopus Energy API and are shown for information. This is an independent
          project and is not affiliated with Octopus Energy. Check your own tariff before relying on the
          figures.
        </p>
      </footer>
    </>
  );
}
