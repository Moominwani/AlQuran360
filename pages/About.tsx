import React from 'react';
import { ChevronLeftIcon } from '../contexts/MiscIcons';

interface AboutProps {
  onBack: () => void;
}

const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="bg-primary text-primary min-h-screen p-4">
      <header className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 mr-2">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">About</h1>
      </header>
      {/* Content is blank as requested */}
    </div>
  );
};

export default About;
