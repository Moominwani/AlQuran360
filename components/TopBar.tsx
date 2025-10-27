import React, { useState, useEffect, useRef } from 'react';
import { LocationIcon, MoreVerticalIcon } from '../contexts/MiscIcons';

interface TopBarProps {
    location: string;
    onLocationClick: () => void;
    onOpenAbout: () => void;
    onOpenSettings: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ location, onLocationClick, onOpenAbout, onOpenSettings }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex items-center justify-between p-4 bg-transparent">
            <button onClick={onLocationClick} className="flex items-center space-x-1 cursor-pointer">
                <LocationIcon className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-secondary">{location}</span>
            </button>
            <h1 className="text-xl font-bold text-primary">AlQuran360</h1>
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-primary">
                    <MoreVerticalIcon className="w-6 h-6" />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-secondary rounded-lg shadow-lg py-1 z-20 border border-primary animate-fade-in-up">
                        <button 
                            onClick={() => { onOpenSettings(); setIsMenuOpen(false); }} 
                            className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-tertiary transition-colors"
                        >
                            Settings
                        </button>
                        <button 
                            onClick={() => { onOpenAbout(); setIsMenuOpen(false); }} 
                            className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-tertiary transition-colors"
                        >
                            About
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopBar;
