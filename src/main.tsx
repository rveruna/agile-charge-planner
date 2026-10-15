import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import App from './App';
import { KEEP_MS } from './hooks/useRates';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: KEEP_MS, retry: 1 } } });

/** localStorage can throw when storage is blocked, in which case prices are simply not saved. */
function safeStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

const persister = createSyncStoragePersister({ storage: safeStorage(), key: 'agile-charge-planner' });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: KEEP_MS, buster: '1' }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
);
