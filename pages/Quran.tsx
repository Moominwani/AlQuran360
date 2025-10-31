import React, { useState, useMemo } from 'react';
import { Surah } from '../types';
import { SearchIcon, ChevronRightIcon } from '../components/icons/MiscIcons';
import { surahMetadata } from '../utils/surahMetadata';

interface QuranProps {
  onSurahSelect: (surahNumber: number) => void;
}

const Quran: React.FC<QuranProps> = ({ onSurahSelect }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredSurahs = useMemo(() => {
    // Cast surahMetadata to Surah[] to match expected type.
    const allSurahs: Surah[] = surahMetadata.map(s => ({...s, name: s.name}));
    
    return allSurahs.filter(surah =>
      surah.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surah.number.toString().includes(searchTerm)
    );
  }, [searchTerm]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Holy Quran</h1>
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
        <input
          type="text"
          placeholder="Search surah by name or number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-secondary border border-primary rounded-lg py-2 pl-10 pr-4 text-primary placeholder-color focus:outline-none focus:ring-1 focus:ring-yellow-400"
        />
      </div>

      <div className="space-y-3">
        {filteredSurahs.map(surah => (
          <button 
            key={surah.number} 
            onClick={() => onSurahSelect(surah.number)}
            className="w-full bg-secondary rounded-xl p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center font-bold text-white">
                {surah.number}
              </div>
              <div>
                <p className="font-bold text-lg text-primary">{surah.englishName}</p>
                <p className="text-sm text-secondary">
                  {surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs • {surah.revelationType}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <p className="font-amiri text-2xl text-right text-primary">{surah.name}</p>
              <ChevronRightIcon className="w-6 h-6 text-secondary" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Quran;
