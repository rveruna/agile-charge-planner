import { act, renderHook } from '@testing-library/react';
import { useNow } from './useNow';

describe('useNow', () => {
  afterEach(() => vi.useRealTimers());

  it('returns the current time and moves it on at each interval', () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-15T10:00:00Z') });
    const { result } = renderHook(() => useNow(30_000));
    const first = result.current;

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current - first).toBe(30_000);
  });

  it('stops ticking when unmounted', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useNow(1000));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
