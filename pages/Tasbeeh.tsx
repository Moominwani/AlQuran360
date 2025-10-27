import React, { useState, useEffect } from 'react';

const DhikrButton: React.FC<{ text: string, count: string, onClick: () => void }> = ({ text, count, onClick }) => (
    <button onClick={onClick} className="w-full flex justify-between items-center py-2 text-left text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
        <span>{text}</span>
        <span className="text-sm text-gray-400">{count}</span>
    </button>
);

const Tasbeeh: React.FC = () => {
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33);
    const [totalCount, setTotalCount] = useState(0);
    const [completed, setCompleted] = useState(0);

    useEffect(() => {
        if (count > 0 && count === target) {
            setCompleted(prev => prev + 1);
            setCount(0);
        }
    }, [count, target]);

    const handleIncrement = () => {
        setCount(prev => prev + 1);
        setTotalCount(prev => prev + 1);
    };

    const handleReset = () => {
        setCount(0);
        setTotalCount(0);
        setCompleted(0);
    };
    
    const handleTargetChange = (newTarget: number) => {
        setTarget(newTarget);
        setCount(0);
    }

    const commonDhikr = [
        { text: "SubhanAllah", count: "33x", target: 33 },
        { text: "Alhamdulillah", count: "33x", target: 33 },
        { text: "Allahu Akbar", count: "33x", target: 33 },
    ];

    return (
        <div className="p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold my-4">Tasbeeh Counter</h1>

            <div className="w-full max-w-sm bg-gray-100 dark:bg-[#1a4538] rounded-2xl p-6 text-center my-4">
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-4">
                    <svg className="absolute inset-0" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" strokeWidth="5" className="stroke-gray-200 dark:stroke-[#143d31]" />
                        <circle 
                            cx="50" cy="50" r="45" fill="none" stroke="#34d399" strokeWidth="5" 
                            strokeDasharray={`${(count / target) * 282.7}, 282.7`} 
                            strokeLinecap="round" transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dasharray 0.3s ease' }}
                        />
                    </svg>
                    <div className="z-10">
                        <p className="text-5xl font-bold">{count}</p>
                        <p className="text-gray-500 dark:text-gray-400">of {target}</p>
                    </div>
                </div>
                <button 
                    onClick={handleIncrement}
                    className="w-20 h-20 bg-yellow-400 text-[#143d31] rounded-full flex items-center justify-center text-4xl font-bold shadow-lg transform active:scale-95 transition-transform"
                >
                    +
                </button>
            </div>
            
            <div className="w-full max-w-sm grid grid-cols-2 gap-4 text-center my-4">
                <div className="bg-gray-100 dark:bg-[#1a4538] p-4 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Count</p>
                    <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                 <div className="bg-gray-100 dark:bg-[#1a4538] p-4 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold">{completed}</p>
                </div>
            </div>

            <div className="w-full max-w-sm my-4">
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {[33, 99, 100].map(t => (
                        <button 
                            key={t}
                            onClick={() => handleTargetChange(t)}
                            className={`py-2 rounded-lg font-semibold transition ${target === t ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-[#1a4538] text-gray-600 dark:text-gray-300'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={handleReset}
                    className="w-full py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-semibold transition"
                >
                    Reset
                </button>
            </div>
            
            <div className="w-full max-w-sm bg-gray-100 dark:bg-[#1a4538] p-4 rounded-xl my-4">
                <h3 className="font-bold mb-2">Common Dhikr</h3>
                <div className="divide-y divide-gray-300 dark:divide-gray-700">
                    {commonDhikr.map(dhikr => (
                        <DhikrButton 
                            key={dhikr.text} 
                            text={dhikr.text} 
                            count={dhikr.count} 
                            onClick={() => handleTargetChange(dhikr.target)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Tasbeeh;