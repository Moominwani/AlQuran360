import React, { useRef } from 'react';
import { Page } from '../types';
import { HomeIcon, PrayerIcon, QuranIcon, HadithIcon, AIIcon } from './icons/NavIcons';

interface BottomNavProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  onAiShortClick: () => void;
  onAiLongPress: () => void;
}

const NavItem: React.FC<{
  page: Page;
  activePage: Page;
  setActivePage: (page: Page) => void;
  Icon: React.ElementType;
  label: string;
}> = ({ page, activePage, setActivePage, Icon, label }) => {
  const isActive = activePage === page;
  return (
    <button
      onClick={() => setActivePage(page)}
      className="flex flex-col items-center justify-center w-1/5 pt-2 pb-1 transition-colors duration-200"
    >
       <div className={`relative flex items-center justify-center h-8 w-16 mb-1`}>
         {isActive && <div className="absolute inset-x-0 top-0 h-8 bg-green-500/80 rounded-full" style={{filter: 'blur(18px)'}}></div>}
         <Icon className={`h-6 w-6 z-10 ${isActive ? 'text-green-500' : 'text-secondary'}`} isFilled={isActive} />
      </div>
      <span className={`text-xs font-medium ${isActive ? 'text-green-500' : 'text-secondary'}`}>
        {label}
      </span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage, onAiShortClick, onAiLongPress }) => {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const handlePressStart = () => {
    isLongPressTriggeredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      onAiLongPress();
    }, 400); // 400ms threshold for long press
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handleClick = () => {
    if (!isLongPressTriggeredRef.current) {
      onAiShortClick();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 z-40">
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-secondary shadow-lg border-t border-secondary/50">
        <div className="flex justify-around items-center h-full max-w-lg mx-auto">
          <NavItem page={Page.Home} activePage={activePage} setActivePage={setActivePage} Icon={HomeIcon} label="Home" />
          <NavItem page={Page.Prayer} activePage={activePage} setActivePage={setActivePage} Icon={PrayerIcon} label="Prayer"/>
          <div className="w-1/5" /> {/* Placeholder for the central button */}
          <NavItem page={Page.Quran} activePage={activePage} setActivePage={setActivePage} Icon={QuranIcon} label="Quran" />
          <NavItem page={Page.Hadith} activePage={activePage} setActivePage={setActivePage} Icon={HadithIcon} label="Hadith" />
        </div>
      </div>
      <button 
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onClick={handleClick}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center border-4 border-secondary transform hover:scale-105 active:scale-95 transition-transform ai-button-animated"
      >
        <AIIcon className="w-10 h-10 text-white" />
      </button>
    </div>
  );
};

export default BottomNav;