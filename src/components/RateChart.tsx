import { formatClock, formatDay, formatPence, describeSlots } from '../domain/format';
import type { Slot } from '../domain/slot';
import { colors } from './colors';

interface Props {
  slots: Slot[];
  chosen: Slot[];
}

const WIDTH = 720;
const HEIGHT = 240;
const MARGIN = { top: 12, right: 8, bottom: 34, left: 44 };

/**
 * A bar per half hour, with the chosen slots in a darker colour. Negative prices hang below the zero line.
 * The chart is a picture for sighted users; the table beside it carries the same data for everyone else.
 */
export function RateChart({ slots, chosen }: Props) {
  if (slots.length === 0) return null;

  const chosenStarts = new Set(chosen.map((s) => s.start));
  const prices = slots.map((s) => s.pence);
  const top = Math.max(0, ...prices);
  const bottom = Math.min(0, ...prices);
  const span = top - bottom || 1;

  const plotW = WIDTH - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const slotW = plotW / slots.length;
  const y = (value: number) => MARGIN.top + ((top - value) / span) * plotH;
  const zeroY = y(0);

  const label =
    `Bar chart of half-hourly prices from ${formatDay(slots[0]!.start)} ${formatClock(slots[0]!.start)} ` +
    `to ${formatClock(slots[slots.length - 1]!.end)}, from ${formatPence(Math.min(...prices))} to ` +
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
        <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={zeroY} y2={zeroY} stroke={colors.axis} />
        <text x={MARGIN.left - 6} y={y(top) + 4} textAnchor="end" fontSize="11" fill={colors.text}>
          {formatPence(top)}
        </text>
        {bottom < 0 && (
          <text x={MARGIN.left - 6} y={y(bottom)} textAnchor="end" fontSize="11" fill={colors.text}>
            {formatPence(bottom)}
          </text>
        )}
        <text x={MARGIN.left - 6} y={zeroY + 4} textAnchor="end" fontSize="11" fill={colors.text}>
          0p
        </text>

        {slots.map((slot, i) => {
          const isChosen = chosenStarts.has(slot.start);
          const barTop = y(Math.max(slot.pence, 0));
          const barH = Math.max(Math.abs(y(slot.pence) - zeroY), 1);
          return (
            <rect
              key={slot.start}
              data-chosen={isChosen}
              x={MARGIN.left + i * slotW + slotW * 0.1}
              y={slot.pence >= 0 ? barTop : zeroY}
              width={slotW * 0.8}
              height={barH}
              fill={isChosen ? colors.barChosen : colors.bar}
            />
          );
        })}

        {slots.map((slot, i) =>
          chosenStarts.has(slot.start) ? (
            <rect
              key={slot.start}
              data-marker
              x={MARGIN.left + i * slotW + slotW * 0.1}
              y={HEIGHT - MARGIN.bottom + 3}
              width={slotW * 0.8}
              height={5}
              fill={colors.barChosen}
            />
          ) : null,
        )}

        {slots.map((slot, i) =>
          i % 6 === 0 ? (
            <text
              key={slot.start}
              x={MARGIN.left + i * slotW}
              y={HEIGHT - 12}
              fontSize="11"
              fill={colors.text}
            >
              {formatClock(slot.start)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
