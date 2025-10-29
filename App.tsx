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
import AIAssistant from './pages/AIAssistant';
import VoiceAssistant from './components/VoiceAssistant';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Home);
  const [viewingSurah, setViewingSurah] = useState<{ number: number; startPlayback: boolean; } | null>(null);
  const [locationReady, setLocationReady] = useState<boolean>(false);
  const [fullPageView, setFullPageView] = useState<'about' | 'settings' | null>(null);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setLocationReady(true);
    }
  }, []);

  const handleSurahSelect = (surahNumber: number, startPlayback: boolean = false) => {
    setFullPageView(null);
    setViewingSurah({ number: surahNumber, startPlayback });
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
      return <SurahDetail surahNumber={viewingSurah.number} onBack={handleBackFromSurah} startPlayback={viewingSurah.startPlayback} />;
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
      case Page.AIAssistant:
        return <AIAssistant
            onBack={() => changePage(Page.Home)}
            onNavigate={changePage}
            onNavigateSurah={(surahNumber, startPlayback) => {
                setActivePage(Page.Quran);
                handleSurahSelect(surahNumber, startPlayback);
            }}
            onNavigateSettings={() => setFullPageView('settings')}
        />;
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
  
  const showNav = !viewingSurah && activePage !== Page.AIAssistant;

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <main className={`flex-grow ${showNav ? 'pb-20' : ''}`}>
        {renderPage()}
      </main>
      {showNav && <BottomNav 
        activePage={activePage} 
        setActivePage={changePage} 
        onAiShortClick={() => changePage(Page.AIAssistant)}
        onAiLongPress={() => setIsVoiceAssistantOpen(true)}
      />}
      <VoiceAssistant
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        onNavigate={changePage}
        onNavigateSurah={(surahNumber, startPlayback) => {
            setActivePage(Page.Quran);
            handleSurahSelect(surahNumber, startPlayback);
        }}
        onNavigateSettings={() => setFullPageView('settings')}
      />
    </div>
  );
};

export default App;