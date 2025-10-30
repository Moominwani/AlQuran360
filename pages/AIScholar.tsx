import React from 'react';
import { ChevronLeftIcon } from '../components/icons/MiscIcons';

interface AIScholarProps {
  onBack: () => void;
}

const AIScholar: React.FC<AIScholarProps> = ({ onBack }) => {
  return (
    <div className="bg-primary text-primary h-screen flex flex-col">
      <header className="flex items-center p-4 border-b border-primary flex-shrink-0">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-center flex-1 pr-8">Islamic AI Scholar</h1>
      </header>
      <main className="flex-grow bg-white">
        <iframe
          src="https://moominwani2006-alquran360.hf.space"
          frameBorder="0"
          className="w-full h-full"
          title="Islamic AI Scholar"
        ></iframe>
      </main>
    </div>
  );
};

export default AIScholar;
