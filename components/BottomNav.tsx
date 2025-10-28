import React from 'react';
import { Page } from '../types';
import { HomeIcon, QuranIcon, QiblaIcon } from './icons/NavIcons';

interface BottomNavProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  page: Page;
  activePage: Page;
  setActivePage: (page: Page) => void;
  Icon: React.ElementType;
}> = ({ page, activePage, setActivePage, Icon }) => {
  const isActive = activePage === page;
  return (
    <button
      onClick={() => setActivePage(page)}
      className="flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200"
    >
      <Icon className={`h-6 w-6 mb-1 ${isActive ? 'accent-text' : 'text-secondary'}`} />
      <span className={`text-xs font-medium ${isActive ? 'accent-text' : 'text-secondary'}`}>
        {page}
      </span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-secondary shadow-lg border-t border-secondary/50 z-40">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        <NavItem page={Page.Home} activePage={activePage} setActivePage={setActivePage} Icon={HomeIcon} />
        <NavItem page={Page.Quran} activePage={activePage} setActivePage={setActivePage} Icon={QuranIcon} />
        <NavItem page={Page.Qibla} activePage={activePage} setActivePage={setActivePage} Icon={QiblaIcon} />
      </div>
    </div>
  );
};

export default BottomNav;