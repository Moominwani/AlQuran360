import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, RefreshIcon, PaletteIcon, SoundOnIcon, SoundOffIcon, PencilIcon } from '../components/icons/MiscIcons';
import { 
    Dhikr, 
    getTasbeehDhikrs, 
    saveTasbeehDhikr,
    saveAllTasbeehDhikrs,
    getLastSelectedDhikrId,
    saveLastSelectedDhikrId,
    getSetting,
    saveSetting
} from '../utils/db';

const defaultDhikrs: Dhikr[] = [
    { id: 'subhanallah', text: "SubhanAllah", ar: "سُبْحَانَ ٱللَّٰهِ", translation: "Glorified is Allah", count: 0, target: 33, rounds: 0 },
    { id: 'alhamdulillah', text: "Alhamdulillah", ar: "ٱلْحَمْدُ لِلَّٰهِ", translation: "Praise be to Allah", count: 0, target: 33, rounds: 0 },
    { id: 'allahuakbar', text: "Allahu Akbar", ar: "ٱللَّٰهُ أَكْبَرُ", translation: "Allah is the Greatest", count: 0, target: 33, rounds: 0 },
    { id: 'lailahaillallah', text: "La ilaha illallah", ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", translation: "There is no god but Allah", count: 0, target: 100, rounds: 0 },
];

const beadThemes = {
    green: 'from-green-400 to-teal-500',
    white: 'from-gray-200 to-gray-400',
    black: 'from-gray-700 to-gray-900',
    gold: 'from-yellow-400 to-amber-600',
};
type BeadTheme = keyof typeof beadThemes;
type BeadStatus = 'counted' | 'next' | 'future';

const beadSoundBase64 = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjQ1LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAAAAACAAAEEwB1cwBwAEBAQCARAACYAAAAAZFoABoAAAc9//////////////////8AAAAATGF2YzU4Ljc2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAACgAAAAAAD1eMAX/9kM05VN+dBD///2+ID3/lM05wB+dBD2/9voA9/5TNOcAPnQQ9v/b5APf+UzAAB+dBD4//b6APf+UzAAD50EPj/9voA9/5TMAAPnQQ+P/2+gD3/lMwAAedBD4//b6APf+UzAAB50EPj/9voA9/5TMAAHnQQ+P/2+gD3/lMwAAmdBD4//b6APf+UzAACZ0EPj/9voA9/5TMAAI7QQ+P/2+gD3/lMwAAjtBD4//b6APf+UzAAA50EPj/9voA9/5TMAADnQQ+P/2+gD3/lM0BAAedBD4//b6APf+UzAAB50EPj/9voA9/5TMAAPnQQ+P/2+gD3/lM0BAA+dBD4//b6APf+UzQEAD50EPj/9voA9/5TNAQAPnQQ+P/2+gD3/lMwBAA+dBD4//b6APf+UzAEAD50EPj/9voA9/5TMAYAPnQQ+P/2+gD3/lMwBgA+dBD4//b6APf+UzAeAD50EPj/9voA9/5TMBAAPnQQ+P/2+gD3/lMwEAA+dBD4//b6APf+UzACAD50EPj/9voA9/5TMAIAPnQQ+P/2+gD3/lM0AgA+dBD4//b6APf+UzQCACZ0EPj/9voA9/5TNAIAJnQQ+P/9voA9/5TNAIAJnQQ+P/2+gD3/lM0DgA50EPj/9voA9/5TMA4AOdBD4//b6APf+UzADgA50EPj/9voA9/5TMB4ACdBD4//b6APf+UzAeAAnQQ+P/2+gD3/lMwHgAJ0EPj/9voA9/5TMDIADtBD4//b6APf+UzAyAA7QQ+P/2+gD3/lMyMgAdBD4//b6APf+UzIyAB0EPj/9voA9/5TAQAAANBD4//b6APf+UzAQAAANBD4//b6APf+UzAQAAtBD4//b6APf+UzAQAAtBD4//b6APf+UzASAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9ZMQQAIAAAGgAAAAAv/7UMQdABgAINb//2/9/////f////////////3//2/9/+P/////f//f+v/////f//7/////9//9//////dAAAAA";
const BEAD_WIDTH = 96; // Corresponds to w-20 (80px) + px-2 on container (16px)

const Bead = React.memo(({ status, theme, yOffset }: { status: BeadStatus, theme: BeadTheme, yOffset: number }) => {
    const scale = status === 'next' ? 1.2 : (status === 'counted' ? 0.85 : 1);
    const opacity = status === 'counted' ? 0.5 : 1;
    const zIndex = status === 'next' ? 10 : 1;
    const brightness = status === 'counted' ? 'brightness(0.6)' : 'brightness(1)';
    const themeClass = beadThemes[theme];

    return (
        <div
            className="w-20 h-20 rounded-full transition-all duration-300 ease-out relative flex-shrink-0"
            style={{
                transform: `scale(${scale}) translateY(${yOffset}px)`,
                opacity,
                zIndex,
                filter: brightness,
            }}
        >
            <div
                className={`w-full h-full rounded-full bg-gradient-to-br ${themeClass} overflow-hidden shadow-lg`}
            >
                <div
                    className="absolute top-0 left-0 w-full h-full rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.8), rgba(255,255,255,0) 60%)',
                    }}
                ></div>
                <div
                    className="absolute top-4 left-4 w-3 h-3 rounded-full bg-white/50"
                    style={{ filter: 'blur(2px)' }}
                ></div>
                <div
                    className="absolute top-0 left-0 w-full h-full rounded-full"
                    style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)' }}
                ></div>
            </div>
        </div>
    );
});


