import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatesError } from '../api/octopusClient';
import { DataStatus } from './DataStatus';

const handlers = { onRetry: vi.fn(), onUseSample: vi.fn(), onUseLive: vi.fn() };

describe('DataStatus', () => {
  it('describes an error that is not a RatesError generically', () => {
    render(<DataStatus status={{ kind: 'error', error: new Error('boom') }} {...handlers} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong getting the prices.');
  });

  it('describes each kind of RatesError', () => {
    const { rerender } = render(
      <DataStatus status={{ kind: 'error', error: new RatesError('network', 'x') }} {...handlers} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach Octopus Energy.');

    rerender(
      <DataStatus status={{ kind: 'error', error: new RatesError('http', 'x', 404) }} {...handlers} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('status 404');

    rerender(<DataStatus status={{ kind: 'error', error: new RatesError('invalid', 'x') }} {...handlers} />);
    expect(screen.getByRole('alert')).toHaveTextContent('could not read');
  });

  it('calls the right handler from each button', async () => {
    const user = userEvent.setup();
    render(<DataStatus status={{ kind: 'error', error: new RatesError('network', 'x') }} {...handlers} />);

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.click(screen.getByRole('button', { name: 'Use sample prices' }));

    expect(handlers.onRetry).toHaveBeenCalledTimes(1);
    expect(handlers.onUseSample).toHaveBeenCalledTimes(1);
  });

  it('says when saved prices are shown because of an error', () => {
    render(
      <DataStatus
        status={{ kind: 'saved', updatedAt: Date.parse('2026-12-01T09:05:00Z'), reason: 'error' }}
        {...handlers}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Could not refresh the prices. Showing the prices saved at 09:05.',
    );
  });
});
