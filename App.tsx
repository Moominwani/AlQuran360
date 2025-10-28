import React, { useState, useEffect } from 'react';
import { Page } from './types';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Quran from './pages/Quran';
import Qibla from './pages/Qibla';
import Tasbeeh from './pages/Tasbeeh';
import SurahDetail from './pages/SurahDetail';
import LocationManager from './components/LocationManager';
import About from './pages/About';
import Settings from './pages/Settings';
import Hadith from './pages/Hadith';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Home);
  const [viewingSurah, setViewingSurah] = useState<number | null>(null);
  const [locationReady, setLocationReady] = useState<boolean>(false);
  const [fullPageView, setFullPageView] = useState<'about' | 'settings' | null>(null);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setLocationReady(true);
    }
  }, []);

  const handleSurahSelect = (surahNumber: number) => {
    setFullPageView(null);
    setViewingSurah(surahNumber);
  };

  const handleBackFromSurah = () => {
    setViewingSurah(null);
  };

  const changePage = (page: Page) => {
    setViewingSurah(null);
    setFullPageView(null);
    setActivePage(page);
  };

  const renderPage = () => {
    if (activePage === Page.Quran && viewingSurah) {
      return <SurahDetail surahNumber={viewingSurah} onBack={handleBackFromSurah} />;
    }

    switch (activePage) {
      case Page.Home:
        return <Home onOpenAbout={() => setFullPageView('about')} onOpenSettings={() => setFullPageView('settings')} />;
      case Page.Quran:
        return <Quran onSurahSelect={handleSurahSelect} />;
      case Page.Hadith:
        return <Hadith />;
      case Page.Qibla:
        return <Qibla />;
      case Page.Tasbeeh:
        return <Tasbeeh />;
      default:
        return <Home onOpenAbout={() => setFullPageView('about')} onOpenSettings={() => setFullPageView('settings')} />;
    }
  };

  if (fullPageView === 'about') {
    return <About onBack={() => setFullPageView(null)} />;
  }
  if (fullPageView === 'settings') {
    return <Settings onBack={() => setFullPageView(null)} />;
  }

  if (!locationReady) {
    return <LocationManager onLocationSet={() => setLocationReady(true)} />;
  }
  
  const showNav = !viewingSurah;

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <main className={`flex-grow ${showNav ? 'pb-20' : ''}`}>
        {renderPage()}
      </main>
      {showNav && <BottomNav activePage={activePage} setActivePage={changePage} />}
    </div>
  );
};

export default App;