import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';
import { parseCommand } from '../utils/commandParser';
import { AIIcon, SendIcon, PlusIcon, MicrophoneIcon } from './icons/NavIcons';
import { HamburgerIcon } from './icons/MiscIcons';
import ChatHistoryPanel from './ChatHistoryPanel';


interface AIAssistantProps {
  onAction: (action: { type: string; payload: any }) => void;
  onBack: () => void;
  onVoiceCommand: () => void;
  onNavigate: (page: Page) => void;
}

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

interface ChatSession {
    id: number;
    messages: Message[];
    timestamp: number;
}

interface PendingQuestion {
    type: string;
    data: any;
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

const CHAT_SESSIONS_KEY = 'ai_chat_sessions_v1';
const initialBotMessage: Message = { id: 0, sender: 'bot', text: "As-salamu alaykum! I am your personal assistant for AlQuran360. How can I help you today?" };

const getInitialSessions = (): { sessions: ChatSession[], activeId: number | null } => {
    try {
        const savedData = localStorage.getItem(CHAT_SESSIONS_KEY);
        if (savedData) {
            const sessions: ChatSession[] = JSON.parse(savedData);
            const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
            const recentSessions = sessions.filter(s => s.timestamp > twentyFourHoursAgo);

            if (recentSessions.length > 0) {
                // Return most recent session as active
                const sortedSessions = recentSessions.sort((a, b) => b.timestamp - a.timestamp);
                return { sessions: sortedSessions, activeId: sortedSessions[0].id };
            }
        }
    } catch (e) {
        console.error("Failed to load chat sessions", e);
    }
    // No valid sessions found, start fresh
    const newSession: ChatSession = { id: Date.now(), messages: [initialBotMessage], timestamp: Date.now() };
    return { sessions: [newSession], activeId: newSession.id };
};


const AIAssistant: React.FC<AIAssistantProps> = ({ onAction, onBack, onVoiceCommand, onNavigate }) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState(getInitialSessions);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);

  const { sessions, activeId } = chatState;
  const activeChat = sessions.find(s => s.id === activeId);
  const messages = activeChat?.messages || [];

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const visualViewport = window.visualViewport;
    if (!container || !visualViewport) return;

    const handleViewportResize = () => {
      container.style.height = `${visualViewport.height}px`;
    };

    visualViewport.addEventListener('resize', handleViewportResize);
    handleViewportResize(); // Set initial height

    return () => visualViewport.removeEventListener('resize', handleViewportResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  useEffect(() => {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);
  
  const updateMessagesInSession = (newMessages: Message[]) => {
      setChatState(prevState => {
          const newSessions = prevState.sessions.map(session =>
              session.id === prevState.activeId
                  ? { ...session, messages: newMessages, timestamp: Date.now() }
                  : session
          );
          return { ...prevState, sessions: newSessions };
      });
  };

  const handleCommand = (command: string) => {
    if (!command.trim() || !activeId) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', text: command };
    const currentMessages = activeChat?.messages || [];
    updateMessagesInSession([...currentMessages, userMessage]);
    setIsTyping(true);
    
    const isNewQuestion = /(?:verse|ayah|ayat|surah|play|open|read|go to|what|who|how|where|when|why)/.test(command.toLowerCase());

    let action;
    // If there's a pending question AND the new command doesn't look like a new question, treat it as an answer.
    if (pendingQuestion?.type === 'ayah_number_missing_surah' && !isNewQuestion) {
        const combinedCommand = `verse ${pendingQuestion.data.ayahNumber} of ${command}`;
        action = parseCommand(combinedCommand);
        // If the combined command is still unknown, it means the user's answer was not a valid surah.
        if (action.type === 'unknown') {
            action.responseText = "I'm sorry, I couldn't find that surah. Let's start over. How can I help you?";
        }
        setPendingQuestion(null); // Clear the pending question after attempting to answer it.
    } else {
        // Otherwise, it's a new command. Discard any pending question.
        setPendingQuestion(null);
        action = parseCommand(command);
    }

    setTimeout(() => {
      setIsTyping(false);
      const responseText = action.responseText || 'Got it!';
      const botResponse: Message = { id: Date.now() + 1, sender: 'bot', text: responseText };
      const updatedMessages = [...(activeChat?.messages || []), userMessage, botResponse];
      updateMessagesInSession(updatedMessages);

      if (action.type === 'clarification_needed') {
          setPendingQuestion(action.payload.pendingQuestion);
      } else if (action.type !== 'unknown' && action.type !== 'greet' && action.type !== 'help') {
        setTimeout(() => onAction(action), 800);
      }
    }, 1000 + Math.random() * 500);

    setInputValue('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleCommand(inputValue);
  };
  
  const handleNewChat = () => {
    const newSession: ChatSession = { id: Date.now(), messages: [initialBotMessage], timestamp: Date.now() };
    setChatState(prevState => ({
        sessions: [newSession, ...prevState.sessions],
        activeId: newSession.id
    }));
    setPendingQuestion(null);
    setIsHistoryOpen(false);
  };

  const handleSelectChat = (id: number) => {
    setChatState(prevState => ({ ...prevState, activeId: id }));
    setPendingQuestion(null);
    setIsHistoryOpen(false);
  };

  const handleDeleteAllHistory = () => {
      const newSession: ChatSession = { id: Date.now(), messages: [initialBotMessage], timestamp: Date.now() };
      setChatState({ sessions: [newSession], activeId: newSession.id });
      setPendingQuestion(null);
      setIsHistoryOpen(false);
  };

  const showWelcomeScreen = messages.length <= 1;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-primary text-primary flex flex-col overflow-hidden">
      <ChatHistoryPanel 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeChatId={activeId}
        onSelectChat={handleSelectChat}
        onDeleteAll={handleDeleteAllHistory}
        onNewChat={handleNewChat}
        onBack={onBack}
      />
      <header className="flex items-center justify-between p-4 flex-shrink-0 z-10 border-b border-primary">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"
        >
          <HamburgerIcon className="w-6 h-6 text-primary" />
        </button>
        <div className="text-primary font-semibold">
          AlQuran360 AI
        </div>
        <button onClick={handleNewChat} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary" aria-label="New Chat">
          <PlusIcon className="w-6 h-6 text-primary" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-end">
        {showWelcomeScreen ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center animate-fade-in h-full px-4">
            <button
                onClick={() => onNavigate(Page.AIScholar)}
                className="w-full max-w-sm text-left p-4 rounded-2xl bg-secondary mb-8 border border-primary/20 flex items-center space-x-4 transition-transform transform hover:scale-[1.02]"
            >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                    <h2 className="font-bold text-primary">Islamic AI Scholar <span className="text-xs accent-text font-semibold bg-green-500/20 px-2 py-0.5 rounded-full">NEW</span></h2>
                    <p className="text-sm text-secondary">Ask complex questions and get detailed answers.</p>
                </div>
            </button>

            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center shadow-lg mb-6">
                <AIIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">As-salamu alaykum!</h1>
            <p className="text-secondary mt-2">I am your AlQuran360 Assistant. How can I help you today?</p>
          </div>
        ) : (
          <div className="space-y-6">
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
                    <SuggestionChip text="Who developed this app?" onClick={() => handleCommand('Who developed this app?')} />
                    <SuggestionChip text="How many verses are in Al-Baqarah?" onClick={() => handleCommand('How many verses are in Al-Baqarah?')} />
                    <SuggestionChip text="Play Surah Yasin" onClick={() => handleCommand('Play Surah Yasin')} />
                    <SuggestionChip text="What can you do?" onClick={() => handleCommand('What can you do?')} />
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-center space-x-2 max-w-2xl mx-auto bg-secondary rounded-full px-4 py-1 shadow-md">
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