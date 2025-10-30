import React from 'react';
import { CloseIcon } from './icons/MiscIcons';

interface ChatSession {
    id: number;
    messages: { sender: string; text: string }[];
}

interface ChatHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    activeChatId: number | null;
    onSelectChat: (id: number) => void;
    onDeleteAll: () => void;
    onNewChat: () => void;
    onBack: () => void;
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({ isOpen, onClose, sessions, activeChatId, onSelectChat, onDeleteAll, onNewChat, onBack }) => {
    if (!isOpen) return null;

    const getChatTitle = (session: ChatSession): string => {
        // Find the first user message to use as a title
        const firstUserMessage = session.messages.find(m => m.sender === 'user');
        return firstUserMessage?.text || 'New Chat';
    };

    return (
        <div className="fixed inset-0 z-40">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 animate-fade-in" 
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div className={`absolute top-0 left-0 bottom-0 w-72 bg-secondary text-primary flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <header className="p-4 border-b border-primary/20 flex-shrink-0">
                    <h2 className="text-xl font-bold">Chat History</h2>
                </header>

                <nav className="flex-1 overflow-y-auto p-2">
                    {sessions.map(session => (
                        <button
                            key={session.id}
                            onClick={() => onSelectChat(session.id)}
                            className={`w-full text-left p-3 my-1 rounded-lg truncate ${activeChatId === session.id ? 'bg-green-500/20 text-green-400' : 'hover:bg-tertiary'}`}
                        >
                            {getChatTitle(session)}
                        </button>
                    ))}
                </nav>

                <footer className="p-4 border-t border-primary/20 flex-shrink-0 space-y-2">
                    <button onClick={onDeleteAll} className="w-full text-left p-3 rounded-lg hover:bg-tertiary text-red-400">
                        Delete All History
                    </button>
                     <button onClick={onBack} className="w-full text-left p-3 rounded-lg hover:bg-tertiary">
                        Exit Assistant
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ChatHistoryPanel;
