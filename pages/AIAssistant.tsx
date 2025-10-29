import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Part } from '@google/genai';
import { ChevronLeftIcon } from '../components/icons/MiscIcons';
import { SendIcon, AIIcon } from '../components/icons/NavIcons';
import { Page } from '../types';
import { getIntentAndResponse } from '../utils/aiLogic';

interface Message {
  role: 'user' | 'model';
  parts: Part[];
}

interface AIAssistantProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  onNavigateSurah: (surahNumber: number, startPlayback?: boolean) => void;
  onNavigateSettings: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onBack, onNavigate, onNavigateSurah, onNavigateSettings }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasApiKey, setHasApiKey] = useState<boolean | 'checking'>('checking');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const hints = [
        "Read Surah Al-Mulk",
        "Show prayer times",
        "Open Surah Masad",
        "Change the theme",
        "Hadith Library",
    ];
    
    useEffect(() => {
        const checkKey = async () => {
            if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
                const keyStatus = await (window as any).aistudio.hasSelectedApiKey();
                setHasApiKey(keyStatus);
                if (keyStatus) {
                    initializeChat();
                }
            } else {
                setHasApiKey(false);
            }
        };
        checkKey();
    }, []);

    const initializeChat = () => {
        setMessages([{
            role: 'model',
            parts: [{ text: "Greetings! I am your guide to AlQuran360. This app was lovingly crafted by **Moomin Wani**. You can ask me to open a Surah, show prayer times, and more. How may I help you?" }]
        }]);
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (prompt: string) => {
        if (!prompt.trim() || isLoading) return;

        const newUserMessage: Message = { role: 'user', parts: [{ text: prompt }] };
        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);
        setInputText('');

        try {
            const { responseText, action } = await getIntentAndResponse(prompt);
            const newModelMessage: Message = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, newModelMessage]);

            if (action && action.type !== 'info') {
                setTimeout(() => {
                    switch (action.type) {
                        case 'navigate_page':
                            onNavigate(action.payload.page);
                            break;
                        case 'navigate_surah':
                            onNavigateSurah(action.payload.surahNumber, action.payload.startPlayback);
                            break;
                        case 'navigate_settings':
                            onNavigateSettings();
                            break;
                    }
                }, 800);
            }
        } catch (error) {
            console.error("AI Error:", error);
            let errorMessage = "An unexpected error occurred.";
            if (error instanceof Error) {
                if (error.message.includes("not found") || error.message.includes("API key")) {
                    setHasApiKey(false);
                    errorMessage = "Your API key seems to be invalid. Please select a valid key to continue.";
                } else {
                    errorMessage = `An error occurred: ${error.message}`;
                }
            }
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: errorMessage }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleSendMessage(inputText);
    };
    
    const handleHintClick = (hint: string) => {
        handleSendMessage(hint);
    }
    
    const handleSelectKey = async () => {
        if ((window as any).aistudio?.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            setHasApiKey(true);
            setMessages([]); // Clear chat history
            initializeChat();
        }
    };
    
    if (hasApiKey === 'checking') {
        return (
            <div className="bg-primary text-primary min-h-screen flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-secondary">Checking AI configuration...</p>
            </div>
        );
    }

    if (!hasApiKey) {
        return (
            <div className="bg-primary text-primary min-h-screen flex flex-col">
                <header className="flex items-center p-4 border-b border-primary/20">
                    <button onClick={onBack} className="p-2 mr-2 rounded-full hover:bg-secondary">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold">AI Assistant</h1>
                </header>
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center mb-4">
                        <AIIcon className="w-9 h-9 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">API Key Required</h2>
                    <p className="text-secondary mb-6 max-w-sm">To enable the AI Assistant, please select a Google AI Studio API key. This is required for all AI-powered features.</p>
                    <button onClick={handleSelectKey} className="px-6 py-3 rounded-lg bg-green-500 text-white font-semibold shadow-md hover:bg-green-600 transition-colors">
                        Select API Key
                    </button>
                    <p className="text-xs text-secondary mt-4">
                        For more info, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline accent-text">billing documentation</a>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-primary text-primary min-h-screen flex flex-col animate-fade-in">
            <header className="flex items-center p-4 border-b border-primary/20 sticky top-0 bg-primary/80 backdrop-blur-sm z-10">
                <button onClick={onBack} className="p-2 mr-2 rounded-full hover:bg-secondary">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">AI Assistant</h1>
            </header>

            <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center flex-shrink-0"><AIIcon className="w-5 h-5 text-white" /></div>}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl animate-fade-in-up ${msg.role === 'user' ? 'bg-green-500 text-white rounded-br-none' : 'bg-secondary text-primary rounded-bl-none'}`}>
                            <p className="text-base whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: msg.parts[0].text?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || ''}}></p>
                        </div>
                    </div>
                ))}
                 {isLoading && messages.length > 0 && (
                    <div className="flex items-end gap-2 justify-start animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center flex-shrink-0"><AIIcon className="w-5 h-5 text-white" /></div>
                        <div className="p-3 rounded-2xl bg-secondary rounded-bl-none">
                            <div className="flex space-x-1">
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-primary/50 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="px-4 pb-2">
                <div className="flex overflow-x-auto space-x-2 py-2 scrollbar-hide">
                    {hints.map(hint => (
                        <button key={hint} onClick={() => handleHintClick(hint)} disabled={isLoading} className="px-3 py-1.5 bg-tertiary text-primary rounded-full text-sm font-medium whitespace-nowrap disabled:opacity-50">{hint}</button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-primary sticky bottom-0">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="e.g., 'Open Surah 55'"
                        disabled={isLoading}
                        className="flex-grow bg-secondary border border-primary/20 rounded-full py-3 px-5 text-primary placeholder-color focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                        aria-label="Chat input"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputText.trim()}
                        className="w-12 h-12 flex-shrink-0 rounded-full bg-green-500 text-white flex items-center justify-center disabled:bg-gray-500 transition-all"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIAssistant;