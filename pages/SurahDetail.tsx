import React, { useState, useEffect, useRef } from 'react';
import { SurahDetailData, Ayah } from '../types';
import { BackIcon } from '../components/icons/SurahDetailIcons';
import AyahActions from '../components/AyahActions';
import AudioPlayer from '../components/AudioPlayer';

interface SurahDetailProps {
  surahNumber: number;
  onBack: () => void;
  startPlayback?: boolean;
  ayahNumber?: number;
}

const SurahDetail: React.FC<SurahDetailProps> = ({ surahNumber, onBack, startPlayback, ayahNumber }) => {
  const [surahData, setSurahData] = useState<SurahDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentAyah, setCurrentAyah] = useState<Ayah | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [menuState, setMenuState] = useState<{ isOpen: boolean; position: { top: number; left: number } }>({ isOpen: false, position: { top: 0, left: 0 } });
  
  const [playbackQueue, setPlaybackQueue] = useState<Ayah[]>([]);
  const [repeatAyah, setRepeatAyah] = useState(false);
  const [replayTrigger, setReplayTrigger] = useState(0);
  
  const ayahRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchSurahDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,ar.alafasy`);
        if (!response.ok) throw new Error('Failed to fetch Surah details');
        
        const data = await response.json();
        if (data.code === 200) {
          const textData = data.data[0];
          const audioData = data.data[1];
          const mergedAyahs = textData.ayahs.map((ayah: Ayah, index: number) => ({
            ...ayah,
            audio: audioData.ayahs[index].audio,
          }));
          setSurahData({ ...textData, ayahs: mergedAyahs });
        } else {
          throw new Error(data.status);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchSurahDetail();
  }, [surahNumber]);

  useEffect(() => {
    if (surahData && ayahNumber && ayahRefs.current[ayahNumber - 1]) {
        setTimeout(() => { // Timeout to ensure render is complete
            ayahRefs.current[ayahNumber - 1]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, 300); // Shorter delay
    }
  }, [surahData, ayahNumber]);

  const handleAyahClick = (e: React.MouseEvent, ayah: Ayah) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedAyah(ayah);
    
    // Position menu below the ayah, centered horizontally
    const top = rect.bottom + window.scrollY + 10;
    const left = rect.left + rect.width / 2 + window.scrollX;

    setMenuState({ isOpen: true, position: { top, left } });
  };

  const handleCloseMenu = () => {
    setMenuState({ isOpen: false, position: { top: 0, left: 0 } });
    setSelectedAyah(null);
  };
  
  const resetPlaybackModes = () => {
      setPlaybackQueue([]);
      setRepeatAyah(false);
      setReplayTrigger(0);
  }
  
  const handlePlayPause = () => {
    if (currentAyah) setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    resetPlaybackModes();
    if (surahData && currentAyah) {
      const currentIndex = surahData.ayahs.findIndex(a => a.number === currentAyah.number);
      if (currentIndex < surahData.ayahs.length - 1) {
        setCurrentAyah(surahData.ayahs[currentIndex + 1]);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handlePrev = () => {
    resetPlaybackModes();
    if (surahData && currentAyah) {
      const currentIndex = surahData.ayahs.findIndex(a => a.number === currentAyah.number);
      if (currentIndex > 0) {
        setCurrentAyah(surahData.ayahs[currentIndex - 1]);
        setIsPlaying(true);
      }
    }
  };
  
  const handleAudioEnded = () => {
    if (repeatAyah) {
      setReplayTrigger(c => c + 1);
    } else if (playbackQueue.length > 0) {
        const currentIndex = playbackQueue.findIndex(a => a.number === currentAyah?.number);
        if (currentIndex !== -1 && currentIndex < playbackQueue.length - 1) {
            setCurrentAyah(playbackQueue[currentIndex + 1]);
        } else {
            setIsPlaying(false);
            setPlaybackQueue([]);
        }
    } else {
        handleNext();
    }
  };

  const handlePlayToEndOfJuz = () => {
    if (!surahData || !selectedAyah) return;
    const currentJuz = selectedAyah.juz;
    const remainingAyahsInJuz = surahData.ayahs.filter(a => a.juz === currentJuz && a.numberInSurah >= selectedAyah.numberInSurah);
    
    resetPlaybackModes();
    setPlaybackQueue(remainingAyahsInJuz);
    setCurrentAyah(remainingAyahsInJuz[0]);
    setIsPlaying(true);
    handleCloseMenu();
  };

  const handleRepeat = () => {
    if (!selectedAyah) return;
    resetPlaybackModes();
    setRepeatAyah(true);
    setCurrentAyah(selectedAyah);
    setIsPlaying(true);
    handleCloseMenu();
  };

  const handleCopy = () => {
    if (!selectedAyah) return;
    navigator.clipboard.writeText(selectedAyah.text);
    handleCloseMenu();
  };

  const handleShare = () => {
    if (!selectedAyah || !surahData) return;
    if (navigator.share) {
      navigator.share({
        title: `Quran ${surahData.englishName}:${selectedAyah.numberInSurah}`,
        text: `"${selectedAyah.text}" - Quran ${surahData.number}:${selectedAyah.numberInSurah}`,
      });
    }
    handleCloseMenu();
  };

  useEffect(() => {
    if (startPlayback && surahData && surahData.ayahs.length > 0) {
        const firstAyah = surahData.ayahs[0];
        const allAyahs = surahData.ayahs;
        
        resetPlaybackModes();
        setPlaybackQueue(allAyahs);
        setCurrentAyah(firstAyah);
        setIsPlaying(true);
    }
  }, [startPlayback, surahData]);


  if (loading) return <div className="flex items-center justify-center h-screen bg-primary text-primary"><p>Loading Surah...</p></div>;
  if (error) return <div className="flex items-center justify-center h-screen bg-primary text-primary"><p className="text-red-400">Error: {error}</p></div>;
  if (!surahData) return null;

  return (
    <div className={`bg-primary text-primary min-h-screen allow-selection ${currentAyah ? 'pb-40' : 'pb-4'}`}>
      <header className="sticky top-0 bg-primary z-10 p-4 flex items-center justify-between border-b border-primary">
        <button onClick={onBack} className="p-2"><BackIcon className="w-6 h-6 text-primary" /></button>
        <div className="text-center">
            <h1 className="text-xl font-bold text-primary">{surahData.englishName}</h1>
            <p className="text-sm text-secondary">{surahData.englishNameTranslation}</p>
        </div>
        <div className="w-10 h-10"></div>
      </header>
      
      <div className="p-4 space-y-6">
        <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="font-amiri text-3xl mb-2 text-primary">{surahData.name}</p>
            <p className="text-sm text-secondary uppercase tracking-widest">
                {surahData.revelationType} • {surahData.numberOfAyahs} VERSES
            </p>
        </div>

        {surahData.ayahs.map((ayah, index) => (
          <div 
            key={ayah.number} 
            ref={el => { ayahRefs.current[ayah.numberInSurah - 1] = el; }}
            onClick={(e) => handleAyahClick(e, ayah)}
            className={`cursor-pointer rounded-lg p-2 transition-colors duration-300 border-b border-primary pb-6
              ${ayahNumber === ayah.numberInSurah ? 'bg-yellow-500/20' : ''}
              ${currentAyah?.number === ayah.number ? 'bg-green-500/20' : ''}
              ${selectedAyah?.number === ayah.number ? 'bg-blue-500/20' : ''}
            `}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold bg-secondary text-secondary px-2 py-1 rounded">
                {surahData.number}:{ayah.numberInSurah}
              </span>
            </div>
            <p className="text-right font-amiri text-3xl leading-loose text-primary">
              {ayah.text}
            </p>
          </div>
        ))}
      </div>
      
      {menuState.isOpen && selectedAyah && (
         <>
            <div className="fixed inset-0 z-20" onClick={handleCloseMenu}></div>
            <AyahActions
                ayah={selectedAyah}
                position={menuState.position}
                onClose={handleCloseMenu}
                onPlayToEndOfJuz={handlePlayToEndOfJuz}
                onRepeat={handleRepeat}
                onCopy={handleCopy}
                onShare={handleShare}
            />
         </>
      )}

      {currentAyah && (
        <AudioPlayer 
            surah={surahData}
            currentAyah={currentAyah}
            isPlaying={isPlaying}
            replayTrigger={replayTrigger}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
            onEnded={handleAudioEnded}
            onClose={() => { setCurrentAyah(null); setIsPlaying(false); resetPlaybackModes(); }}
        />
      )}
    </div>
  );
};

export default SurahDetail;