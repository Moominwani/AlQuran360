import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Part, Chat } from '@google/genai';
import { Page } from '../types';
import { ChevronLeftIcon } from '../components/icons/MiscIcons';
import { SendIcon, AIIcon } from '../components/icons/NavIcons';

interface Message {
  role: 'user' | 'model';
  parts: Part[];
}

interface AIAssistantProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  onNavigateSurah: (surahNumber: number) => void;
  onNavigateSettings: () => void;
}

const navigateToPage: FunctionDeclaration = {
    name: 'navigate_to_page',
    parameters: {
        type: Type.OBJECT,
        description: 'Navigates to one of the main pages of the app.',
        properties: {
            page: {
                type: Type.STRING,
                description: 'The name of the page to navigate to. Must be one of: Home, Prayer, Quran, Hadith.',
                enum: ['Home', 'Prayer', 'Quran', 'Hadith']
            },
        },
        required: ['page'],
    },
};

const navigateToSurah: FunctionDeclaration = {
    name: 'navigate_to_surah',
    parameters: {
        type: Type.OBJECT,
        description: 'Navigates to a specific Surah (chapter) of the Quran by its number.',
        properties: {
            surahNumber: {
                type: Type.NUMBER,
                description: 'The number of the Surah to open, from 1 to 114.',
            },
        },
        required: ['surahNumber'],
    },
};

const navigateToSettings: FunctionDeclaration = {
    name: 'navigate_to_settings',
    parameters: { type: Type.OBJECT, properties: {}, description: 'Opens the application settings screen.' },
};


const AIAssistant: React.FC<AIAssistantProps> = ({ onBack, onNavigate, onNavigateSurah, onNavigateSettings }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const aiRef = useRef<GoogleGenAI | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const hints = [
        "Open Surah Al-Fatihah",
        "Show today's prayer times",
        "Take me to the Hadith library",
        "What is Surah Yasin's number?",
    ];
    
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            aiRef.current = ai;

            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    tools: [{ functionDeclarations: [navigateToPage, navigateToSurah, navigateToSettings] }],
                    systemInstruction: "You are a helpful assistant for an Islamic app called AlQuran360. You can help users navigate to different pages (Home, Prayer, Quran, Hadith), open specific Surahs by name or number, and go to settings. Your developer is Moomin Wani. When a user asks a question that can be answered with a function call, prioritize calling the function over providing a text response. Keep your text responses concise and friendly."
                }
            });

            // Set initial welcome message after a short delay for animation
            setTimeout(() => {
                setMessages([{
                    role: 'model',
                    parts: [{ text: "Greetings! I am AlQuran360's AI Assistant. This app was lovingly crafted by **Moomin Wani**. How may I help you navigate or learn today?" }]
                }]);
                setIsLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error initializing AI:", error);
            setTimeout(() => {
                setMessages([{
                    role: 'model',
                    parts: [{ text: "I'm having trouble starting up. This might be due to an issue with the API key or network connection. Please check the setup and try again." }]
                }]);
                setIsLoading(false);
            }, 500);
        }
    }, []);

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

        try {
            if (!chatRef.current) throw new Error("AI Chat not initialized");
            
            const response = await chatRef.current.sendMessage({ message: prompt });

            if (response.functionCalls && response.functionCalls.length > 0) {
                for (const fc of response.functionCalls) {
                    switch (fc.name) {
                        case 'navigate_to_page':
                            onNavigate(fc.args.page as Page);
                            break;
                        case 'navigate_to_surah':
                            onNavigateSurah(fc.args.surahNumber as number);
                            break;
                        case 'navigate_to_settings':
                            onNavigateSettings();
                            break;
                    }
                }
                // We don't add a model response here because the app state will change.
            } else if (response.text) {
                const newModelMessage: Message = { role: 'model', parts: [{ text: response.text }] };
                setMessages(prev => [...prev, newModelMessage]);
            }

        } catch (error) {
            console.error("Error communicating with AI:", error);
            const errorMessage: Message = { role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleSendMessage(inputText);
        setInputText('');
    };
    
    const handleHintClick = (hint: string) => {
        handleSendMessage(hint);
        setInputText('');
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
                    <div className="flex items-end gap-2 justify-start">
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
                        <button key={hint} onClick={() => handleHintClick(hint)} className="px-3 py-1.5 bg-tertiary text-primary rounded-full text-sm font-medium whitespace-nowrap">{hint}</button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-primary sticky bottom-0">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask me anything..."
                        className="flex-grow bg-secondary border border-primary/20 rounded-full py-3 px-5 text-primary placeholder-color focus:outline-none focus:ring-1 focus:ring-green-500"
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
