import React, { useState, useEffect, useRef } from 'react';
import { RefreshIcon } from '../components/icons/MiscIcons';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons/MiscIcons';

const dhikrList = [
    { text: "SubhanAllah", ar: "سُبْحَانَ ٱللَّٰهِ", count: 33 },
    { text: "Alhamdulillah", ar: "ٱلْحَمْدُ لِلَّٰهِ", count: 33 },
    { text: "Allahu Akbar", ar: "ٱللَّٰهُ أَكْبَرُ", count: 33 },
    { text: "La ilaha illallah", ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", count: 1 },
    { text: "Free Count", ar: "عداد حر", count: Infinity }
];

const TASBEEH_COUNT_KEY = 'tasbeeh_count';
const TASBEEH_DHIKR_INDEX_KEY = 'tasbeeh_dhikr_index';

const Tasbeeh: React.FC = () => {
    const [count, setCount] = useState<number>(0);
    const [dhikrIndex, setDhikrIndex] = useState<number>(0);
    const [plusOneAnims, setPlusOneAnims] = useState<{ id: number; x: number; y: number }[]>([]);
    const counterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedCount = localStorage.getItem(TASBEEH_COUNT_KEY);
        const savedIndex = localStorage.getItem(TASBEEH_DHIKR_INDEX_KEY);
        if (savedCount) setCount(JSON.parse(savedCount));
        if (savedIndex) setDhikrIndex(JSON.parse(savedIndex));
    }, []);

    useEffect(() => {
        localStorage.setItem(TASBEEH_COUNT_KEY, JSON.stringify(count));
        localStorage.setItem(TASBEEH_DHIKR_INDEX_KEY, JSON.stringify(dhikrIndex));
    }, [count, dhikrIndex]);

    const handleIncrement = (event: React.MouseEvent<HTMLDivElement>) => {
        const newCount = count + 1;
        setCount(newCount);

        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        // Plus one animation
        const rect = counterRef.current?.getBoundingClientRect();
        if (rect) {
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const newAnim = { id: Date.now(), x, y };
            setPlusOneAnims(prev => [...prev, newAnim]);
            setTimeout(() => {
                setPlusOneAnims(prev => prev.filter(p => p.id !== newAnim.id));
            }, 500);
        }
    };
    
    const handleReset = () => {
        setCount(0);
    };

    const changeDhikr = (direction: number) => {
        const newIndex = (dhikrIndex + direction + dhikrList.length) % dhikrList.length;
        setDhikrIndex(newIndex);
        setCount(0); // Reset count when changing dhikr
    };

    const currentDhikr = dhikrList[dhikrIndex];
    const isGoalMet = currentDhikr.count !== Infinity && count >= currentDhikr.count;

    return (
        <div className="bg-primary text-primary min-h-full flex flex-col items-center justify-between p-4 pb-24">
            <header className="w-full flex justify-between items-center">
                 <h1 className="text-xl font-bold">Tasbeeh Counter</h1>
                 <button onClick={handleReset} className="p-2 rounded-full hover:bg-secondary">
                    <RefreshIcon className="w-6 h-6" />
                </button>
            </header>

            <main className="flex flex-col items-center justify-center flex-grow w-full">
                <div 
                    ref={counterRef}
                    onClick={handleIncrement}
                    className="relative w-72 h-72 sm:w-80 sm:h-80 bg-secondary rounded-full flex flex-col items-center justify-center cursor-pointer select-none shadow-lg transition-all duration-300 transform active:scale-95 overflow-hidden"
                >
                    {isGoalMet && <div className="absolute inset-0 bg-green-500/30"></div>}
                    <p className="text-8xl font-mono font-bold">{count}</p>
                    {currentDhikr.count !== Infinity && <p className="text-2xl text-secondary">/ {currentDhikr.count}</p>}
                    
                    {plusOneAnims.map(anim => (
                        <div key={anim.id} className="animate-plus-one text-2xl font-bold accent-text" style={{ left: `${anim.x}px`, top: `${anim.y}px` }}>+1</div>
                    ))}
                </div>
            </main>
            
            <footer className="w-full max-w-sm text-center">
                 <div className="flex items-center justify-between bg-secondary p-2 rounded-full">
                    <button onClick={() => changeDhikr(-1)} className="p-3 rounded-full hover:bg-tertiary">
                        <ChevronLeftIcon className="w-6 h-6 text-primary" />
                    </button>
                    <div className="flex-grow text-center">
                        <p className="text-lg font-semibold text-primary">{currentDhikr.text}</p>
                        <p className="font-amiri text-xl text-secondary">{currentDhikr.ar}</p>
                    </div>
                    <button onClick={() => changeDhikr(1)} className="p-3 rounded-full hover:bg-tertiary">
                        <ChevronRightIcon className="w-6 h-6 text-primary" />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Tasbeeh;