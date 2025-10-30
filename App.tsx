import React, { useState, useEffect } from 'react';
import { Page } from './types';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Quran from './pages/Quran';
import SurahDetail from './pages/SurahDetail';
import LocationManager from './components/LocationManager';
import Settings from './pages/Settings';
import Prayer from './pages/Prayer';
import Hadith from './pages/Hadith';
import AIAssistant from './components/AIAssistant';
import VoiceCommandUI from './components/VoiceCommandUI';
import FloatingAIButton from './components/FloatingAIButton';
import Qibla from './pages/Qibla';
import Tasbeeh from './pages/Tasbeeh';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Home);
  const [pageProps, setPageProps] = useState<any>({});
  const [viewingSurah, setViewingSurah] = useState<{ number: number; startPlayback: boolean; ayahNumber?: number; } | null>(null);
  const [locationReady, setLocationReady] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setLocationReady(true);
    }
  }, []);

  const handleSurahSelect = (surahNumber: number, startPlayback: boolean = false) => {
    setActivePage(Page.Quran); // Set context to Quran page for better back navigation
    setViewingSurah({ number: surahNumber, startPlayback });
    setIsVoiceAssistantOpen(false);
  };

  const handleBackFromSurah = () => {
    setViewingSurah(null);
  };

  const changePage = (page: Page) => {
    setViewingSurah(null);
    setActivePage(page);
    setPageProps({}); // Reset props on simple page change
    setIsVoiceAssistantOpen(false);
  };
  
  const handleAction = (action: { type: string, payload: any }) => {
    switch (action.type) {
      case 'navigate_page':
        setPageProps(action.payload); // Store props for the page
        setActivePage(action.payload.page);
        setViewingSurah(null);
        break;
      case 'navigate_surah':
        setActivePage(Page.Quran); // For back navigation context
        setViewingSurah({ 
            number: action.payload.surahNumber, 
            startPlayback: action.payload.startPlayback,
            ayahNumber: action.payload.ayahNumber,
        });
        break;
      case 'navigate_settings':
        setActivePage(Page.Settings);
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
        return <Home onNavigate={changePage} />;
      case Page.Prayer:
        return <Prayer {...pageProps} />;
      case Page.Quran:
        return <Quran onSurahSelect={handleSurahSelect} />;
      case Page.Hadith:
        return <Hadith />;
      case Page.Settings:
        return <Settings />;
      case Page.Qibla:
        return <Qibla />;
      case Page.Tasbeeh:
        return <Tasbeeh />;
      case Page.AIAssistant:
        return <AIAssistant onAction={handleAction} onBack={() => changePage(Page.Home)} onVoiceCommand={() => setIsVoiceAssistantOpen(true)} />;
      default:
        return <Home onNavigate={changePage} />;
    }
  };

  if (!locationReady) {
    return <LocationManager onLocationSet={() => setLocationReady(true)} />;
  }
  
  const showNav = !viewingSurah && activePage !== Page.AIAssistant;
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