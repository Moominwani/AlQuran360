import React from 'react';
import { ChevronLeftIcon } from '../contexts/MiscIcons';

interface AboutProps {
  onBack: () => void;
}

const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="bg-primary text-primary min-h-screen p-4">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 mr-2">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">About AlQuran360</h1>
      </header>
      <div className="px-2 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="bg-secondary p-4 rounded-lg">
          <p className="text-primary">AlQuran360 is a comprehensive Islamic application designed to be your daily companion.</p>
          <p className="text-sm text-secondary mt-1">Version: 1.0.0</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg">
          <p className="font-bold text-primary mb-2">Features:</p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-primary">
              <li>Accurate Prayer Times</li>
              <li>Complete Quran Explorer</li>
              <li>Hadith Library</li>
              <li>Tasbeeh Counter</li>
              <li>Qibla Direction</li>
          </ul>
        </div>
        <div className="bg-secondary p-4 rounded-lg">
          <p className="font-bold text-primary mb-2">Data Sources:</p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-primary">
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

export default About;