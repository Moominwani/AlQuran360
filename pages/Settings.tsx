import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../contexts/MiscIcons';
import Appearance from './Appearance';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [view, setView] = useState<'main' | 'appearance'>('main');

  if (view === 'appearance') {
    return <Appearance onBack={() => setView('main')} />;
  }

  return (
    <div className="bg-primary text-primary min-h-screen p-4">
      <header className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 mr-2">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>
      <div className="space-y-2">
        <button
          onClick={() => setView('appearance')}
          className="w-full text-left p-4 rounded-lg flex justify-between items-center bg-secondary"
        >
          <span>App Appearance</span>
          <ChevronRightIcon className="w-6 h-6 text-secondary" />
        </button>
      </div>
    </div>
  );
};

export default Settings;
