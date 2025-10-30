import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';
import { parseCommand } from '../utils/commandParser';
import { AIIcon, SendIcon, PlusIcon, MicrophoneIcon } from './icons/NavIcons';
import { ChevronLeftIcon, RefreshIcon } from './icons/MiscIcons';


interface AIAssistantProps {
  onAction: (action: { type: string; payload: any }) => void;
  onBack: () => void;
  onVoiceCommand: () => void;
}

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

const SuggestionChip: React.FC<{ text: string; onClick: () => void; }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 border border-primary/50 rounded-full text-sm text-primary bg-secondary hover:bg-tertiary transition-colors"
    >
        {text}
    </button>
);

const TypingIndicator = () => (
  <div className="flex items-end gap-3 justify-start animate-fade-in">
    <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
      <AIIcon className="w-5 h-5 text-primary" />
    </div>
    <div className="px-4 py-3 rounded-2xl bg-secondary text-primary rounded-bl-lg">
      <div className="flex items-center justify-center space-x-1.5">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
      </div>
    </div>
  </div>
);

const CHAT_HISTORY_KEY = 'ai_chat_history_v2';
const initialBotMessage: Message = { id: 0, sender: 'bot', text: "As-salamu alaykum! I am your personal assistant for AlQuran360. How can I help you today?" };

const getInitialMessages = (): Message[] => {
    try {
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistory) {
            const { messages: savedMessages, timestamp } = JSON.parse(savedHistory);
            const isExpired = (Date.now() - timestamp) > 24 * 60 * 60 * 1000; 
            if (!isExpired && Array.isArray(savedMessages) && savedMessages.length > 0) {
                return savedMessages;
            }
        }
    } catch (e) {
        console.error("Failed to load chat history", e);
    }
    return [initialBotMessage];
};


const AIAssistant: React.FC<AIAssistantProps> = ({ onAction, onBack, onVoiceCommand }) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const visualViewport = window.visualViewport;
    if (!container || !visualViewport) return;

    const handleViewportResize = () => {
      container.style.height = `${visualViewport.height}px`;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    visualViewport.addEventListener('resize', handleViewportResize);
    handleViewportResize(); // Set initial height

    return () => {
      visualViewport.removeEventListener('resize', handleViewportResize);
      if (container) container.style.height = '100vh';
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  useEffect(() => {
    if (messages.length > 1) {
        const history = {
            messages,
            timestamp: Date.now()
        };
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
    }
  }, [messages]);

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
        setTimeout(() => onAction(action), 800);
      }
    }, 1000 + Math.random() * 1000);

    setInputValue('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleCommand(inputValue);
  };
  
  const handleResetChat = () => {
    setMessages([initialBotMessage]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  const showWelcomeScreen = messages.length <= 1;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-primary text-primary flex flex-col overflow-hidden transition-height duration-200 ease-out">
      <header className="flex items-center justify-between p-4 flex-shrink-0 z-10 border-b border-primary">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary"
        >
          <ChevronLeftIcon className="w-6 h-6 text-primary" />
        </button>
        <div className="text-primary font-semibold">
          AlQuran360 AI
        </div>
        <button onClick={handleResetChat} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary" aria-label="New Chat">
          <RefreshIcon className="w-6 h-6 text-primary" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col">
        {showWelcomeScreen ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in h-full px-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center shadow-lg mb-6">
                <AIIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">As-salamu alaykum!</h1>
            <p className="text-secondary mt-2">How can I help you today?</p>
          </div>
        ) : (
          <div className="mt-auto space-y-6">
            {messages.slice(1).map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
                    <AIIcon className="w-5 h-5 text-primary" />
                  </div>
                )}
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

       <footer className="flex-shrink-0 p-2 bg-primary border-t border-primary">
            {showWelcomeScreen && (
                <div className="max-w-2xl mx-auto mb-3 flex flex-wrap justify-center gap-2 p-2">
                    <SuggestionChip text="Read Surah Al-Mulk" onClick={() => handleCommand('Read Surah Al-Mulk')} />
                    <SuggestionChip text="Prayer times" onClick={() => handleCommand('Show prayer times for tomorrow')} />
                    <SuggestionChip text="Open Hadith books" onClick={() => handleCommand('Open Hadith books')} />
                    <SuggestionChip text="Who developed this app?" onClick={() => handleCommand('who developed this app?')} />
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center space-x-2 max-w-2xl mx-auto bg-secondary rounded-full px-2 py-1 shadow-md">
                <button type="button" className="w-10 h-10 flex items-center justify-center text-primary rounded-full hover:bg-tertiary flex-shrink-0">
                    <PlusIcon className="w-6 h-6" />
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask AlQuran360 AI..."
                    className="w-full bg-transparent border-none py-2 text-primary placeholder-color focus:outline-none"
                />
                <div className="flex-shrink-0">
                    {inputValue.trim() ? (
                    <button
                        type="submit"
                        disabled={isTyping}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white transition-transform active:scale-90 disabled:opacity-50"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                    ) : (
                    <button type="button" onClick={onVoiceCommand} className="w-10 h-10 flex items-center justify-center text-primary rounded-full hover:bg-tertiary">
                        <MicrophoneIcon className="w-6 h-6" />
                    </button>
                    )}
                </div>
            </form>
      </footer>
    </div>
  );
};
export default AIAssistant;