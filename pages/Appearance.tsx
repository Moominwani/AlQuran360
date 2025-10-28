import React from 'react';
import { ChevronLeftIcon } from '../contexts/MiscIcons';
import { useTheme } from '../contexts/ThemeContext';

interface AppearanceProps {
  onBack: () => void;
}

const Appearance: React.FC<AppearanceProps> = ({ onBack }) => {
  const { theme, setTheme, customColor, setCustomColor } = useTheme();

  const themes = [
    { id: 'light', name: 'Light' },
    { id: 'dim', name: 'Dim' },
    { id: 'lightsOut', name: 'Lights Out' },
    { id: 'custom', name: 'Custom' },
  ];

  return (
    <div className="bg-primary text-primary min-h-screen p-4">
      <header className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 mr-2">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">App Appearance</h1>
      </header>
      <div className="space-y-2">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id as any)}
            className="w-full text-left p-4 rounded-lg flex justify-between items-center bg-secondary"
          >
            <span>{t.name}</span>
            {theme === t.id && (
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {theme === 'custom' && (
        <div className="mt-6 p-4 bg-secondary rounded-lg animate-fade-in">
          <label htmlFor="custom-color-picker" className="block text-primary font-medium mb-3">
            Choose custom background color
          </label>
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-primary">
              <input
                type="color"
                id="custom-color-picker"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="absolute -top-1 -left-1 w-16 h-16 cursor-pointer"
                aria-label="Custom background color picker"
              />
            </div>
            <span className="font-mono text-lg text-secondary uppercase">{customColor}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appearance;