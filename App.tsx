import React, { useState, useEffect } from 'react';
import { Page } from './types';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Quran from './pages/Quran';
import SurahDetail from './pages/SurahDetail';
import LocationManager from './components/LocationManager';
import About from './pages/About';
import Settings from './pages/Settings';
import Prayer from './pages/Prayer';
import Hadith from './pages/Hadith';
import AIModal, { AIAction } from './components/AIModal';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Home);
  const [viewingSurah, setViewingSurah] = useState<number | null>(null);
  const [locationReady, setLocationReady] = useState<boolean>(false);
  const [fullPageView, setFullPageView] = useState<'about' | 'settings' | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
  
  const handleAiAction = (action: AIAction) => {
    setIsAiModalOpen(false); // Close modal after an action is triggered
    setTimeout(() => { // Timeout to allow modal to close before navigating
        switch(action.type) {
            case 'navigate_page':
                changePage(action.payload.page);
                break;
            case 'navigate_surah':
                setActivePage(Page.Quran);
                handleSurahSelect(action.payload.surahNumber);
                break;
            case 'navigate_settings':
                setFullPageView('settings');
                break;
        }
    }, 300);
  };

  const renderPage = () => {
    if (activePage === Page.Quran && viewingSurah) {
      return <SurahDetail surahNumber={viewingSurah} onBack={handleBackFromSurah} />;
    }

    switch (activePage) {
      case Page.Home:
        return <Home onNavigate={changePage} onShowSettings={() => setFullPageView('settings')} onShowAbout={() => setFullPageView('about')} />;
      case Page.Prayer:
        return <Prayer />;
      case Page.Quran:
        return <Quran onSurahSelect={handleSurahSelect} />;
      case Page.Hadith:
        return <Hadith />;
      default:
        return <Home onNavigate={changePage} onShowSettings={() => setFullPageView('settings')} onShowAbout={() => setFullPageView('about')} />;
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
      {showNav && <BottomNav activePage={activePage} setActivePage={changePage} onAiClick={() => setIsAiModalOpen(true)} />}
      <AIModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} onAction={handleAiAction} />
    </div>
  );
};

export default App;