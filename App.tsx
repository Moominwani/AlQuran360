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
import AIAssistant from './components/AIAssistant';
import VoiceCommandUI from './components/VoiceCommandUI';
import FloatingAIButton from './components/FloatingAIButton';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Home);
  const [pageProps, setPageProps] = useState<any>({});
  const [viewingSurah, setViewingSurah] = useState<{ number: number; startPlayback: boolean; ayahNumber?: number; } | null>(null);
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
    setActivePage(Page.Quran); // Set context to Quran page for better back navigation
    setViewingSurah({ number: surahNumber, startPlayback });
    setIsVoiceAssistantOpen(false);
  };

  const handleBackFromSurah = () => {
    setViewingSurah(null);
  };

  const changePage = (page: Page) => {
    setViewingSurah(null);
    setFullPageView(null);
    setActivePage(page);
    setPageProps({}); // Reset props on simple page change
    setIsVoiceAssistantOpen(false);
  };

  const handleShowSettings = () => {
    setFullPageView('settings');
    setIsVoiceAssistantOpen(false);
  };
  
  const handleAction = (action: { type: string, payload: any }) => {
    switch (action.type) {
      case 'navigate_page':
        setPageProps(action.payload); // Store props for the page
        setActivePage(action.payload.page);
        setViewingSurah(null);
        setFullPageView(null);
        break;
      case 'navigate_surah':
        setFullPageView(null);
        setActivePage(Page.Quran); // For back navigation context
        setViewingSurah({ 
            number: action.payload.surahNumber, 
            startPlayback: action.payload.startPlayback,
            ayahNumber: action.payload.ayahNumber,
        });
        break;
      case 'navigate_settings':
        handleShowSettings();
        break;
      default:
        break;
    }
    // Close voice assistant after action
    setIsVoiceAssistantOpen(false);
  };

  const renderPage = () => {
    if (viewingSurah) {
      return <SurahDetail surahNumber={viewingSurah.number} onBack={handleBackFromSurah} startPlayback={viewingSurah.startPlayback} ayahNumber={viewingSurah.ayahNumber} />;
    }

    switch (activePage) {
      case Page.Home:
        return <Home onNavigate={changePage} onShowSettings={handleShowSettings} onShowAbout={() => setFullPageView('about')} />;
      case Page.Prayer:
        return <Prayer {...pageProps} />;
      case Page.Quran:
        return <Quran onSurahSelect={handleSurahSelect} />;
      case Page.Hadith:
        return <Hadith />;
      case Page.AIAssistant:
        return <AIAssistant onAction={handleAction} onBack={() => changePage(Page.Home)} />;
      default:
        return <Home onNavigate={changePage} onShowSettings={handleShowSettings} onShowAbout={() => setFullPageView('about')} />;
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
  
  const showNav = !viewingSurah && !fullPageView && activePage !== Page.AIAssistant;
  const showAiButton = activePage !== Page.AIAssistant && !isVoiceAssistantOpen;

  return (
    <div className="min-h-screen font-sans flex flex-col bg-primary">
      <main className={`flex-grow ${activePage === Page.AIAssistant ? '' : (showNav ? 'pb-20' : '')}`}>
        {renderPage()}
      </main>
      
      {isVoiceAssistantOpen && (
        <VoiceCommandUI
          isOpen={isVoiceAssistantOpen}
          onClose={() => setIsVoiceAssistantOpen(false)}
          onAction={handleAction}
        />
      )}
      
      {showAiButton && (
        <FloatingAIButton
          onClick={() => changePage(Page.AIAssistant)}
          onLongPress={() => setIsVoiceAssistantOpen(true)}
        />
      )}
      
      {showNav && <BottomNav 
        activePage={activePage} 
        setActivePage={changePage}
      />}
    </div>
  );
};

export default App;