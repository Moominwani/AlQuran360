import React, { useState, useRef, useEffect } from 'react';
import { AIIcon, QuranIcon, PrayerIcon, HadithIcon } from './icons/NavIcons';
import { SlidersIcon, ChevronLeftIcon } from './icons/MiscIcons';
import { parseCommand } from '../utils/commandParser';

interface AIAssistantProps {
  onAction: (action: { type: string; payload: any }) => void;
  onBack: () => void;
}

interface Message {
    id: number;
    sender: 'user' | 'bot';
    text: string;
}

const WelcomeSuggestion: React.FC<{ Icon: React.ElementType; text: string; onClick: () => void }> = ({ Icon, text, onClick }) => (
    <button onClick={onClick} className="bg-secondary p-4 rounded-2xl flex flex-col items-start justify-between h-28 text-left transition-transform transform hover:scale-105">
        <Icon className="w-6 h-6 text-primary/70" />
        <span className="font-medium text-primary">{text}</span>
    </button>
);

const TypingIndicator = () => (
    <div className="flex items-end gap-3 justify-start animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center"><AIIcon className="w-5 h-5 text-primary" /></div>
        <div className="px-4 py-3 rounded-2xl bg-secondary text-primary rounded-bl-lg">
            <div className="flex items-center justify-center space-x-1.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            </div>
        </div>
    </div>
);

const AIAssistant: React.FC<AIAssistantProps> = ({ onAction, onBack }) => {
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 0, sender: 'bot', text: "As-salamu alaykum! I am your personal assistant for AlQuran360. How can I help you today?" }
    ]);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleCommand = (command: string) => {
        if (!command.trim()) return;

        const userMessage: Message = { id: Date.now(), sender: 'user', text: command };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        const action = parseCommand(command);
        
        setTimeout(() => {
            setIsTyping(false);
            const responseText = action.responseText || 'Got it!';
            const botResponse: Message = { id: Date.now() + 1, sender: 'bot', text: responseText };
            setMessages(prev => [...prev, botResponse]);

            if (action.type !== 'unknown' && action.type !== 'greet') {
                 setTimeout(() => {
                    onAction(action);
                }, 800);
            }
        }, 1000); // Simulate bot "thinking"
        
        setInputValue('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCommand(inputValue);
    };
    
    const showWelcomeScreen = messages.length === 1;

    return (
        <div className="flex flex-col h-full bg-primary text-primary relative">
            <header className="flex items-center justify-between p-4 flex-shrink-0 z-10">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/80 backdrop-blur-sm">
                    <ChevronLeftIcon className="w-6 h-6 text-primary" />
                </button>
                <div className="px-4 py-2 rounded-full bg-tertiary/80 backdrop-blur-sm text-primary font-semibold">AlQuran360 AI</div>
                <div className="w-10 h-10"></div> {/* Placeholder for alignment */}
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                {showWelcomeScreen ? (
                    <div className="flex flex-col items-center justify-center h-full text-center -mt-16 animate-fade-in">
                        <h1 className="text-4xl font-bold mb-8 text-primary/80">What can I help with?</h1>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            <WelcomeSuggestion Icon={QuranIcon} text="Read Surah Al-Mulk" onClick={() => handleCommand('Read Surah Al-Mulk')} />
                            <WelcomeSuggestion Icon={PrayerIcon} text="Show prayer times" onClick={() => handleCommand('Show prayer times')} />
                            <WelcomeSuggestion Icon={HadithIcon} text="Open Hadith books" onClick={() => handleCommand('Open Hadith books')} />
                            <WelcomeSuggestion Icon={SlidersIcon} text="Change theme" onClick={() => handleCommand('Change theme')} />
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.slice(1).map((msg) => ( // Hide the initial greeting from chat log
                            <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                               {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center"><AIIcon className="w-5 h-5 text-primary" /></div>}
                               <div 
                                 className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl animate-fade-in-up allow-selection ${
                                    msg.sender === 'user' 
                                        ? 'bg-green-500 text-white rounded-br-lg' 
                                        : 'bg-secondary text-primary rounded-bl-lg'
                                 }`}
                               >
                                   <p className="whitespace-pre-wrap">{msg.text}</p>
                               </div>
                            </div>
                        ))}
                        {isTyping && <TypingIndicator />}
                    </>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-2 pb-4 bg-primary/80 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask AlQuran360..."
                            className="w-full bg-secondary border-none rounded-full py-3 pl-5 pr-14 text-primary placeholder-color focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                         <button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-green-500 text-white transition-all transform active:scale-90 disabled:opacity-50 disabled:bg-tertiary"
                            aria-label="Send command"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                        </button>
                    </div>
                </form>
            </footer>
        </div>
    );
};
export default AIAssistant;