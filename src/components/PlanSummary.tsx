import { describeSlots, formatPence, formatPounds } from '../domain/format';
import type { PlanResult } from '../domain/planner';

interface Props {
  result: PlanResult | null;
}

export function PlanSummary({ result }: Props) {
  if (!result) {
    return (
      <section aria-labelledby="plan-heading" className="card summary">
        <h2 id="plan-heading">Cheapest time to charge</h2>
        <p aria-live="polite">Waiting for prices.</p>
      </section>
    );
  }

  if (result.kind === 'too-short') {
    const hours = result.available / 2;
    return (
      <section aria-labelledby="plan-heading" className="card summary">
        <h2 id="plan-heading">Cheapest time to charge</h2>
        <p role="alert">
          The prices available cover {hours} {hours === 1 ? 'hour' : 'hours'} in one run, which is not enough
          for this charge. Try a shorter charge, a wider “charge within” choice or the flexible style. Agile
          prices for tomorrow are usually published around 4pm.
        </p>
      </section>
    );
  }

  const { plan } = result;
  const saving = plan.savingPence;
  return (
    <section aria-labelledby="plan-heading" className="card summary">
      <h2 id="plan-heading">Cheapest time to charge</h2>
      <div aria-live="polite">
        <p className="when" key={describeSlots(plan.chosen)}>
          {describeSlots(plan.chosen)}
        </p>
        <dl>
          <div>
            <dt>Average price</dt>
            <dd>{formatPence(plan.averagePence)} per kWh</dd>
          </div>
          <div>
            <dt>Energy added</dt>
            <dd>{plan.energyKwh} kWh</dd>
          </div>
          <div>
            <dt>Estimated cost</dt>
            <dd>{formatPounds(plan.costPence)}</dd>
          </div>
          <div>
            <dt>If you started now</dt>
            <dd>
              {formatPounds(plan.startNowCostPence)}
              {saving >= 0.5 ? `, so this saves ${formatPounds(saving)}` : ', about the same'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
