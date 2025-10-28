import React from 'react';
import { MoreVerticalIcon } from './icons/MiscIcons';

interface TopBarProps {
    title: string;
    onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, onMenuClick }) => {
    return (
        <div className="sticky top-0 z-10 bg-primary flex items-center justify-between p-4 text-primary">
            <h1 className="text-xl font-bold">{title}</h1>
            <button onClick={onMenuClick} className="p-2 rounded-full hover:bg-secondary">
                <MoreVerticalIcon className="w-6 h-6 text-primary" />
            </button>
        </div>
    );
};

export default TopBar;