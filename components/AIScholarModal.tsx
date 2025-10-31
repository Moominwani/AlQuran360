import React, { useState, useEffect, useRef } from 'react';
import { FullscreenIcon, ExitFullscreenIcon, CloseIcon } from './icons/MiscIcons';

interface AIScholarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIScholarModal: React.FC<AIScholarModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setLoadError(false);

      if (!navigator.onLine) {
        setIsLoading(false);
        setLoadError(true);
        return;
      }

      loadTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setLoadError(true);
      }, 10000); // 10-second timeout

      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    }
  }, [isOpen]);

  const handleIframeLoad = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIsLoading(false);
    setLoadError(false);
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div 
        ref={modalRef}
        className="bg-primary text-primary flex flex-col rounded-2xl shadow-2xl overflow-hidden absolute inset-x-2 inset-y-16 sm:inset-x-8 sm:inset-y-20"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center p-4 border-b border-primary flex-shrink-0 bg-secondary">
          <h1 className="text-xl font-bold text-center flex-1 pr-16 sm:pr-0">Islamic AI Scholar</h1>
          <div className="absolute right-4 top-4 flex items-center space-x-2">
            <button onClick={toggleFullscreen} className="p-2 rounded-full hover:bg-tertiary">
              {isFullscreen ? <ExitFullscreenIcon className="w-6 h-6" /> : <FullscreenIcon className="w-6 h-6" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-tertiary">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
        <main className="flex-grow bg-tertiary relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-tertiary z-10 rounded-b-xl">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce" />
              </div>
              <p className="mt-4 text-secondary text-sm">Loading Scholar...</p>
            </div>
          )}
          {loadError && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-tertiary z-10 rounded-b-xl text-center p-4">
                <h3 className="text-lg font-semibold text-primary">Could Not Load Scholar</h3>
                {!navigator.onLine ? (
                    <p className="text-secondary my-2">The AI Scholar requires an internet connection.</p>
                ) : (
                    <>
                        <p className="text-secondary my-2">The external website may not allow embedding.</p>
                        <a 
                            href="https://islamgpt.info/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-4 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
                        >
                            Open in New Tab
                        </a>
                    </>
                )}
            </div>
          )}
          <div 
            className="w-full h-full relative"
            style={{ visibility: isLoading || loadError ? 'hidden' : 'visible' }}
          >
            <iframe 
              src="https://islamgpt.info/" 
              onLoad={handleIframeLoad}
              style={{ 
                width: '100%', 
                height: '100%',
                border: 'none', 
              }}
              title="Islamic AI Scholar"
              allowFullScreen
            >
            </iframe>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIScholarModal;
