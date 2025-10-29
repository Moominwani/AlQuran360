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
    
    const recognitionRef = useRef<any>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Refs to hold the latest state and props for use in stable callbacks
    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    const propsRef = useRef({ onClose, onNavigate, onNavigateSurah, onNavigateSettings });
    useEffect(() => {
        propsRef.current = { onClose, onNavigate, onNavigateSurah, onNavigateSettings };
    }, [onClose, onNavigate, onNavigateSurah, onNavigateSettings]);

    // Setup recognition instance and its event handlers only once
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

                newUtterance.onend = () => {
                    if (utteranceRef.current === newUtterance) {
                        performActionAndClose();
                    }
                };

                newUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
                    console.error(`SpeechSynthesis Error: "${event.error}"`);
                    if (utteranceRef.current === newUtterance) {
                        performActionAndClose();
                    }
                };
                
                window.speechSynthesis.speak(newUtterance);

            } else {
                console.error("Speech synthesis not supported.");
                performActionAndClose();
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

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // Effect to reset state when modal is opened or closed
    useEffect(() => {
        if (isOpen) {
            setTranscript('');
            setStatus('idle');
        } else {
            recognitionRef.current?.abort();
            window.speechSynthesis.cancel();
        }
    }, [isOpen]);
    
    // Effect that triggers start based on state, preventing race conditions.
    useEffect(() => {
        const recognition = recognitionRef.current;
        if (isOpen && status === 'idle' && recognition) {
            setStatus('starting');
            try {
                recognition.start();
            } catch (e) {
                console.error("Recognition start error:", e);
                setStatus('idle');
            }
        }
    }, [isOpen, status]);
    
    if (!isOpen) return null;

    const getStatusMessage = () => {
        switch(status) {
            case 'starting':
            case 'listening': return 'Listening...';
            case 'processing': return 'Thinking...';
            case 'speaking': return 'Speaking...';
            default: return "Say a command, e.g., 'Open Surah Yasin'";
        }
    }

    return (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-primary animate-fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-primary p-2 rounded-full hover:bg-tertiary">
                <CloseIcon className="w-6 h-6" />
            </button>
            
            <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
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
            </div>
        </div>
    );
};

export default VoiceAssistant;
