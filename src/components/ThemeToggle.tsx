import { useState } from 'react';

type Theme = 'dark' | 'light';
const KEY = 'agile-charge-planner-theme';

/** The page is dark unless the visitor picks light. index.html applies a saved choice before first paint. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts for this visit only
    }
  };

  return (
    <button type="button" className="theme-toggle" onClick={toggle}>
      {theme === 'dark' ? 'Light theme' : 'Dark theme'}
    </button>
  );
}
