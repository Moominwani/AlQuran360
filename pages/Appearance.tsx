import React from 'react';
import { ChevronLeftIcon } from '../components/icons/MiscIcons';
import { useTheme } from '../contexts/ThemeContext';

interface AppearanceProps {
  onBack: () => void;
}

const Appearance: React.FC<AppearanceProps> = ({ onBack }) => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', name: 'Light' },
    { id: 'dim', name: 'Dim' },
    { id: 'lightsOut', name: 'Lights Out' },
    { id: 'darkGrey', name: 'Dark Grey' },
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
    </div>
  );
};

export default Appearance;
