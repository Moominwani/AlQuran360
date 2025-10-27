import React, { useRef, useEffect } from 'react';
import { Ayah, SurahDetailData } from '../types';
import { PlayIcon, PauseIcon, NextTrackIcon, PrevTrackIcon } from './icons/PlayerIcons';

interface AudioPlayerProps {
  surah: SurahDetailData | null;
  currentAyah: Ayah | null;
  isPlaying: boolean;
  replayTrigger: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onEnded: () => void;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  surah,
  currentAyah,
  isPlaying,
  replayTrigger,
  onPlayPause,
  onNext,
  onPrev,
  onEnded,
  onClose
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && currentAyah) {
        if (audioElement.src !== currentAyah.audio) {
            audioElement.src = currentAyah.audio;
        }
        if (isPlaying) {
            audioElement.play().catch(e => console.error("Audio play failed", e));
        } else {
            audioElement.pause();
        }
    }
  }, [isPlaying, currentAyah]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleEnded = () => onEnded();
      audioElement.addEventListener('ended', handleEnded);
      return () => {
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [onEnded]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && replayTrigger > 0) {
      audioElement.currentTime = 0;
      audioElement.play().catch(e => console.error("Audio replay failed", e));
    }
  }, [replayTrigger]);
  
  if (!currentAyah || !surah) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-white shadow-lg border-t border-gray-700/50 p-4 z-50">
      <audio ref={audioRef} />
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div>
          <p className="font-bold">{surah.englishName}</p>
          <p className="text-sm text-gray-400">Ayah {currentAyah.numberInSurah}</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button onClick={onPrev} className="p-2"><PrevTrackIcon className="w-6 h-6" /></button>
          <button onClick={onPlayPause} className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-black">
            {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
          </button>
          <button onClick={onNext} className="p-2"><NextTrackIcon className="w-6 h-6" /></button>
        </div>
        <button onClick={onClose} className="absolute top-1 right-1 text-gray-400 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;