import React, { useState } from 'react';
import { ChevronLeftIcon } from '../components/icons/MiscIcons';

interface AIScholarProps {
  onBack: () => void;
}

const AIScholar: React.FC<AIScholarProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="bg-primary text-primary h-screen flex flex-col">
      <header className="flex items-center p-4 border-b border-primary flex-shrink-0">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-center flex-1 pr-8">Islamic AI Scholar</h1>
      </header>
      <main className="flex-grow p-2 sm:p-4 bg-tertiary relative">
        {isLoading && (
          <div className="absolute inset-2 sm:inset-4 flex items-center justify-center bg-tertiary z-10 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        <div 
          className="w-full h-full overflow-hidden relative rounded-xl shadow-lg"
          style={{ visibility: isLoading ? 'hidden' : 'visible' }}
        >
          <iframe 
            src="https://islamgpt.info/" 
            onLoad={() => setIsLoading(false)}
            style={{ 
              width: '100%', 
              height: '3000px',
              border: 'none', 
              position: 'absolute', 
              top: 0, 
              left: 0 
            }}
            title="Islamic AI Scholar"
          >
          </iframe>
        </div>
      </main>
    </div>
  );
};

export default AIScholar;
