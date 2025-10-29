import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../types';
import { AIIcon } from './icons/NavIcons';
import { CloseIcon } from './icons/MiscIcons';
import { getIntentAndResponse } from '../utils/aiLogic';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onNavigateSurah: (surahNumber: number, startPlayback?: boolean) => void;
  onNavigateSettings: () => void;
}

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, onNavigate, onNavigateSurah, onNavigateSettings }) => {
    const [status, setStatus] = useState<'idle' | 'starting' | 'listening' | 'processing' | 'speaking'>('idle');
    const [transcript, setTranscript] = useState('');
    const [hasApiKey, setHasApiKey] = useState<boolean | 'checking'>('checking');
    
    const recognitionRef = useRef<any>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    const propsRef = useRef({ onClose, onNavigate, onNavigateSurah, onNavigateSettings });
    useEffect(() => {
        propsRef.current = { onClose, onNavigate, onNavigateSurah, onNavigateSettings };
    }, [onClose, onNavigate, onNavigateSurah, onNavigateSettings]);
    
    const hasApiKeyRef = useRef(hasApiKey);
    useEffect(() => { hasApiKeyRef.current = hasApiKey; }, [hasApiKey]);

    useEffect(() => {
        if (!isOpen) return;
        setHasApiKey('checking');
        const checkKey = async () => {
            if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
                const keyStatus = await (window as any).aistudio.hasSelectedApiKey();
                setHasApiKey(keyStatus);
            } else {
                setHasApiKey(false);
            }
        };
        checkKey();
    }, [isOpen]);

    useEffect(() => {
        if (!SpeechRecognitionAPI) {
            console.error("Speech Recognition API not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = true;

        recognition.onstart = () => setStatus('listening');

        recognition.onend = () => {
            if (statusRef.current === 'listening' || statusRef.current === 'starting') {
                 setStatus('idle');
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setStatus('idle');
        };

        const processCommand = async (command: string) => {
            setStatus('processing');
            try {
                const { responseText, action } = await getIntentAndResponse(command);
                
                const performActionAndClose = () => {
                    if (action && action.type !== 'info') {
                        switch (action.type) {
                            case 'navigate_page': propsRef.current.onNavigate(action.payload.page); break;
                            case 'navigate_surah': propsRef.current.onNavigateSurah(action.payload.surahNumber, action.payload.startPlayback); break;
                            case 'navigate_settings': propsRef.current.onNavigateSettings(); break;
                        }
                    }
                    setTimeout(() => propsRef.current.onClose(), action && action.type !== 'info' ? 300 : 100);
                };

                if ('speechSynthesis' in window) {
                    setStatus('speaking');
                    window.speechSynthesis.cancel();
                    const newUtterance = new SpeechSynthesisUtterance(responseText);
                    utteranceRef.current = newUtterance;
                    newUtterance.onend = () => { if (utteranceRef.current === newUtterance) performActionAndClose(); };
                    newUtterance.onerror = (e: SpeechSynthesisErrorEvent) => { console.error(e); if (utteranceRef.current === newUtterance) performActionAndClose(); };
                    window.speechSynthesis.speak(newUtterance);
                } else {
                    performActionAndClose();
                }

            } catch (error) {
                console.error("AI Error in Voice Assistant:", error);
                let errorMessage = "An unexpected error occurred.";
                if (error instanceof Error) {
                    if (error.message.includes("not found") || error.message.includes("API key")) {
                        setHasApiKey(false);
                        errorMessage = "Your API key seems invalid. Please select a key to continue.";
                    } else {
                        errorMessage = `An error occurred: ${error.message}`;
                    }
                }
                
                if ('speechSynthesis' in window) {
                    setStatus('speaking');
                    window.speechSynthesis.cancel();
                    const newUtterance = new SpeechSynthesisUtterance(errorMessage);
                    newUtterance.onend = () => {
                        setStatus('idle');
                        if (hasApiKeyRef.current) propsRef.current.onClose();
                    };
                    window.speechSynthesis.speak(newUtterance);
                } else {
                    setStatus('idle');
                    if (hasApiKeyRef.current) propsRef.current.onClose();
                }
            }
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setTranscript(interimTranscript || finalTranscript);
            
            if (finalTranscript) {
                processCommand(finalTranscript.trim());
            }
        };

        return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTranscript('');
            setStatus('idle');
        } else {
            recognitionRef.current?.abort();
            window.speechSynthesis.cancel();
        }
    }, [isOpen]);
    
    useEffect(() => {
        const recognition = recognitionRef.current;
        if (isOpen && status === 'idle' && hasApiKey === true && recognition) {
            setStatus('starting');
            try {
                recognition.start();
            } catch (e) {
                console.error("Recognition start error:", e);
                setStatus('idle');
            }
        }
    }, [isOpen, status, hasApiKey]);
    
    if (!isOpen) return null;

    const handleSelectKey = async () => {
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            setHasApiKey(true);
            setStatus('idle');
        }
    };
    
    const renderContent = () => {
        if (hasApiKey === 'checking') {
            return (
                <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-secondary">Checking AI configuration...</p>
                </>
            );
        }
        
        if (!hasApiKey) {
            return (
                <>
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center shadow-lg mb-6">
                        <AIIcon className="w-14 h-14 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">API Key Required</h2>
                    <p className="text-secondary mb-6 max-w-sm">The Voice Assistant needs a Google AI Studio API key to function.</p>
                    <button onClick={handleSelectKey} className="px-6 py-3 rounded-lg bg-green-500 text-white font-semibold shadow-md hover:bg-green-600 transition-colors">
                        Select API Key
                    </button>
                    <p className="text-xs text-secondary mt-4">
                        See the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline accent-text">billing documentation</a> for details.
                    </p>
                </>
            );
        }

        const getStatusMessage = () => {
            switch(status) {
                case 'starting':
                case 'listening': return 'Listening...';
                case 'processing': return 'Thinking...';
                case 'speaking': return 'Speaking...';
                default: return "Say a command, e.g., 'Open Surah Yasin'";
            }
        };

        return (
            <>
                <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                    {(status === 'listening' || status === 'starting') && (
                        <>
                            <div className="absolute w-full h-full rounded-full bg-green-500/20 animate-pulse [animation-duration:1.5s]"></div>
                            <div className="absolute w-2/3 h-2/3 rounded-full bg-green-500/20 animate-pulse [animation-duration:1.5s] [animation-delay:-0.5s]"></div>
                        </>
                    )}
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center shadow-lg ai-button-animated">
                        <AIIcon className="w-14 h-14 text-white" />
                    </div>
                </div>

                <p className="text-sm text-secondary mb-2 h-4">{getStatusMessage()}</p>
                <p className="text-2xl font-semibold h-16">{transcript || '...'}</p>
            </>
        );
    };

    return (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-primary animate-fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-primary p-2 rounded-full hover:bg-tertiary">
                <CloseIcon className="w-6 h-6" />
            </button>
            <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
                {renderContent()}
            </div>
        </div>
    );
};

export default VoiceAssistant;