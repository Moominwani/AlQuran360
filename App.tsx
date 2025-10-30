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

// Define a type for our history state
interface HistoryState {
  page: Page;
  viewingSurah: { number: number; startPlayback: boolean; ayahNumber?: number } | null;
  pageProps: any;
}

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
  
  // Effect to manage browser history
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { page, viewingSurah, pageProps } = event.state as HistoryState;
        setActivePage(page);
        setViewingSurah(viewingSurah);
        setPageProps(pageProps);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // On initial load, replace the current history entry with our initial state
    const initialState: HistoryState = {
        page: Page.Home,
        viewingSurah: null,
        pageProps: {}
    };
    window.history.replaceState(initialState, '');

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);


  const handleSurahSelect = (surahNumber: number, startPlayback: boolean = false) => {
    const surahState = { number: surahNumber, startPlayback };
    const newState: HistoryState = { page: Page.Quran, viewingSurah: surahState, pageProps: {} };
    window.history.pushState(newState, '');
    
    setActivePage(Page.Quran);
    setViewingSurah(surahState);
    setIsVoiceAssistantOpen(false);
  };

  const handleBackFromSurah = () => {
    window.history.back();
  };

  const changePage = (page: Page, props: any = {}) => {
    const newState: HistoryState = { page, viewingSurah: null, pageProps: props };
    window.history.pushState(newState, '');
    
    setViewingSurah(null);
    setActivePage(page);
    setPageProps(props);
    setIsVoiceAssistantOpen(false);
  };

  const handleSubpageNavigation = (props: any) => {
    const newState: HistoryState = { page: activePage, viewingSurah, pageProps: props };
    window.history.pushState(newState, '');
    setPageProps(props);
  };
  
  const handleAction = (action: { type: string, payload: any }) => {
    let newState: HistoryState | null = null;

    switch (action.type) {
      case 'navigate_page':
        newState = { page: action.payload.page, pageProps: action.payload, viewingSurah: null };
        window.history.pushState(newState, '');
        setPageProps(action.payload);
        setActivePage(action.payload.page);
        setViewingSurah(null);
        break;
      case 'navigate_surah':
        const surahState = { 
            number: action.payload.surahNumber, 
            startPlayback: action.payload.startPlayback,
            ayahNumber: action.payload.ayahNumber,
        };
        newState = { page: Page.Quran, viewingSurah: surahState, pageProps: {} };
        window.history.pushState(newState, '');
        setActivePage(Page.Quran);
        setViewingSurah(surahState);
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
        return <Hadith onNavigate={handleSubpageNavigation} pageProps={pageProps} />;
      case Page.Settings:
        return <Settings onNavigate={handleSubpageNavigation} pageProps={pageProps} />;
      case Page.Qibla:
        return <Qibla />;
      case Page.Tasbeeh:
        return <Tasbeeh />;
      case Page.AIAssistant:
        return <AIAssistant onAction={handleAction} onBack={() => window.history.back()} onVoiceCommand={() => setIsVoiceAssistantOpen(true)} />;
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