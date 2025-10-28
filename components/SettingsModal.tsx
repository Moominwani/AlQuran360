import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, CloseIcon } from '../contexts/MiscIcons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme !== 'light';

  if (!isOpen) return null;

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dim');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-secondary rounded-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-secondary">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-primary mb-6">Settings</h2>
        
        <div className="flex items-center justify-between">
            <span className="font-medium text-primary">Appearance</span>
            <div className="flex items-center space-x-2">
                <SunIcon className={`w-5 h-5 ${!isDarkMode ? 'text-yellow-400' : 'text-secondary'}`} />
                <button 
                    onClick={toggleTheme}
                    aria-label="Toggle dark mode"
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDarkMode ? 'bg-tertiary' : 'bg-tertiary'}`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
                <MoonIcon className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-secondary'}`} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;