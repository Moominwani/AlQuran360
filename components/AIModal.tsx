import React from 'react';
import { Page } from '../types';
import { AIIcon } from './icons/NavIcons';
import { CloseIcon } from '../contexts/MiscIcons';

export interface AIAction {
    type: 'navigate_page' | 'navigate_surah' | 'navigate_settings';
    payload: any;
}

interface AIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: AIAction) => void;
}

const predefinedActions: { label: string; action: AIAction }[] = [
    {
        label: "Take me to Surah Yasin",
        action: { type: 'navigate_surah', payload: { surahNumber: 36 } }
    },
    {
        label: "Show me prayer timings",
        action: { type: 'navigate_page', payload: { page: Page.Prayer } }
    },
    {
        label: "Open the Hadith library",
        action: { type: 'navigate_page', payload: { page: Page.Hadith } }
    },
    {
        label: "Open Surah Al-Waqi'ah (56)",
        action: { type: 'navigate_surah', payload: { surahNumber: 56 } }
    },
    {
        label: "Change app appearance",
        action: { type: 'navigate_settings', payload: {} }
    },
];

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onAction }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-secondary rounded-2xl w-full max-w-md p-6 relative animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-secondary p-1 rounded-full hover:bg-tertiary">
                    <CloseIcon className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center mb-4">
                        <AIIcon className="w-9 h-9 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-primary">AI Assistant</h2>
                    <p className="text-sm text-secondary mt-1">What would you like to do?</p>
                </div>

                <div className="space-y-3">
                    {predefinedActions.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => onAction(item.action)}
                            className="w-full text-left p-4 bg-tertiary rounded-lg text-primary hover:bg-primary transition-colors font-medium"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIModal;
