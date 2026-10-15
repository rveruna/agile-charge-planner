import { RatesError } from '../api/octopusClient';
import { formatClock } from '../domain/format';
import type { DataStatus as Status } from '../hooks/useRates';

interface Props {
  status: Status;
  onRetry: () => void;
  onUseSample: () => void;
  onUseLive: () => void;
}

function explain(error: Error): string {
  if (error instanceof RatesError) {
    if (error.kind === 'network') return 'Could not reach Octopus Energy.';
    if (error.kind === 'http') return `Octopus Energy could not provide prices (status ${error.status}).`;
    return 'Octopus Energy sent prices this app could not read.';
  }
  return 'Something went wrong getting the prices.';
}

/** Tells the user where the prices on screen came from, and offers a way forward when they are missing. */
export function DataStatus({ status, onRetry, onUseSample, onUseLive }: Props) {
  switch (status.kind) {
    case 'loading':
      return (
        <p role="status" className="banner">
          Loading prices from Octopus Energy…
        </p>
      );
    case 'live':
      return (
        <p role="status" className="banner banner-quiet">
          Live Agile prices from Octopus Energy, updated {formatClock(status.updatedAt)}.
        </p>
      );
    case 'saved':
      return (
        <div role="status" className="banner banner-warn">
          <p>
            {status.reason === 'offline' ? 'You are offline. ' : 'Could not refresh the prices. '}
            Showing the prices saved at {formatClock(status.updatedAt)}.
          </p>
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      );
    case 'offline-empty':
      return (
        <div role="alert" className="banner banner-error">
          <p>You are offline and there are no saved prices for this region.</p>
          <button type="button" onClick={onUseSample}>
            Use sample prices
          </button>
        </div>
      );
    case 'error':
      return (
        <div role="alert" className="banner banner-error">
          <p>{explain(status.error)}</p>
          <button type="button" onClick={onRetry}>
            Try again
          </button>
          <button type="button" onClick={onUseSample}>
            Use sample prices
          </button>
        </div>
      );
    case 'sample':
      return (
        <div role="note" className="banner banner-warn">
          <p>
            These are sample prices, not real ones. They show the shape of a typical Agile day so the planner
            can be tried without a connection.
          </p>
          <button type="button" onClick={onUseLive}>
            Use live prices
          </button>
        </div>
      );
  }
}
