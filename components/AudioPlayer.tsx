import React, { useRef, useEffect, useState } from 'react';
import { Ayah, SurahDetailData } from '../types';
import { PlayIcon, PauseIcon, NextTrackIcon, PrevTrackIcon, RepeatIcon as RepeatIconPlayer } from './icons/PlayerIcons';
import { CloseIcon } from './icons/MiscIcons';

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

const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

const playbackSpeeds = [0.75, 1.0, 1.25, 1.5, 2.0];

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
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isRepeating, setIsRepeating] = useState(false);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && currentAyah) {
        if (audioElement.src !== currentAyah.audio) {
            audioElement.src = currentAyah.audio;
        }
        audioElement.playbackRate = playbackRate;
        if (isPlaying) {
            audioElement.play().catch(e => console.error("Audio play failed", e));
        } else {
            audioElement.pause();
        }
    }
  }, [isPlaying, currentAyah, playbackRate]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleEnded = () => {
          if (isRepeating) {
              audioElement.currentTime = 0;
              audioElement.play();
          } else {
              onEnded();
          }
      };
      const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
      const handleLoadedMetadata = () => setDuration(audioElement.duration);
      
      audioElement.addEventListener('ended', handleEnded);
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [onEnded, isRepeating]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && replayTrigger > 0) {
      audioElement.currentTime = 0;
      audioElement.play().catch(e => console.error("Audio replay failed", e));
    }
  }, [replayTrigger]);
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(audioRef.current) {
          audioRef.current.currentTime = Number(e.target.value);
      }
  }

  const togglePlaybackSpeed = () => {
      const currentIndex = playbackSpeeds.indexOf(playbackRate);
      const nextIndex = (currentIndex + 1) % playbackSpeeds.length;
      setPlaybackRate(playbackSpeeds[nextIndex]);
  };

  if (!currentAyah || !surah) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-secondary text-primary shadow-lg border-t border-primary/50 p-4 z-50 animate-fade-in-up">
      <audio ref={audioRef} />
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between">
            <div>
                <p className="font-bold truncate">{surah.englishName}</p>
                <p className="text-sm text-secondary">Ayah {currentAyah.numberInSurah}</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2">
                <CloseIcon className="w-5 h-5"/>
            </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-secondary my-2">
            <span>{formatTime(currentTime)}</span>
            <input 
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-tertiary rounded-lg appearance-none cursor-pointer audio-progress"
            />
            <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
            <button onClick={togglePlaybackSpeed} className="w-12 h-10 rounded-md font-semibold text-secondary hover:bg-tertiary">
                {playbackRate.toFixed(2)}x
            </button>
            <div className="flex items-center space-x-2">
                <button onClick={onPrev} className="p-3 rounded-full hover:bg-tertiary"><PrevTrackIcon className="w-6 h-6" /></button>
                <button onClick={onPlayPause} className="w-16 h-16 accent-bg rounded-full flex items-center justify-center text-inverted">
                    {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
                </button>
                <button onClick={onNext} className="p-3 rounded-full hover:bg-tertiary"><NextTrackIcon className="w-6 h-6" /></button>
            </div>
            <button onClick={() => setIsRepeating(!isRepeating)} className={`w-12 h-10 rounded-md flex items-center justify-center ${isRepeating ? 'text-green-500' : 'text-secondary'}`}>
                <RepeatIconPlayer className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;