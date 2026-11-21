import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  darkMode: false,
  setDarkMode: () => { },
  toggleTheme: () => { },
});

// Debounced localStorage write
const debouncedSaveTheme = (() => {
  let timeout: NodeJS.Timeout;
  return (theme: Theme) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      localStorage.setItem('theme', theme);
    }, 300);
  };
})();

// Get initial theme
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const isInitialMount = useRef(true);

  // Apply the initial theme without redundant DOM writes when head script already synced it.
  const applyTheme = (newTheme: Theme, isMount = false) => {
    const html = document.documentElement;
    const shouldAnimate = !isMount;

    if (shouldAnimate) {
      html.classList.add("theme-transitioning");
      window.setTimeout(() => html.classList.remove("theme-transitioning"), 340);
    }

    const opposite = newTheme === 'dark' ? 'light' : 'dark';
    if (!html.classList.contains(newTheme)) {
      html.classList.add(newTheme);
    }
    if (html.classList.contains(opposite)) {
      html.classList.remove(opposite);
    }

    if (!isMount) {
      // Debounced save to localStorage only after deliberate theme change
      debouncedSaveTheme(newTheme);
    }
  };

  useEffect(() => {
    const mount = isInitialMount.current;
    applyTheme(theme, mount);
    isInitialMount.current = false;
  }, [theme]);

  // Listen to system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ThemeContextType>(() => ({
    theme,
    darkMode: theme === 'dark',
    setDarkMode: (value: boolean) => setTheme(value ? 'dark' : 'light'),
    toggleTheme: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark'),
  }), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
