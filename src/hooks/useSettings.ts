import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { parseSettings, settingsToSearch, type Settings } from '../domain/settings';

const CHANGE_EVENT = 'agile-settings-change';

function subscribe(listener: () => void): () => void {
  window.addEventListener('popstate', listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

const getSearch = () => window.location.search;

/**
 * The user's choices, kept in the URL query string so a link reproduces them. This is deliberately
 * separate from the server state held by TanStack Query: the query only needs the region.
 */
export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const search = useSyncExternalStore(subscribe, getSearch);
  const settings = useMemo(() => parseSettings(search), [search]);

  const update = useCallback((patch: Partial<Settings>) => {
    const next = { ...parseSettings(window.location.search), ...patch };
    const query = settingsToSearch(next);
    window.history.replaceState(null, '', `${window.location.pathname}${query}${window.location.hash}`);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [settings, update];
}
