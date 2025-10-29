import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons/MiscIcons';
import Appearance from './Appearance';
import TimeFormat from './TimeFormat';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [view, setView] = useState<'main' | 'appearance' | 'timeFormat'>('main');

  if (view === 'appearance') {
    return <Appearance onBack={() => setView('main')} />;
  }

  if (view === 'timeFormat') {
    return <TimeFormat onBack={() => setView('main')} />;
  }

  return (
    <div className="bg-primary text-primary min-h-screen p-4 flex flex-col">
      <div className="flex-grow">
        <header className="flex items-center mb-4">
          <button onClick={onBack} className="p-2 mr-2">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </header>
        <div className="space-y-2">
          <button
            onClick={() => setView('timeFormat')}
            className="w-full text-left p-4 rounded-lg flex justify-between items-center bg-secondary"
          >
            <span>Time Format</span>
            <ChevronRightIcon className="w-6 h-6 text-secondary" />
          </button>
          <button
            onClick={() => setView('appearance')}
            className="w-full text-left p-4 rounded-lg flex justify-between items-center bg-secondary"
          >
            <span>App Appearance</span>
            <ChevronRightIcon className="w-6 h-6 text-secondary" />
          </button>
        </div>
      </div>
      <footer className="text-center py-4 text-secondary text-sm">
        Developed with ❤️ by Moomin Wani
      </footer>
    </div>
  );
};

export default Settings;