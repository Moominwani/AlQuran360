import React from 'react';
import { ChevronLeftIcon, CrownIcon } from '../components/icons/MiscIcons';
import { AIIcon } from '../components/icons/NavIcons';

interface AboutAssistantProps {
  onBack: () => void;
}

const AboutAssistant: React.FC<AboutAssistantProps> = ({ onBack }) => {
  return (
    <div className="bg-primary text-primary min-h-screen p-4 animate-fade-in allow-selection">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 mr-2 rounded-full hover:bg-secondary">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">About Assistants</h1>
      </header>
      <main className="px-2 space-y-6 max-h-[80vh] overflow-y-auto pb-8">
        {/* AlQuran360 AI Assistant */}
        <div className="bg-secondary p-4 rounded-lg">
          <div className="flex items-center gap-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
                <AIIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-primary">AlQuran360 Assistant</h2>
          </div>
          <p className="text-secondary mb-3">
            This is your built-in assistant for controlling the app with voice or text commands. It's designed for quick actions and navigation.
          </p>
          <h3 className="font-semibold text-primary mb-2">What can it do?</h3>
          <ul className="list-disc list-inside ml-4 space-y-1 text-secondary text-sm">
            <li><strong>Navigate:</strong> "Go to Settings", "Open Qibla finder", "Show me Hadith books".</li>
            <li><strong>Control Quran:</strong> "Read Surah Al-Mulk", "Play Surah Yasin", "Open verse 15 of Al-Baqarah".</li>
            <li><strong>Get Info:</strong> "How many verses in Al-Fatihah?", "Which is the longest surah?".</li>
            <li><strong>And more:</strong> Just ask "What can you do?" to see a full list.</li>
          </ul>
        </div>

        {/* AI Scholar */}
        <div className="bg-secondary p-4 rounded-lg">
          <div className="flex items-center gap-x-3 mb-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
                <CrownIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-primary">Islamic AI Scholar</h2>
          </div>
          <p className="text-secondary mb-3">
            Accessible from the Home screen, the AI Scholar is a powerful, knowledgeable chatbot for deeper Islamic research and learning. It connects to an external service.
          </p>
          <h3 className="font-semibold text-primary mb-2">What is it for?</h3>
          <ul className="list-disc list-inside ml-4 space-y-1 text-secondary text-sm">
            <li>Answering complex questions about Fiqh (jurisprudence).</li>
            <li>Providing Tafsir (exegesis) for Quranic verses.</li>
            <li>Discussing Islamic history, theology, and more.</li>
            <li>Engaging in detailed conversations about various Islamic topics.</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AboutAssistant;
