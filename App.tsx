import React, { useState, useEffect } from 'react';
import { Page } from './types';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Quran from './pages/Quran';
import Qibla from './pages/Qibla';
import Tasbeeh from './pages/Tasbeeh';
import SurahDetail from './pages/SurahDetail';
import LocationManager from './components/LocationManager';
import { useTheme } from './contexts/ThemeContext';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Home);
  const [viewingSurah, setViewingSurah] = useState<number | null>(null);
  const [locationReady, setLocationReady] = useState<boolean>(false);
  const { theme } = useTheme();

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setLocationReady(true);
    }
  }, []);

  const handleSurahSelect = (surahNumber: number) => {
    setViewingSurah(surahNumber);
  };

  const handleBackFromSurah = () => {
    setViewingSurah(null);
  };

  const changePage = (page: Page) => {
    setViewingSurah(null);
    setActivePage(page);
  };

  const renderPage = () => {
    if (activePage === Page.Quran && viewingSurah) {
      return <SurahDetail surahNumber={viewingSurah} onBack={handleBackFromSurah} />;
    }

    switch (activePage) {
      case Page.Home:
        return <Home />;
      case Page.Quran:
        return <Quran onSurahSelect={handleSurahSelect} />;
      case Page.Qibla:
        return <Qibla />;
      case Page.Tasbeeh:
        return <Tasbeeh />;
      default:
        return <Home />;
    }
  };

  if (!locationReady) {
    return <LocationManager onLocationSet={() => setLocationReady(true)} />;
  }
  
  const showNav = !viewingSurah;

  return (
    <div className={`${theme} min-h-screen font-sans text-gray-800 dark:text-white bg-white dark:bg-[#143d31] flex flex-col`}>
      <main className={`flex-grow ${showNav ? 'pb-20' : ''}`}>
        {renderPage()}
      </main>
      {showNav && <BottomNav activePage={activePage} setActivePage={changePage} />}
    </div>
  );
};

export default App;