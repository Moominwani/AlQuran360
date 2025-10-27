import React from 'react';
import { Ayah } from '../types';
import { PlayIcon, RepeatIcon, CopyIcon, ShareIcon } from './icons/PlayerIcons';

interface AyahActionsProps {
  ayah: Ayah;
  position: { top: number; left: number };
  onClose: () => void;
  onPlayToEndOfJuz: () => void;
  onRepeat: () => void;
  onCopy: () => void;
  onShare: () => void;
}

const ActionButton: React.FC<{ icon: React.ReactNode; text: string; onClick: () => void }> = ({ icon, text, onClick }) => (
  <button onClick={onClick} className="flex items-center w-full text-left p-3 hover:bg-tertiary rounded-md transition-colors">
    {icon}
    <span className="ml-4 text-primary font-medium">{text}</span>
  </button>
);

const AyahActions: React.FC<AyahActionsProps> = ({ position, onClose, onPlayToEndOfJuz, onRepeat, onCopy, onShare }) => {
  return (
    <div
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="absolute z-30 w-64 -translate-x-1/2"
    >
        <div className="relative bg-secondary rounded-xl shadow-2xl p-2 animate-fade-in-up border border-primary">
            <div 
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-secondary transform rotate-45 border-t border-l border-primary"
            ></div>
            <ActionButton icon={<PlayIcon className="w-5 h-5 text-secondary"/>} text="Play to the end of Juz" onClick={onPlayToEndOfJuz} />
            <ActionButton icon={<RepeatIcon className="w-5 h-5 text-secondary"/>} text="Repeat selected Ayah" onClick={onRepeat} />
            <ActionButton icon={<CopyIcon className="w-5 h-5 text-secondary"/>} text="Copy" onClick={onCopy} />
            <ActionButton icon={<ShareIcon className="w-5 h-5 text-secondary"/>} text="Share" onClick={onShare} />
        </div>
    </div>
  );
};

export default AyahActions;