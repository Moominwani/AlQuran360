import React, { useState, useEffect, useRef } from 'react';
import { AIIcon } from './icons/NavIcons';
import { CloseIcon } from './icons/MiscIcons';
import { parseCommand, AppAction } from '../utils/commandParser';
import { speak, cancelSpeech } from '../utils/tts';

interface VoiceCommandUIProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: { type: string; payload: any }) => void;
}

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const VoiceCommandUI: React.FC<VoiceCommandUIProps> = ({ isOpen, onClose, onAction }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'unsupported'>('idle');
    const [transcript, setTranscript] = useState('');
    
    const recognitionRef = useRef<any>(null);
    const statusRef = useRef(status);

    useEffect(() => { statusRef.current = status; }, [status]);

    useEffect(() => {
        if (!SpeechRecognitionAPI) {
            setStatus('unsupported');
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = true;

        recognition.onstart = () => setStatus('listening');
        
        recognition.onend = () => {
            if (statusRef.current === 'listening') {
                setStatus('idle');
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setStatus('idle');
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
            setTranscript(interimTranscript || `"${finalTranscript}"`);
            
            if (finalTranscript) {
                setStatus('processing');
                const command = finalTranscript.trim();
                const action = parseCommand(command);

                const executeAction = async (actionToExecute: AppAction) => {
                    if (actionToExecute.responseText) {
                        await speak(actionToExecute.responseText);
                    }

                    if (actionToExecute.type !== 'greet' && actionToExecute.type !== 'unknown') {
                        onAction(actionToExecute);
                    } else {
                        onClose();
                    }
                };

                setTimeout(() => executeAction(action), 500);
            }
        };

        return () => { 
            if (recognitionRef.current) recognitionRef.current.abort(); 
            cancelSpeech();
        };
    }, [onAction, onClose]);

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (isOpen && status === 'idle' && recognition) {
            setTranscript('');
            try {
                recognition.start();
            } catch (e) {
                console.error("Recognition start error:", e);
                setStatus('idle');
            }
        } else if (!isOpen) {
            recognition?.abort();
            setStatus('idle');
        }
    }, [isOpen, status]);
    
    if (!isOpen) return null;

    const getStatusMessage = () => {
        switch(status) {
            case 'listening': return 'Listening...';
            case 'processing': return 'Got it!';
            case 'unsupported': return 'Voice control is not supported on this browser.';
            default: return "Say a command, e.g., 'Open Surah Yasin'";
        }
    };
    
    const handleClose = () => {
        cancelSpeech();
        onClose();
    }

    return (
        <div className="fixed inset-x-0 top-0 bottom-20 bg-secondary/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-primary animate-fade-in" onClick={handleClose}>
            <button onClick={handleClose} className="absolute top-4 right-4 text-primary p-2 rounded-full hover:bg-tertiary">
                <CloseIcon className="w-6 h-6" />
            </button>
            <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
                <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                    {status === 'listening' && (
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

export default VoiceCommandUI;