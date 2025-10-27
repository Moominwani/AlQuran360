import React from 'react';
import { LocationIcon, SunIcon, MoonIcon } from '../contexts/MiscIcons';
import { useTheme } from '../contexts/ThemeContext';

interface TopBarProps {
    location: string;
    onLocationClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ location, onLocationClick }) => {
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';

    return (
        <div className="flex items-center justify-between p-4 bg-transparent">
            <button onClick={onLocationClick} className="flex items-center space-x-1 cursor-pointer">
                <LocationIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-300">{location}</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AlQuran360</h1>
            <div className="flex items-center space-x-2">
                <SunIcon className={`w-5 h-5 ${!isDarkMode ? 'text-yellow-400' : 'text-gray-500'}`} />
                <button 
                    onClick={toggleTheme}
                    aria-label="Toggle dark mode"
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
                <MoonIcon className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-gray-500'}`} />
            </div>
        </div>
    );
};

export default TopBar;