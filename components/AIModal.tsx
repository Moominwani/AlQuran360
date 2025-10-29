import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../types';
import { AIIcon } from './icons/NavIcons';
import { CloseIcon } from '../contexts/MiscIcons';

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

interface PredefinedQuestion {
    question: string;
    response: AIResponse;
}

interface Message {
    id: number;
    from: 'user' | 'ai';
    text: string;
    action?: AIAction;
    actionLabel?: string;
}

// --- Pre-loaded Q&A Data ---
const predefinedQuestions: PredefinedQuestion[] = [
    {
        question: "Take me to Surah Al-Baqarah.",
        response: {
            text: "Of course. I can take you directly to Surah Al-Baqarah (Chapter 2).",
            action: { type: 'navigate_surah', payload: { surahNumber: 2 } },
            actionLabel: "Go to Surah Al-Baqarah",
        },
    },
    {
        question: "Show me the prayer times.",
        response: {
            text: "Here are the current prayer times for your location.",
            action: { type: 'navigate_page', payload: { page: Page.Prayer } },
            actionLabel: "View Prayer Times",
        },
    },
    {
        question: "I want to read Hadith.",
        response: {
            text: "Opening the Hadith library for you to explore.",
            action: { type: 'navigate_page', payload: { page: Page.Hadith } },
            actionLabel: "Open Hadith Library",
        },
    },
    {
        question: "How do I change the app's theme?",
        response: {
            text: "You can customize the app's appearance in the settings menu.",
            action: { type: 'navigate_settings', payload: {} },
            actionLabel: "Open Settings",
        },
    }
];

// --- AI Modal Component ---
interface AIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: AIAction) => void;
}

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onAction }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const initialMessage: Message = {
        id: 0,
        from: 'ai',
        text: "Assalamu alaikum! I'm your assistant for AlQuran360. How can I help you today? You can select one of the options below.",
    };

    useEffect(() => {
        if (isOpen) {
            setMessages([initialMessage]);
        }
    }, [isOpen]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleQuestionSelect = (question: PredefinedQuestion) => {
        const userMessage: Message = {
            id: Date.now(),
            from: 'user',
            text: question.question,
        };
        const aiMessage: Message = {
            id: Date.now() + 1,
            from: 'ai',
            text: question.response.text,
            action: question.response.action,
            actionLabel: question.response.actionLabel,
        };
        setMessages(prev => [...prev, userMessage, aiMessage]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-primary z-50 flex flex-col animate-fade-in">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-primary">
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
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.from === 'ai' && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><AIIcon className="w-5 h-5 accent-text" /></div>}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.from === 'user' ? 'bg-green-500 text-white rounded-br-none' : 'bg-secondary text-primary rounded-bl-none'}`}>
                            <p>{msg.text}</p>
                            {msg.action && (
                                <button onClick={() => onAction(msg.action!)} className="mt-3 w-full text-left p-2 bg-tertiary rounded-lg font-semibold accent-text hover:opacity-80">
                                    {msg.actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Predefined Questions */}
            <footer className="p-4 border-t border-primary">
                 <p className="text-sm font-semibold text-secondary mb-3 text-center">Suggested Commands</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {predefinedQuestions.map((q, i) => (
                        <button key={i} onClick={() => handleQuestionSelect(q)} className="w-full text-left p-3 bg-secondary rounded-lg text-primary hover:bg-tertiary transition-colors">
                            {q.question}
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
};

export default AIModal;