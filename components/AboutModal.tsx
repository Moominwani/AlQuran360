import React from 'react';
import { CloseIcon } from '../contexts/MiscIcons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a4538] rounded-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-400">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About AlQuran360</h2>
        <div className="text-gray-600 dark:text-gray-300 space-y-2 text-sm max-h-[70vh] overflow-y-auto">
            <p>AlQuran360 is a comprehensive Islamic application designed to be your daily companion.</p>
            <p>Version: 1.0.0</p>
            <p className="pt-2"><strong>Features:</strong></p>
            <ul className="list-disc list-inside ml-4">
                <li>Accurate Prayer Times</li>
                <li>Complete Quran Explorer</li>
                <li>Hadith Library</li>
                <li>Tasbeeh Counter</li>
                <li>Qibla Direction</li>
            </ul>
            <p className="pt-2"><strong>Data Sources:</strong></p>
            <ul className="list-disc list-inside ml-4">
                <li>Prayer Times: aladhan.com</li>
                <li>Quran Text & Audio: alquran.cloud</li>
                <li>Hadith Data: fawazahmed0/hadith-api</li>
                <li>Location Search: open-meteo.com</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;