import type { CSSProperties } from 'react';
import { formatClock, formatDay, formatPence, describeSlots } from '../domain/format';
import type { Slot } from '../domain/slot';

interface Props {
  slots: Slot[];
  chosen: Slot[];
  now: number;
}

const WIDTH = 720;
const HEIGHT = 240;
const MARGIN = { top: 12, right: 8, bottom: 34, left: 44 };

/**
 * A bar per half hour, with the chosen slots in a brighter colour. Negative prices hang below the zero line.
 * The chart is a picture for sighted users; the table below it carries the same data for everyone else.
 * Colours and motion come from styles.css, so the theme and prefers-reduced-motion apply without any code here.
 */
export function RateChart({ slots, chosen, now }: Props) {
  if (slots.length === 0) return null;

  // Each chosen slot's position in the charge, so they can light up in order
  const chosenOrder = new Map(chosen.map((s, i) => [s.start, i]));
  const prices = slots.map((s) => s.pence);
  const top = Math.max(0, ...prices);
  const bottom = Math.min(0, ...prices);
  const span = top - bottom || 1;

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slotW = plotW / slots.length;
  const y = (value: number) => MARGIN.top + ((top - value) / span) * plotH;
  const zeroY = y(0);

  const first = slots[0]!;
  const last = slots[slots.length - 1]!;
  const nowX = MARGIN.left + ((now - first.start) / (first.end - first.start)) * slotW;
  const showNow = now >= first.start && now < last.end;

  const label =
    `Bar chart of half-hourly prices from ${formatDay(first.start)} ${formatClock(first.start)} ` +
    `to ${formatClock(last.end)}, from ${formatPence(Math.min(...prices))} to ` +
    `${formatPence(Math.max(...prices))} per kWh.` +
    (chosen.length ? ` The cheapest charge is ${describeSlots(chosen)}.` : '') +
    ' The same figures are in the table below.';

  return (
    <div className="chart-scroll" role="region" aria-label="Price chart, scrollable" tabIndex={0}>
      <svg
        className="chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={label}
        data-testid="rate-chart"
      >
        <line className="zero" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={zeroY} y2={zeroY} />
        <text x={MARGIN.left - 6} y={y(top) + 4} textAnchor="end" fontSize="12">
          {formatPence(top)}
        </text>
        {bottom < 0 && (
          <text x={MARGIN.left - 6} y={y(bottom)} textAnchor="end" fontSize="12">
            {formatPence(bottom)}
          </text>
        )}
        <text x={MARGIN.left - 6} y={zeroY + 4} textAnchor="end" fontSize="12">
          0p
        </text>

        {slots.map((slot, i) => {
          const order = chosenOrder.get(slot.start);
          const isChosen = order !== undefined;
          const barY = slot.pence >= 0 ? y(slot.pence) : zeroY;
          const barH = Math.max(Math.abs(y(slot.pence) - zeroY), 1);
          // Geometry is set as CSS as well as attributes, so a change of region or horizon animates the heights
          const style = { '--i': i, '--c': order ?? 0, y: barY, height: barH } as CSSProperties;
          return (
            <rect
              key={slot.start}
              className={`bar${isChosen ? ' chosen' : ''}${slot.pence < 0 ? ' neg' : ''}`}
              data-chosen={isChosen}
              x={MARGIN.left + i * slotW + slotW * 0.1}
              y={barY}
              width={slotW * 0.8}
              height={barH}
              style={style}
            />
          );
        })}

        {slots.map((slot, i) =>
          chosenOrder.has(slot.start) ? (
            <rect
              key={slot.start}
              className="marker"
              data-marker
              x={MARGIN.left + i * slotW + slotW * 0.1}
              y={HEIGHT - MARGIN.bottom + 3}
              width={slotW * 0.8}
              height={5}
            />
          ) : null,
        )}

        {showNow && (
          <g className="now" data-testid="now-marker">
            <line x1={nowX} x2={nowX} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
            <circle cx={nowX} cy={MARGIN.top} r={4} />
            <text x={nowX + 6} y={MARGIN.top + 4} fontSize="12">
              Now
            </text>
          </g>
        )}

        {/* A label too close to the right edge would be cut off, so it is left out */}
        {slots.map((slot, i) =>
          i % 6 === 0 && MARGIN.left + i * slotW <= WIDTH - 36 ? (
            <text key={slot.start} x={MARGIN.left + i * slotW} y={HEIGHT - 12} fontSize="12">
              {formatClock(slot.start)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
