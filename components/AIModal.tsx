import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../types';
import { AIIcon } from './icons/NavIcons';
import { CloseIcon } from '../contexts/MiscIcons';
import { GoogleGenAI, Type } from '@google/genai';

// --- Type Definitions ---
export interface AIAction {
    type: 'navigate_page' | 'navigate_surah' | 'navigate_settings';
    payload: any;
}

interface AIResponse {
    text: string;
    action?: AIAction;
    actionLabel?: string;
}

interface Message {
    id: number;
    from: 'user' | 'ai';
    text: string;
    action?: AIAction;
    actionLabel?: string;
}

// --- Icon ---
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

// --- Pre-loaded Questions ---
const predefinedQuestions: string[] = [
    "Take me to Surah Yasin",
    "Show me prayer timings",
    "Open the Hadith library",
    "Change app appearance",
];

// --- Gemini API Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        response_text: {
            type: Type.STRING,
            description: "A friendly, conversational response to the user's query.",
        },
        action_type: {
            type: Type.STRING,
            description: "The type of action the app should perform.",
            enum: ['navigate_page', 'navigate_surah', 'navigate_settings', 'unsupported', 'greeting'],
        },
        action_payload: {
            type: Type.OBJECT,
            description: "Data needed to perform the action.",
            properties: {
                page: {
                    type: Type.STRING,
                    description: "The page to navigate to.",
                    enum: Object.values(Page),
                },
                surah_number: {
                    type: Type.INTEGER,
                    description: "The number of the Surah to navigate to.",
                },
            },
        },
        action_label: {
            type: Type.STRING,
            description: "A short, actionable label for a button, e.g., 'Go to Surah Yasin'.",
        },
    },
    required: ['response_text', 'action_type']
};

const systemInstruction = `You are an AI assistant for AlQuran360. Your task is to interpret user commands and generate a JSON response based on a specific schema.

Possible Actions:
- **navigate_page**: When the user wants to go to a main page ('Home', 'Prayer', 'Quran', 'Hadith').
- **navigate_surah**: When the user wants to open a specific Quran chapter (Surah). You must return the surah's number.
- **navigate_settings**: For settings or appearance changes.
- **unsupported**: If you cannot understand the request. Respond that you are still learning.
- **greeting**: For simple greetings like 'hi' or 'assalamu alaikum'.

Surah Mapping Examples:
- "Yasin" -> surah_number: 36
- "Al-Fatihah" -> surah_number: 1
- "The Cow" or "Al-Baqarah" -> surah_number: 2
- "surah 56" or "waqiah" -> surah_number: 56

Page Mapping Examples:
- "prayer timings" -> page: "Prayer"
- "read hadith" or "bukhari" -> page: "Hadith"

Always provide a friendly, short \`response_text\` in English. The \`action_label\` should be a concise call to action for a button if an action exists.`;


// --- AI Modal Component ---
interface AIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: AIAction) => void;
}

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onAction }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const initialMessage: Message = {
        id: 0,
        from: 'ai',
        text: "Assalamu alaikum! I'm your assistant. How can I help you? You can ask me to navigate the app.",
    };

    useEffect(() => {
        if (isOpen) {
            setMessages([initialMessage]);
            setUserInput('');
            setIsLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    async function getAndProcessAiResponse(prompt: string) {
        setIsLoading(true);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema,
                },
            });

            const jsonText = response.text.trim();
            const parsedJson = JSON.parse(jsonText);
            
            const aiMessage: Message = {
                id: Date.now(),
                from: 'ai',
                text: parsedJson.response_text || "I'm not sure how to respond to that.",
            };
            
            if (parsedJson.action_type && parsedJson.action_type !== 'unsupported' && parsedJson.action_type !== 'greeting') {
                aiMessage.action = {
                    type: parsedJson.action_type,
                    payload: {
                        page: parsedJson.action_payload?.page,
                        surahNumber: parsedJson.action_payload?.surah_number,
                    },
                };
                aiMessage.actionLabel = parsedJson.action_label;
            }
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error getting AI response:", error);
            const errorMsg: Message = {
                id: Date.now(),
                from: 'ai',
                text: "I'm sorry, I'm having trouble understanding right now. Please try again."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSendMessage = (e?: React.FormEvent, text?: string) => {
        if (e) e.preventDefault();
        const query = text || userInput.trim();
        if (!query) return;

        const userMessage: Message = {
            id: Date.now(),
            from: 'user',
            text: query,
        };
        
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        
        getAndProcessAiResponse(query);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-primary z-50 flex flex-col animate-fade-in">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-primary flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center">
                        <AIIcon className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-primary">AI Assistant</h1>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                    <CloseIcon className="w-6 h-6 text-primary" />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-hide">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        {msg.from === 'ai' && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><AIIcon className="w-5 h-5 accent-text" /></div>}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.from === 'user' ? 'bg-green-500 text-white rounded-br-none' : 'bg-secondary text-primary rounded-bl-none'}`}>
                            <p>{msg.text}</p>
                            {msg.action && (
                                <button onClick={() => onAction(msg.action!)} className="mt-3 w-full text-left p-2 bg-tertiary rounded-lg font-semibold accent-text hover:opacity-80 transition-opacity">
                                    {msg.actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2 justify-start animate-fade-in-up">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><AIIcon className="w-5 h-5 accent-text" /></div>
                        <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-secondary text-primary rounded-bl-none">
                             <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0s' }}></span>
                                <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <footer className="p-4 border-t border-primary flex-shrink-0">
                {messages.length <= 1 && (
                     <div className="mb-3">
                         <p className="text-sm font-semibold text-secondary mb-2 text-center">Or try one of these</p>
                         <div className="grid grid-cols-2 gap-2">
                            {predefinedQuestions.map((q, i) => (
                                <button key={i} onClick={() => handleSendMessage(undefined, q)} className="text-sm text-left p-3 bg-secondary rounded-lg text-primary hover:bg-tertiary transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                     </div>
                )}
                 <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="e.g., open Surah Al-Baqarah"
                        className="w-full bg-secondary border border-primary rounded-lg py-2 px-4 text-primary placeholder-color focus:outline-none focus:ring-1 focus:ring-green-500"
                        disabled={isLoading}
                        autoFocus
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 bg-green-500 text-white rounded-lg disabled:opacity-50 flex-shrink-0 transition-opacity">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default AIModal;
