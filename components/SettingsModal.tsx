import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, CloseIcon } from '../contexts/MiscIcons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  // FIX: Property 'toggleTheme' does not exist on type 'ThemeContextType'. Destructured `setTheme` instead.
  const { theme, setTheme } = useTheme();
  // FIX: This comparison appears to be unintentional because the types 'Theme' and '"dark"' have no overlap. Corrected to check for non-light themes.
  const isDarkMode = theme !== 'light';

  if (!isOpen) return null;

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dim');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a4538] rounded-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
        
        <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800 dark:text-gray-200">Appearance</span>
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
      </div>
    </div>
  );
};

export default SettingsModal;