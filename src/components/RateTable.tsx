import { formatClock, formatDay, formatPence } from '../domain/format';
import type { Slot } from '../domain/slot';

interface Props {
  slots: Slot[];
  chosen: Slot[];
}

export function RateTable({ slots, chosen }: Props) {
  if (slots.length === 0) return null;
  const chosenStarts = new Set(chosen.map((s) => s.start));

  return (
    <section aria-labelledby="table-heading" className="card reveal">
      <details>
        <summary>
          <h2 id="table-heading">Prices as a table</h2>
        </summary>
        <div className="table-scroll" role="region" aria-label="Prices table, scrollable" tabIndex={0}>
          <table>
            <caption>Half-hourly Agile prices in pence per kWh including VAT, in UK time</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Time</th>
                <th scope="col">Price</th>
                <th scope="col">Charge</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const isChosen = chosenStarts.has(slot.start);
                return (
                  <tr key={slot.start} className={isChosen ? 'chosen' : undefined}>
                    <td>{formatDay(slot.start)}</td>
                    <td>
                      {formatClock(slot.start)} to {formatClock(slot.end)}
                    </td>
                    <td>{formatPence(slot.pence)}</td>
                    <td>{isChosen ? 'Charge here' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