const Tasbeeh: React.FC = () => {
    const [dhikrs, setDhikrs] = useState<Dhikr[]>([]);
    const [currentDhikrIndex, setCurrentDhikrIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [plusOneAnim, setPlusOneAnim] = useState(0);
    const [slideDirection, setSlideDirection] = useState<'right'|'left'|null>(null);
    
    const [isMuted, setIsMuted] = useState(false);
    const [beadTheme, setBeadTheme] = useState<BeadTheme>('green');

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const beadAudio = useMemo(() => {
        if (typeof Audio !== 'undefined') {
            const audio = new Audio(beadSoundBase64);
            audio.preload = 'auto';
            return audio;
        }
        return null;
    }, []);
    
    const currentDhikr = useMemo(() => dhikrs[currentDhikrIndex], [dhikrs, currentDhikrIndex]);

    useEffect(() => {
        const initialize = async () => {
            try {
                let existingDhikrs = await getTasbeehDhikrs();
                if (existingDhikrs.length === 0) {
                    await Promise.all(defaultDhikrs.map(d => saveTasbeehDhikr(d)));
                    existingDhikrs = defaultDhikrs;
                }
                setDhikrs(existingDhikrs);

                const lastId = await getLastSelectedDhikrId();
                const lastIndex = lastId ? existingDhikrs.findIndex(d => d.id === lastId) : -1;
                setCurrentDhikrIndex(lastIndex !== -1 ? lastIndex : 0);
                
                const savedMute = await getSetting<boolean>('tasbeehMuted');
                const savedTheme = await getSetting<BeadTheme>('tasbeehTheme');
                setIsMuted(savedMute ?? false);
                setBeadTheme(savedTheme ?? 'green');

            } catch (error) {
                console.error("Failed to initialize Tasbeeh:", error);
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, []);

    const saveCurrentDhikr = useCallback(() => {
        if (currentDhikr) {
            saveTasbeehDhikr(currentDhikr);
        }
    }, [currentDhikr]);

    useEffect(() => {
        const debounceSave = setTimeout(() => {
            saveCurrentDhikr();
        }, 500);
        return () => clearTimeout(debounceSave);
    }, [currentDhikr, saveCurrentDhikr]);
    
    const playBeadSound = useCallback(() => {
        if (isMuted || !beadAudio) return;
        beadAudio.currentTime = 0;
        beadAudio.play().catch(e => console.error("Could not play sound", e));
    }, [isMuted, beadAudio]);

    const handleIncrement = () => {
        if (!currentDhikr) return;
        let { count, target, rounds } = currentDhikr;

        if (count + 1 >= target) {
            count = 0;
            rounds += 1;
        } else {
            count += 1;
        }
        
        playBeadSound();
        setPlusOneAnim(Date.now());
        setDhikrs(prev => prev.map((d, i) => i === currentDhikrIndex ? { ...d, count, rounds } : d));
    };

    const handleDhikrChange = (direction: 1 | -1) => {
        setSlideDirection(direction > 0 ? 'left' : 'right');
        const newIndex = (currentDhikrIndex + direction + dhikrs.length) % dhikrs.length;
        setCurrentDhikrIndex(newIndex);
        saveLastSelectedDhikrId(dhikrs[newIndex].id);
    };
    
    const handleResetCurrent = () => {
        setDhikrs(prev => prev.map((d, i) => i === currentDhikrIndex ? { ...d, count: 0, rounds: 0 } : d));
        setIsResetModalOpen(false);
    };

    const handleResetAll = () => {
        const resetDhikrs = dhikrs.map(d => ({ ...d, count: 0, rounds: 0 }));
        setDhikrs(resetDhikrs);
        saveAllTasbeehDhikrs(resetDhikrs);
        setIsResetModalOpen(false);
    };

    const handleThemeSelect = (theme: BeadTheme) => {
        setBeadTheme(theme);
        saveSetting('tasbeehTheme', theme);
        setIsThemeModalOpen(false);
    };

    const handleSaveTarget = (newTarget: number) => {
        if (!currentDhikr) return;
        const updatedDhikr = { ...currentDhikr, target: newTarget };
        setDhikrs(prev => prev.map((d, i) => i === currentDhikrIndex ? updatedDhikr : d));
        saveTasbeehDhikr(updatedDhikr);
    };
    
    if (isLoading || !currentDhikr) {
        return <div className="bg-primary flex items-center justify-center min-h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    const beadCount = currentDhikr.target > 0 ? currentDhikr.target : 33;

    return (
        <div className="bg-primary text-primary h-screen flex flex-col items-center p-4 overflow-hidden" style={{ backgroundColor: '#121212' }}>
            <header className="w-full max-w-lg flex justify-between items-center z-10 text-white flex-shrink-0">
                <button onClick={() => window.history.back()}><ChevronLeftIcon className="w-6 h-6" /></button>
                <div className="text-center">
                    <h1 className="text-lg font-bold">Tasbih</h1>
                    <p className="text-sm opacity-70">{currentDhikrIndex + 1}/{dhikrs.length}</p>
                </div>
                <button onClick={() => setIsResetModalOpen(true)} className="p-2">
                    <RefreshIcon className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-1 w-full max-w-lg flex flex-col justify-between items-center mt-4 overflow-hidden">
                <div className="relative w-full h-36 rounded-2xl p-4 flex items-center justify-center overflow-hidden" style={{backgroundColor: '#4a4441'}}>
                     <button onClick={() => handleDhikrChange(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2"><ChevronLeftIcon className="w-6 h-6 text-white/50" /></button>
                     <div key={currentDhikr.id} className={`text-center text-white w-full ${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                        <p className="font-amiri text-2xl">{currentDhikr.ar}</p>
                        <p className="text-sm opacity-70 my-1 tracking-widest">{currentDhikr.text}</p>
                        <p className="text-sm opacity-90">{currentDhikr.translation}</p>
                     </div>
                     <button onClick={() => handleDhikrChange(1)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2"><ChevronRightIcon className="w-6 h-6 text-white/50" /></button>
                </div>
                
                <div className="text-center text-white my-4 relative">
                    {plusOneAnim ? <div key={plusOneAnim} className="absolute top-1/2 left-1/2 text-2xl font-bold text-green-400 animate-plus-one-pop">+1</div> : null}
                    <p className="text-6xl font-bold">{currentDhikr.count}<span className="text-3xl opacity-50">/{currentDhikr.target}</span></p>
                    <p className="text-sm opacity-70">Rounds: {currentDhikr.rounds}</p>
                </div>

                <div onClick={handleIncrement} className="w-full h-48 flex-shrink-0 relative cursor-pointer flex items-center justify-center overflow-hidden">
                    <div
                        className="flex items-center absolute left-1/2 transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(calc(-${currentDhikr.count * BEAD_WIDTH}px))` }}
                    >
                        {Array.from({ length: beadCount }).map((_, i) => {
                            const status: BeadStatus = i < currentDhikr.count ? 'counted' : (i === currentDhikr.count ? 'next' : 'future');
                            const distanceFromCenter = Math.abs(i - currentDhikr.count);
                            const yOffset = - (distanceFromCenter * distanceFromCenter * 0.4);

                            return (
                               <div key={i} className="flex-shrink-0 flex items-center justify-center relative px-2" style={{width: `${BEAD_WIDTH}px`}}>
                                   <Bead status={status} theme={beadTheme} yOffset={yOffset} />
                               </div>
                            );
                        })}
                    </div>
                </div>
            </main>
            
            <footer className="w-full max-w-lg mx-auto p-4 flex justify-between items-center z-20 flex-shrink-0">
                 <button onClick={() => setIsThemeModalOpen(true)} className="w-14 h-14 rounded-xl flex items-center justify-center" style={{backgroundColor: '#2a2a2a'}}>
                    <PaletteIcon className="w-7 h-7 text-white" />
                 </button>
                 <button onClick={() => { setIsMuted(!isMuted); saveSetting('tasbeehMuted', !isMuted); }} className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#2a2a2a'}}>
                    {isMuted ? <SoundOffIcon className="w-5 h-5 text-white" /> : <SoundOnIcon className="w-5 h-5 text-white" />}
                </button>
                 <button onClick={() => setIsEditModalOpen(true)} className="w-14 h-14 rounded-xl flex items-center justify-center" style={{backgroundColor: '#2a2a2a'}}>
                    <PencilIcon className="w-7 h-7 text-white" />
                 </button>
            </footer>
            
            <ResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onResetCurrent={handleResetCurrent} onResetAll={handleResetAll} />
            <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} onSelect={handleThemeSelect} currentTheme={beadTheme} />
            <EditDhikrModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} dhikr={currentDhikr} onSave={handleSaveTarget} />
        </div>
    );
};

const Modal: React.FC<{isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string}> = ({isOpen, onClose, children, title}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end animate-fade-in" onClick={onClose}>
            <div className="w-full rounded-t-2xl p-4 text-white" style={{backgroundColor: '#2a2a2a'}} onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4"></div>
                <h2 className="text-lg font-bold text-center mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
};

const ResetModal: React.FC<{isOpen: boolean, onClose: () => void, onResetCurrent: () => void, onResetAll: () => void}> = ({isOpen, onClose, onResetCurrent, onResetAll}) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Counter">
        <div className="space-y-2">
            <button onClick={onResetCurrent} className="w-full p-3 bg-white/10 rounded-lg text-center font-semibold">Reset current counter</button>
            <button onClick={onResetAll} className="w-full p-3 bg-white/10 rounded-lg text-center font-semibold text-red-400">Reset all counters</button>
            <button onClick={onClose} className="w-full p-3 mt-2 bg-white/10 rounded-lg text-center font-bold">Cancel</button>
        </div>
    </Modal>
);

const ThemeModal: React.FC<{isOpen: boolean, onClose: () => void, onSelect: (theme: BeadTheme) => void, currentTheme: BeadTheme}> = ({isOpen, onClose, onSelect, currentTheme}) => (
     <Modal isOpen={isOpen} onClose={onClose} title="Select Bead Color">
        <div className="grid grid-cols-2 gap-4 p-4">
            {(Object.keys(beadThemes) as BeadTheme[]).map(theme => (
                <div key={theme} className="flex flex-col items-center" onClick={() => onSelect(theme)}>
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${beadThemes[theme]} border-4 ${currentTheme === theme ? 'border-white' : 'border-transparent'}`}></div>
                    <p className="mt-2 capitalize">{theme}</p>
                </div>
            ))}
        </div>
    </Modal>
);

const EditDhikrModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    dhikr: Dhikr;
    onSave: (newTarget: number) => void;
}> = ({ isOpen, onClose, dhikr, onSave }) => {
    const [target, setTarget] = useState(dhikr.target);
    const presetTargets = [33, 99, 100, 1000];

    useEffect(() => {
        if (dhikr) {
            setTarget(dhikr.target);
        }
    }, [dhikr]);

    const handleSave = () => {
        const newTarget = parseInt(String(target), 10);
        if (!isNaN(newTarget) && newTarget > 0) {
            onSave(newTarget);
            onClose();
        }
    };

    if (!isOpen || !dhikr) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Set Target for ${dhikr.text}`}>
            <div className="p-4 space-y-4">
                <label htmlFor="dhikrTarget" className="text-sm text-white/70">
                    Set a new target count. When you reach this number, the counter will reset and a round will be added.
                </label>

                <div className="flex justify-center space-x-2 my-4">
                    {presetTargets.map(preset => (
                        <button
                            key={preset}
                            onClick={() => setTarget(preset)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${target === preset ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                <input
                    id="dhikrTarget"
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full bg-white/10 rounded-lg p-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                />
                <div className="flex space-x-2">
                    <button onClick={onClose} className="w-full p-3 bg-white/10 rounded-lg text-center font-bold">Cancel</button>
                    <button onClick={handleSave} className="w-full p-3 bg-green-500 rounded-lg text-center font-bold text-white">Save</button>
                </div>
            </div>
        </Modal>
    );
};


export default Tasbeeh;