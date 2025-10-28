import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dim' | 'lightsOut' | 'custom';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customColor: string;
  setCustomColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const isColorLight = (hex: string): boolean => {
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return (savedTheme as Theme) || 'light';
  });

  const [customColor, setCustomColor] = useState<string>(() => {
    const savedColor = localStorage.getItem('customThemeColor');
    return savedColor || '#ffffff';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dim', 'lightsOut', 'custom', 'custom-light-bg', 'custom-dark-bg');
    root.style.removeProperty('--custom-bg-color');

    if (theme === 'custom') {
      root.classList.add('custom');
      root.style.setProperty('--custom-bg-color', customColor);
      localStorage.setItem('appTheme', 'custom');
      localStorage.setItem('customThemeColor', customColor);

      if (isColorLight(customColor)) {
        root.classList.add('custom-light-bg');
      } else {
        root.classList.add('custom-dark-bg');
      }
    } else {
      root.classList.add(theme);
      localStorage.setItem('appTheme', theme);
    }
  }, [theme, customColor]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColor, setCustomColor }}>
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