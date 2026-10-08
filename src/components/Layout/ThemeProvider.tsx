import { createContext, useContext, useState, useLayoutEffect, useMemo, useRef } from 'react';

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

  // Apply the initial theme instantly; animate only deliberate theme switches.
  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    const shouldAnimate = !isInitialMount.current;

    if (shouldAnimate) {
      html.classList.add("theme-transitioning");
      window.setTimeout(() => html.classList.remove("theme-transitioning"), 340);
    }

    if (newTheme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }

    // Debounced save to localStorage
    debouncedSaveTheme(newTheme);
  };

  // Use layoutEffect to prevent flash of wrong theme
  useLayoutEffect(() => {
    applyTheme(theme);
    isInitialMount.current = false;
  }, [theme]);

  // Listen to system preference changes
  useLayoutEffect(() => {
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
