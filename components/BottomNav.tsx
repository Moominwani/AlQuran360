import React from 'react';
import { Page } from '../types';
import { HomeIcon, PrayerIcon, QuranIcon, HadithIcon } from './icons/NavIcons';

interface BottomNavProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
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
      className="flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200"
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

const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-secondary shadow-lg border-t border-secondary/50 z-40">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        <NavItem page={Page.Home} activePage={activePage} setActivePage={setActivePage} Icon={HomeIcon} label="Home" />
        <NavItem page={Page.Prayer} activePage={activePage} setActivePage={setActivePage} Icon={PrayerIcon} label="Prayer"/>
        <NavItem page={Page.Quran} activePage={activePage} setActivePage={setActivePage} Icon={QuranIcon} label="Quran" />
        <NavItem page={Page.Hadith} activePage={activePage} setActivePage={setActivePage} Icon={HadithIcon} label="Hadith" />
      </div>
    </div>
  );
};

export default BottomNav;