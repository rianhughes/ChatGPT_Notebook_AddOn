export type ThemeMode = "day" | "evening" | "night";

const THEME_STORAGE_KEY = "chatgpt-notes-theme";
const THEME_SEQUENCE: ThemeMode[] = ["day", "evening", "night"];

export function getInitialTheme(): ThemeMode {
  const storedTheme = readStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "night";
  }

  return "day";
}

export function getNextTheme(theme: ThemeMode): ThemeMode {
  const currentIndex = THEME_SEQUENCE.indexOf(theme);
  return THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "day" ? "light" : "dark";
}

export function persistTheme(theme: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme persistence should not block the sidebar in restricted contexts.
  }
}

function readStoredTheme(): ThemeMode | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "day" || value === "evening" || value === "night") {
      return value;
    }

    if (value === "light") {
      return "day";
    }

    if (value === "dark") {
      return "night";
    }

    return null;
  } catch {
    return null;
  }
}
