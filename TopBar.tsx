import React from 'react';

interface TopBarProps {
    title: string;
}

const TopBar: React.FC<TopBarProps> = ({ title }) => {
    return (
        <div className="sticky top-0 z-10 bg-primary flex items-center justify-between p-4 text-primary">
            <h1 className="text-xl font-bold">{title}</h1>
        </div>
    );
};

export default TopBar;