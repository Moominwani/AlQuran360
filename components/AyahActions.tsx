import React from 'react';
import { Ayah } from '../types';
import { PlayIcon, RepeatIcon, CopyIcon, ShareIcon } from './icons/PlayerIcons';
import { CloseIcon, StarIcon, FilledStarIcon } from './icons/MiscIcons';

interface AyahActionsProps {
  ayah: Ayah;
  hasAudio: boolean;
  isAyahFavorite: boolean;
  onClose: () => void;
  onPlayToEndOfJuz: () => void;
  onRepeat: () => void;
  onToggleAyahFavorite: () => void;
  onCopy: () => void;
  onShare: () => void;
}

const ActionButton: React.FC<{ icon: React.ReactNode; text: string; onClick: () => void; disabled?: boolean }> = ({ icon, text, onClick, disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className="flex items-center w-full text-left p-3 hover:bg-tertiary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {icon}
    <span className="ml-4 text-primary font-medium">{text}</span>
  </button>
);

const AyahActions: React.FC<AyahActionsProps> = ({ onClose, onPlayToEndOfJuz, onRepeat, onToggleAyahFavorite, onCopy, onShare, hasAudio, isAyahFavorite }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-secondary rounded-xl shadow-2xl p-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-primary">Actions</h3>
                <button onClick={onClose} className="p-2 text-secondary hover:text-primary">
                    <CloseIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="space-y-1">
                <ActionButton icon={<PlayIcon className="w-5 h-5 text-secondary"/>} text="Play to end of Juz" onClick={onPlayToEndOfJuz} disabled={!hasAudio} />
                <ActionButton icon={<RepeatIcon className="w-5 h-5 text-secondary"/>} text="Repeat selected Ayah" onClick={onRepeat} disabled={!hasAudio} />
                <ActionButton icon={isAyahFavorite ? <FilledStarIcon className="w-5 h-5 text-yellow-400"/> : <StarIcon className="w-5 h-5 text-secondary"/>} text={isAyahFavorite ? "Unfavorite Ayah" : "Favorite Ayah"} onClick={onToggleAyahFavorite} />
                <ActionButton icon={<CopyIcon className="w-5 h-5 text-secondary"/>} text="Copy Ayah Text" onClick={onCopy} />
                <ActionButton icon={<ShareIcon className="w-5 h-5 text-secondary"/>} text="Share Ayah" onClick={onShare} />
            </div>
        </div>
    </div>
  );
};

export default AyahActions;