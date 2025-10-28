import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'system' | 'light' | 'dim' | 'lightsOut' | 'darkGrey';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return (savedTheme as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyFinalTheme = (finalTheme: 'light' | 'dim' | 'lightsOut' | 'darkGrey') => {
        root.classList.remove('light', 'dim', 'lightsOut', 'darkGrey');
        root.classList.add(finalTheme);
    };
    
    localStorage.setItem('appTheme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemThemeListener = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
            applyFinalTheme(e.matches ? 'lightsOut' : 'light');
        }
    };

    if (theme === 'system') {
        applyFinalTheme(mediaQuery.matches ? 'lightsOut' : 'light');
        mediaQuery.addEventListener('change', systemThemeListener);
    } else {
        applyFinalTheme(theme);
    }
    
    return () => {
      mediaQuery.removeEventListener('change', systemThemeListener);
    };

  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};