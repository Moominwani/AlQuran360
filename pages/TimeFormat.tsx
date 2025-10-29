import React from 'react';
import { ChevronLeftIcon } from '../components/icons/MiscIcons';
import { useTimeFormat } from '../contexts/TimeFormatContext';

interface TimeFormatProps {
  onBack: () => void;
}

const TimeFormat: React.FC<TimeFormatProps> = ({ onBack }) => {
  const { timeFormat, setTimeFormat } = useTimeFormat();

  const formats = [
    { id: '12h', name: '12-hour' },
    { id: '24h', name: '24-hour' },
  ];

  return (
    <div className="bg-primary text-primary min-h-screen p-4">
      <header className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 mr-2">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Time Format</h1>
      </header>
      <div className="space-y-2">
        {formats.map((f) => (
          <button
            key={f.id}
            onClick={() => setTimeFormat(f.id as any)}
            className="w-full text-left p-4 rounded-lg flex justify-between items-center bg-secondary"
          >
            <span>{f.name}</span>
            {timeFormat === f.id && (
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeFormat;