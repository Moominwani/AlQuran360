import React, { useState } from 'react';
import Appearance from './Appearance';
import TimeFormat from './TimeFormat';
import About from './About';
import { ChevronRightIcon } from '../components/icons/MiscIcons';

type SettingsView = 'main' | 'time' | 'appearance' | 'about';

const SettingsLink: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-4 rounded-lg flex justify-between items-center bg-secondary transition-colors hover:bg-tertiary"
    >
        <span className="font-medium text-primary">{label}</span>
        <ChevronRightIcon className="w-5 h-5 text-secondary" />
    </button>
);

const Settings: React.FC = () => {
    const [view, setView] = useState<SettingsView>('main');

    const handleBack = () => setView('main');

    if (view === 'time') {
        return <TimeFormat onBack={handleBack} />;
    }
    if (view === 'appearance') {
        return <Appearance onBack={handleBack} />;
    }
    if (view === 'about') {
        return <About onBack={handleBack} />;
    }

    return (
        <div className="bg-primary text-primary min-h-full flex flex-col">
            <header className="sticky top-0 bg-primary z-10 p-4">
                <h1 className="text-2xl font-bold text-center">Settings</h1>
            </header>
            
            <main className="flex-grow p-4 space-y-3 pb-20">
                <SettingsLink label="Time Format" onClick={() => setView('time')} />
                <SettingsLink label="App Appearance" onClick={() => setView('appearance')} />
                <SettingsLink label="About AlQuran360" onClick={() => setView('about')} />
            </main>
            
            <footer className="fixed bottom-20 left-0 right-0 text-center py-4 bg-primary text-secondary text-sm">
                Developed with ❤️ by Moomin Wani
            </footer>
        </div>
    );
};

export default Settings;
