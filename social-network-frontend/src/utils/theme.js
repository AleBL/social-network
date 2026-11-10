// Light/dark theme. Without a saved choice the operating system decides;
// the toggle saves "light" or "dark" and sets <html data-theme>, which
// main.css reads. index.html applies the saved value before the first paint.
export const THEME_STORAGE_KEY = 'theme';

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getStoredTheme() {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch {
    return null;
  }
}

// The theme on screen: the one picked by the user, or the system one.
export function getCurrentTheme() {
  return (
    document.documentElement.dataset.theme || getStoredTheme() || systemTheme()
  );
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the theme still applies to this visit.
  }
}
