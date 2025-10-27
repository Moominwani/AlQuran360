import React from 'react';

const Qibla: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center p-4">
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 border-4 border-primary rounded-full"></div>
        <div className="absolute inset-2 border-2 border-secondary rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-24 bg-red-500 rounded-full origin-bottom transform rotate-45">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-gray-600 rounded-full"></div>
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 text-lg font-bold">N</span>
      </div>
      <h1 className="text-3xl font-bold mb-2">Qibla Direction</h1>
      <p className="text-secondary max-w-sm">
        Qibla direction functionality requires device compass access. This feature is currently under development for the web version.
      </p>
    </div>
  );
};

export default Qibla;
