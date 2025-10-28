import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getPrayer, savePrayer, getSettings, saveSettings, getAllPrayers, deletePrayer, SettingsData } from '../utils/db';

// --- Type Definitions ---
// These types are now internal to the component and the DB utility.
export interface Prayer {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
}

export interface UserData {
    id: string;
    count: number;
    rounds: number;
    goal: number;
    dailyGoal: number; 
    dailyCount: number; 
    dailyGoalMet: boolean; 
    totalCount: number; 
    lastCountedDate: string; 
}

type ModalAction = 'resetCount' | 'resetRounds' | 'setGoal' | 'deleteDhikr' | 'setDailyGoal' | null;

interface PrayerStats {
    id: string;
    transliteration: string;
    totalCount: number;
    isCustom: boolean;
}

interface ColorOption {
    id: string;
    name: string;
    type: 'plain' | 'pattern';
    style: React.CSSProperties;
}

// --- App Constants ---
const DEFAULT_GOAL = 33;
const DEFAULT_DAILY_GOAL = 100; 
const SWIPE_THRESHOLD = 50; 
const BEAD_DISTANCE = 60; 

const COLOR_OPTIONS: ColorOption[] = [
    { id: 'emerald_metallic', name: 'Emerald Metallic', type: 'pattern', style: { background: 'linear-gradient(145deg, #34d399 10%, #059669 90%)', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.3)' } },
    { id: 'royal_gold', name: 'Royal Gold', type: 'pattern', style: { background: 'linear-gradient(145deg, #FFD700 10%, #B8860B 90%)', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.4)' } },
    { id: 'deep_ocean', name: 'Deep Ocean', type: 'pattern', style: { background: 'linear-gradient(145deg, #4F46E5 10%, #1E3A8A 90%)', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.3)' } },
    { id: 'ruby_red', name: 'Ruby Red', type: 'pattern', style: { background: 'linear-gradient(145deg, #F87171 10%, #B91C1C 90%)', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.3)' } },
    { id: 'solid_black', name: 'Solid Black', type: 'plain', style: { background: '#111827', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.1)' } },
    { id: 'solid_white', name: 'Solid White', type: 'plain', style: { background: '#F9FAFB', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(0, 0, 0, 0.1)', border: '1px solid #ccc' } },
    { id: 'solid_purple', name: 'Solid Purple', type: 'plain', style: { background: '#8B5CF6', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.3)' } },
];
const DEFAULT_BEAD_STYLE = COLOR_OPTIONS[0].id;

const PRAYERS: Prayer[] = [
  { id: 'subhana_allah', arabic: 'سُبْحَانَ ٱللَّٰهِ', transliteration: 'Subḥāna Allāh', english: 'Glorified is Allah' },
  { id: 'alhamdulillah', arabic: 'اَلْحَمْدُ لِلَّٰهِ', transliteration: 'Alḥamdu lillāh', english: 'All praise is due to God' },
  { id: 'allahu_akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ', transliteration: 'Allāhu Akbar', english: 'Allah is the greatest' },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ', transliteration: 'Astaghfiru Allāh', english: 'I seek forgiveness from God' },
  { id: 'la_ilaha_illallah', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', transliteration: 'Lā ilāha illā Allāh', english: 'There is no god but Allah' },
];

const getTodayDate = () => new Date().toISOString().split('T')[0];
const hapticFeedback = (isEnabled: boolean) => { if (isEnabled && navigator.vibrate) navigator.vibrate(30); };

// --- Child Components ---
const PlusOneEffect: React.FC<{ isVisible: boolean }> = React.memo(({ isVisible }) => (
    <div className={`absolute accent-text font-bold text-3xl transition-all duration-500 ease-out`} style={{ left: '1.5rem', bottom: '1rem', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(-30px)' : 'translateY(0)', pointerEvents: 'none' }}>+1</div>
));

const StatsDashboard: React.FC<{ allPrayers: Prayer[]; isLoading: boolean; customPrayers: Prayer[] }> = React.memo(({ allPrayers, isLoading, customPrayers }) => {
    const [stats, setStats] = useState<PrayerStats[]>([]);
    const [globalTotal, setGlobalTotal] = useState<number>(0);
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setIsStatsLoading(true);
        try {
            const prayerDocs = await getAllPrayers();
            let totalOverall = 0;
            const fetchedStats: PrayerStats[] = prayerDocs.map(doc => {
                const totalCount = doc.totalCount ?? 0;
                totalOverall += totalCount;
                const prayer = allPrayers.find(p => p.id === doc.id);
                return {
                    id: doc.id,
                    transliteration: prayer?.transliteration || `Custom Dhikr`,
                    totalCount: totalCount,
                    isCustom: doc.id.startsWith('custom_')
                };
            }).sort((a, b) => b.totalCount - a.totalCount);
            setStats(fetchedStats);
            setGlobalTotal(totalOverall);
        } catch (e) { console.error("Error fetching all prayer stats:", e); } 
        finally { setIsStatsLoading(false); }
    }, [allPrayers]);

    useEffect(() => { fetchStats(); }, [fetchStats, isLoading]);

    if (isStatsLoading) return <div className="p-6 bg-secondary rounded-xl shadow-2xl text-center accent-text"><p className="animate-pulse">Loading Progress Data...</p></div>;

    return (
        <div className="p-6 bg-secondary rounded-xl shadow-2xl w-full max-w-md mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-center text-primary border-b border-primary pb-3">Your Dhikr Progress</h2>
            <div className="flex justify-around text-center border-b border-primary pb-4">
                {[{ value: globalTotal.toLocaleString(), label: 'Lifetime Total' }, { value: PRAYERS.length, label: 'Default Dhikr' }, { value: customPrayers.length, label: 'Custom Saved' }].map(stat => (
                    <div key={stat.label} className="flex flex-col items-center"><span className="text-3xl font-extrabold accent-text">{stat.value}</span><span className="text-sm text-secondary">{stat.label}</span></div>
                ))}
            </div>
            <h3 className="text-xl font-semibold text-primary">Top Chants</h3>
            <div className="space-y-2">
                {stats.slice(0, 3).map((stat, index) => (
                    <div key={stat.id} className="flex justify-between items-center p-3 bg-tertiary rounded-lg"><span className="text-sm text-secondary mr-2">#{index + 1}</span><span className="text-md font-medium text-primary flex-1 truncate">{stat.transliteration}</span><span className="text-lg font-bold accent-text">{stat.totalCount.toLocaleString()}</span></div>
                ))}
                {stats.length > 3 && <div className="text-center text-sm text-secondary pt-2">...and {stats.length - 3} more.</div>}
                {stats.length === 0 && <div className="text-center text-secondary py-4">Start counting to see your progress here!</div>}
            </div>
        </div>
    );
});

// --- Tasbeeh Component ---
const Tasbeeh: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [count, setCount] = useState<number>(0);
  const [rounds, setRounds] = useState<number>(1);
  const [goal, setGoal] = useState<number>(DEFAULT_GOAL);
  const [dailyGoal, setDailyGoal] = useState<number>(DEFAULT_DAILY_GOAL); 
  const [dailyCount, setDailyCount] = useState<number>(0); 
  const [dailyGoalMet, setDailyGoalMet] = useState<boolean>(false); 
  const [prayerIndex, setPrayerIndex] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0); 
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHapticEnabled, setIsHapticEnabled] = useState<boolean>(true); 
  const [activeTab, setActiveTab] = useState<'counter' | 'stats'>('counter'); 
  const [customPrayers, setCustomPrayers] = useState<Prayer[]>([]);
  const [isDhikrModalVisible, setIsDhikrModalVisible] = useState(false);
  const [newDhikrArabic, setNewDhikrArabic] = useState('');
  const [newDhikrTransliteration, setNewDhikrTransliteration] = useState('');
  const [newDhikrEnglish, setNewDhikrEnglish] = useState('');
  const [beadStyle, setBeadStyle] = useState<string>(DEFAULT_BEAD_STYLE);
  const [isColorModalVisible, setIsColorModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [showPlusOne, setShowPlusOne] = useState(false); 
  const [customGoalInput, setCustomGoalInput] = useState<string>(DEFAULT_GOAL.toString());
  const [customDailyGoalInput, setCustomDailyGoalInput] = useState<string>(DEFAULT_DAILY_GOAL.toString()); 

  const audioContextRef = useRef<AudioContext | null>(null); 
  const beadChainRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchendX = useRef<number>(0);
  const settingsRef = useRef<SettingsData | null>(null);

  const allPrayers = useMemo(() => [...PRAYERS, ...customPrayers], [customPrayers]);
  const currentPrayer = allPrayers[prayerIndex];
  const isCustomPrayer = currentPrayer?.id?.startsWith('custom_');

  const playClickSound = useCallback(() => {
    if (isMuted) return; 
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode); gainNode.connect(audioContext.destination);
        oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(150, audioContext.currentTime); 
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.05);
        oscillator.start(); oscillator.stop(audioContext.currentTime + 0.05);
    } catch (e) { console.warn("Could not play sound:", e); }
  }, [isMuted]);

  // Load all data from IndexedDB on initial mount
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        const settings = await getSettings();
        if (settings) {
            settingsRef.current = settings;
            setCustomPrayers(settings.customPrayers || []);
            setBeadStyle(settings.beadStyle || DEFAULT_BEAD_STYLE);
        } else {
            // Initialize settings if they don't exist
            const newSettings = { id: 'userSettings', customPrayers: [], beadStyle: DEFAULT_BEAD_STYLE };
            settingsRef.current = newSettings;
            await saveSettings(newSettings);
        }
        setIsLoading(false); // Data is loaded, now prayer-specific data will trigger its own load
    };
    loadData();
  }, []);
  
  // This effect loads the specific data for the currently selected prayer
  useEffect(() => {
    if (isLoading || !currentPrayer) return; // Don't load until initial settings are loaded

    const loadPrayerData = async () => {
        const data = await getPrayer(currentPrayer.id);
        const today = getTodayDate();
        if (data) {
            const isNewDay = data.lastCountedDate !== today;
            setCount(isNewDay ? 0 : data.count ?? 0);
            setRounds(isNewDay ? 1 : data.rounds ?? 1);
            setGoal(data.goal ?? DEFAULT_GOAL);
            setDailyGoal(data.dailyGoal ?? DEFAULT_DAILY_GOAL);
            setDailyCount(isNewDay ? 0 : data.dailyCount ?? 0);
            setDailyGoalMet(isNewDay ? false : data.dailyGoalMet ?? false);
            setTotalCount(data.totalCount ?? 0);
        } else {
            // Reset to defaults if no data exists for this prayer
            setCount(0); setRounds(1); setGoal(DEFAULT_GOAL); setDailyGoal(DEFAULT_DAILY_GOAL);
            setDailyCount(0); setDailyGoalMet(false); setTotalCount(0);
        }
    };
    loadPrayerData();
  }, [currentPrayer?.id, isLoading]);

  const saveBeadStyle = useCallback(async (newStyleId: string) => {
    setBeadStyle(newStyleId);
    if (settingsRef.current) {
        const newSettings = { ...settingsRef.current, beadStyle: newStyleId };
        settingsRef.current = newSettings;
        await saveSettings(newSettings);
    }
  }, []);

  const updateBeadPosition = useCallback(() => {
    if (beadChainRef.current) beadChainRef.current.style.transform = `translateX(${-(count * BEAD_DISTANCE)}px)`;
  }, [count]);

  useEffect(() => { updateBeadPosition(); }, [count, updateBeadPosition]);
  
  const incrementCounter = useCallback(async () => {
    if (isLoading || !currentPrayer) return; 
    hapticFeedback(isHapticEnabled); playClickSound(); 
    setShowPlusOne(true); setTimeout(() => setShowPlusOne(false), 500);
    
    let nextCount = count + 1;
    let nextRounds = rounds;
    if (nextCount > goal) { nextCount = 1; nextRounds = rounds + 1; }
    const nextDailyCount = dailyCount + 1; 
    const nextDailyGoalMet = nextDailyCount >= dailyGoal; 
    
    // Update state immediately for UI responsiveness
    setCount(nextCount); setRounds(nextRounds);
    setTotalCount(prev => prev + 1); setDailyCount(nextDailyCount); setDailyGoalMet(nextDailyGoalMet);

    // Persist to DB
    const currentData = await getPrayer(currentPrayer.id) || {};
    const prayerDataToSave: UserData = {
        id: currentPrayer.id,
        count: nextCount, rounds: nextRounds, goal: goal, dailyGoal: dailyGoal,
        dailyCount: nextDailyCount, dailyGoalMet: nextDailyGoalMet,
        totalCount: (currentData.totalCount || 0) + 1,
        lastCountedDate: getTodayDate(),
    };
    await savePrayer(prayerDataToSave);
  }, [count, rounds, goal, dailyCount, dailyGoal, prayerIndex, isLoading, playClickSound, currentPrayer, isHapticEnabled]);

  const navigatePrayer = useCallback((direction: 'next' | 'prev') => {
    if (allPrayers.length === 0) return;
    const newIndex = (prayerIndex + (direction === 'next' ? 1 : -1) + allPrayers.length) % allPrayers.length;
    setPrayerIndex(newIndex);
  }, [prayerIndex, allPrayers.length]);

  const addCustomDhikr = useCallback(async () => {
      if (!newDhikrArabic.trim() || !settingsRef.current) return;
      const newPrayer: Prayer = { id: `custom_${Date.now()}`, arabic: newDhikrArabic.trim(), transliteration: newDhikrTransliteration.trim() || 'Custom Dhikr', english: newDhikrEnglish.trim() || 'Custom Dhikr' };
      const newCustomPrayers = [...customPrayers, newPrayer];
      
      const newSettings = { ...settingsRef.current, customPrayers: newCustomPrayers };
      settingsRef.current = newSettings;
      await saveSettings(newSettings);
      
      setCustomPrayers(newCustomPrayers);
      setPrayerIndex(allPrayers.length);
      setIsDhikrModalVisible(false);
      setNewDhikrArabic(''); setNewDhikrTransliteration(''); setNewDhikrEnglish('');
  }, [customPrayers, newDhikrArabic, newDhikrTransliteration, newDhikrEnglish, allPrayers.length]);

  const deleteCustomDhikr = useCallback(async () => {
      if (!currentPrayer || !isCustomPrayer || !settingsRef.current) return;
      const prayerIdToDelete = currentPrayer.id;
      const newCustomPrayers = customPrayers.filter(p => p.id !== prayerIdToDelete);

      const newSettings = { ...settingsRef.current, customPrayers: newCustomPrayers };
      settingsRef.current = newSettings;
      await saveSettings(newSettings);
      await deletePrayer(prayerIdToDelete);
      
      setCustomPrayers(newCustomPrayers);
      setPrayerIndex(0); 
      hideConfirmModal();
  }, [customPrayers, currentPrayer, isCustomPrayer]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => { if (activeTab === 'counter') touchStartX.current = event.changedTouches[0].screenX; };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => { if (activeTab === 'counter') { touchendX.current = event.changedTouches[0].screenX; handleGesture(); } };
  const handleGesture = () => { if (touchendX.current - touchStartX.current > SWIPE_THRESHOLD) incrementCounter(); touchStartX.current = 0; touchendX.current = 0; };
  const showConfirmModal = (action: ModalAction) => {
    if (!action || (action === 'resetCount' && count === 0) || (action === 'resetRounds' && rounds === 1 && count === 0) || (action === 'deleteDhikr' && !isCustomPrayer)) return; 
    setModalAction(action); setIsModalVisible(true);
    if (action === 'setGoal') setCustomGoalInput(goal.toString());
    else if (action === 'setDailyGoal') setCustomDailyGoalInput(dailyGoal.toString());
  };
  const hideConfirmModal = () => { setIsModalVisible(false); setModalAction(null); };

  const executeConfirmedAction = async () => {
    if (!modalAction || !currentPrayer) return;
    const prayerId = currentPrayer.id;
    if (modalAction === 'deleteDhikr') { await deleteCustomDhikr(); return; }
    
    const currentData = await getPrayer(prayerId) || { id: prayerId };
    let dataToSave: Partial<UserData> = {};

    if (modalAction === 'resetCount') { setCount(0); dataToSave = { count: 0 }; }
    else if (modalAction === 'resetRounds') { setCount(0); setRounds(1); dataToSave = { count: 0, rounds: 1 }; }
    else if (modalAction === 'setGoal') { const n = parseInt(customGoalInput, 10); if (n > 0) { setGoal(n); setCount(0); setRounds(1); dataToSave = { goal: n, count: 0, rounds: 1 }; } }
    else if (modalAction === 'setDailyGoal') { const n = parseInt(customDailyGoalInput, 10); if (n > 0) { setDailyGoal(n); dataToSave = { dailyGoal: n, dailyGoalMet: dailyCount >= n }; } }

    // FIX: Explicitly add the `id` to the object to satisfy the type constraints of `savePrayer`.
    await savePrayer({ ...currentData, ...dataToSave, id: prayerId });
    hideConfirmModal();
  };
  
  const currentBeadStyleObject = useMemo(() => (COLOR_OPTIONS.find(o => o.id === beadStyle) || COLOR_OPTIONS[0]).style, [beadStyle]);
  const beads = useMemo(() => Array.from({ length: goal + 10 }).map((_, index) => <div key={index} className="bead w-[70px] h-[70px] min-w-[70px] min-h-[70px] rounded-full relative z-10 mr-[-10px]" style={currentBeadStyleObject} />), [goal, currentBeadStyleObject]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-primary"><div className="accent-text text-xl animate-pulse">Loading Tasbeeh...</div></div>;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:pt-10">
      <style>{`
        .tasbeeh-body { font-family: 'Inter', sans-serif; }
        .arabic-text { font-family: 'Amiri', serif; font-size: 2.5rem; color: var(--color-primary); line-height: 1.2; }
        .bead-chain { transition: transform 0.15s ease-out; }
        .custom-modal { transition: opacity 0.3s ease-in-out; pointer-events: none; z-index: 50; }
        .custom-modal.show { opacity: 1; pointer-events: auto; }
        .goal-option { flex: 1 1 30%; min-width: 80px; padding: 10px; border-radius: 8px; background-color: var(--bg-tertiary); color: var(--color-primary); font-weight: 600; text-align: center; cursor: pointer; transition: all 0.2s; }
        .goal-option:hover { background-color: var(--bg-secondary); }
        .goal-option.selected { background-color: var(--color-accent); color: var(--color-inverted); box-shadow: 0 0 10px var(--color-accent); }
        .color-preview { width: 40px; height: 40px; border-radius: 50%; cursor: pointer; border: 2px solid var(--color-primary); transition: transform 0.1s; }
        .color-preview:hover { transform: scale(1.05); }
        .color-preview.selected { border-color: var(--color-accent); border-width: 4px; box-shadow: 0 0 10px var(--color-accent); }
      `}</style>
      <div className="w-full max-w-md flex flex-col items-center space-y-8 relative pt-4 tasbeeh-body"> 
        <div className="absolute top-0 w-full flex justify-between px-2 z-20">
            {[ { label: isHapticEnabled ? "Disable Haptic Feedback" : "Enable Haptic Feedback", onClick: () => setIsHapticEnabled(p => !p), icon: isHapticEnabled ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11v6m16-6v6M7 14v2m10-2v2m-7-2v4m4-4v4"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11v6m16-6v6M7 14v2m10-2v2m-7-2v4m4-4v4M2 2l20 20"></path></svg> }, { label: isMuted ? "Unmute Sound" : "Mute Sound", onClick: () => setIsMuted(p => !p), icon: isMuted ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="22" y1="9" x2="16.5" y2="15"></line><line x1="16.5" y1="9" x2="22" y2="15"></line></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> }
            ].map(btn => <button key={btn.label} className="p-3 rounded-full bg-tertiary hover:bg-secondary transition text-primary" onClick={btn.onClick} aria-label={btn.label}>{btn.icon}</button>)}
        </div>

        <div className="w-full flex p-1 bg-tertiary rounded-xl mt-16 shadow-inner max-w-sm">
            <button className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'counter' ? 'accent-bg text-inverted shadow-md' : 'text-secondary hover:text-primary'}`} onClick={() => setActiveTab('counter')}>Counter</button>
            <button className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${activeTab === 'stats' ? 'accent-bg text-inverted shadow-md' : 'text-secondary hover:text-primary'}`} onClick={() => setActiveTab('stats')}>Stats</button>
        </div>
        
        {activeTab === 'counter' && (
            <>
                <div className="w-full p-6 rounded-xl shadow-2xl bg-secondary relative"> 
                    {isCustomPrayer && <button className="absolute top-3 right-3 p-2 rounded-full bg-red-700/50 hover:bg-red-700 transition text-white z-10" onClick={() => showConfirmModal('deleteDhikr')} aria-label="Delete Custom Dhikr"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>}
                    <button className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-tertiary/50 hover:bg-tertiary transition text-primary" onClick={() => navigatePrayer('prev')} aria-label="Previous Prayer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg></button>
                    <div className="text-center space-y-3 px-8">
                        <div className="text-sm text-secondary font-medium">Prayer {prayerIndex + 1} of {allPrayers.length}</div>
                        <div className="arabic-text">{currentPrayer?.arabic || '...'}</div>
                        <div className="text-lg text-secondary font-semibold border-b border-primary pb-2">{currentPrayer?.transliteration || 'Loading Dhikr...'}</div>
                        <div className="text-md text-primary">{currentPrayer?.english || '...'}</div>
                    </div>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-tertiary/50 hover:bg-tertiary transition text-primary" onClick={() => navigatePrayer('next')} aria-label="Next Prayer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg></button>
                    <button className="absolute bottom-3 right-3 p-2 rounded-full bg-tertiary/50 hover:bg-tertiary transition text-primary z-10" onClick={() => setIsDhikrModalVisible(true)} aria-label="Add Custom Dhikr"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                </div>
                
                <div className="w-full flex justify-between items-center bg-tertiary p-3 rounded-lg shadow-md">
                    <div className="flex items-center space-x-2">
                        {dailyGoalMet ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="accent-text" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9 12l2 2 4-4"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path></svg>}
                        <span className="text-sm font-medium text-primary">Daily Target:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${dailyGoalMet ? 'accent-text' : 'text-yellow-300'}`}>{dailyCount}</span>
                        <span className="text-secondary">/{dailyGoal}</span>
                        <button className="text-secondary hover:accent-text transition" onClick={() => showConfirmModal('setDailyGoal')} aria-label="Set Daily Goal"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V4m5 5l-5-5-5 5"></path></svg></button>
                    </div>
                </div>

                <div className="w-full flex justify-between items-end text-primary px-4 relative">
                    <div><span className="font-extrabold text-[3.5rem] accent-text">{count}</span><span className="text-2xl text-secondary">/{goal}</span></div>
                    <div className="text-xl text-primary font-medium text-right">Rounds: <span className="font-bold accent-text block">{rounds}</span><span className="text-sm text-secondary pt-1 block">Lifetime: {totalCount.toLocaleString()}</span></div>
                    <PlusOneEffect isVisible={showPlusOne} />
                </div>

                <div id="interactionArea" className="w-full cursor-pointer relative active:opacity-90" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={incrementCounter}>
                    <div className="w-full overflow-hidden h-[100px] relative">
                        <div className="bead-chain-line absolute w-full h-1 bg-tertiary top-1/2 -translate-y-1/2 z-0"></div>
                        <div ref={beadChainRef} className="bead-chain flex items-center pt-[15px] pb-[15px] pl-[20px]">
                            {beads}
                        </div>
                    </div>
                    <div className='flex justify-center items-center space-x-4 mt-4'>
                        <p className="text-center text-secondary text-sm">Click or swipe right to count</p>
                        <button className="p-2 rounded-full bg-tertiary hover:bg-secondary transition text-primary" onClick={() => setIsColorModalVisible(true)} aria-label="Customize Bead Colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM3 21v-4l4-4 4 4v4m8 0v-4l4-4 4 4v4"></path></svg></button>
                    </div>
                </div>

                <div className="flex space-x-4 w-full justify-center pt-4">
                    <button className="px-4 py-3 bg-red-700 text-white font-semibold rounded-lg shadow-lg hover:bg-red-600 transition" onClick={() => showConfirmModal('resetCount')}>Reset Count</button>
                    <button className="px-4 py-3 bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-600 transition" onClick={() => showConfirmModal('setGoal')}>Set Cycle ({goal})</button>
                    <button className="px-4 py-3 bg-tertiary text-primary font-semibold rounded-lg shadow-lg hover:bg-secondary transition" onClick={() => showConfirmModal('resetRounds')}>Reset All</button>
                </div>
            </>
        )}
        {activeTab === 'stats' && <StatsDashboard allPrayers={allPrayers} customPrayers={customPrayers} isLoading={isLoading} />}
      </div>
    
      <div className={`custom-modal fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center ${isModalVisible ? 'show' : 'opacity-0'}`}>
        <div className="bg-secondary p-6 rounded-xl shadow-2xl max-w-xs w-full">
          {(modalAction === 'setGoal' || modalAction === 'setDailyGoal') ? (
            <div className="space-y-4">
                <p className="text-primary text-lg font-bold text-center">{modalAction === 'setGoal' ? 'Adjust Cycle Goal' : 'Set Daily Target'}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {(modalAction === 'setGoal' ? [33, 99, 100] : [100, 500, 1000]).map(val => <div key={val} className={`goal-option ${(modalAction === 'setGoal' ? customGoalInput : customDailyGoalInput) === val.toString() ? 'selected' : ''}`} onClick={() => modalAction === 'setGoal' ? setCustomGoalInput(val.toString()) : setCustomDailyGoalInput(val.toString())}>{val}</div>)}
                </div>
                <input type="number" value={modalAction === 'setGoal' ? customGoalInput : customDailyGoalInput} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) { modalAction === 'setGoal' ? setCustomGoalInput(v) : setCustomDailyGoalInput(v); } }} onBlur={(e) => { if (e.target.value === '' || parseInt(e.target.value, 10) === 0) { modalAction === 'setGoal' ? setCustomGoalInput(DEFAULT_GOAL.toString()) : setCustomDailyGoalInput(DEFAULT_DAILY_GOAL.toString()); } }} placeholder="Custom Goal" className="w-full p-3 bg-tertiary text-primary border-none rounded-lg text-center font-mono focus:ring-2 focus:ring-green-500" />
                <div className="flex justify-around space-x-4 pt-2"><button className="flex-1 px-4 py-2 bg-tertiary text-primary rounded-lg font-semibold" onClick={hideConfirmModal}>Cancel</button><button className="flex-1 px-4 py-2 accent-bg text-inverted rounded-lg font-semibold" onClick={executeConfirmedAction}>Done</button></div>
            </div>
          ) : (
            <>
                <p className="text-primary text-lg mb-4 text-center font-semibold">{modalAction === 'resetCount' ? 'Reset current count to zero?' : modalAction === 'resetRounds' ? 'Reset count and rounds for this prayer?' : modalAction === 'deleteDhikr' ? `Permanently delete "${currentPrayer?.transliteration}" and all its data?` : ''}</p>
                <div className="flex justify-around space-x-4"><button className="flex-1 px-4 py-2 bg-tertiary text-primary rounded-lg font-semibold" onClick={hideConfirmModal}>Cancel</button><button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold" onClick={executeConfirmedAction}>{modalAction === 'deleteDhikr' ? 'Delete' : 'Confirm'}</button></div>
            </>
          )}
        </div>
      </div>
      
      <div className={`custom-modal fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center ${isDhikrModalVisible ? 'show' : 'opacity-0'}`}>
        <div className="bg-secondary p-6 rounded-xl shadow-2xl max-w-xs w-full">
            <h3 className="text-primary text-xl font-bold mb-4 text-center">Add Custom Dhikr</h3>
            <div className="space-y-4">
                <input type="text" placeholder="Arabic Text (Required)" value={newDhikrArabic} onChange={(e) => setNewDhikrArabic(e.target.value)} className="w-full p-3 bg-tertiary text-primary rounded-lg text-right arabic-text" style={{ fontFamily: 'Amiri, serif', direction: 'rtl', fontSize: '1.5rem' }} />
                <input type="text" placeholder="Transliteration" value={newDhikrTransliteration} onChange={(e) => setNewDhikrTransliteration(e.target.value)} className="w-full p-3 bg-tertiary text-primary rounded-lg" />
                <input type="text" placeholder="English Meaning" value={newDhikrEnglish} onChange={(e) => setNewDhikrEnglish(e.target.value)} className="w-full p-3 bg-tertiary text-primary rounded-lg" />
            </div>
            <div className="flex justify-around space-x-4 pt-6">
                <button className="flex-1 px-4 py-2 bg-tertiary text-primary rounded-lg font-semibold" onClick={() => setIsDhikrModalVisible(false)}>Cancel</button>
                <button className={`flex-1 px-4 py-2 text-inverted rounded-lg font-semibold ${newDhikrArabic.trim() ? 'accent-bg' : 'bg-green-900 opacity-50 cursor-not-allowed'}`} onClick={addCustomDhikr} disabled={!newDhikrArabic.trim()}>Add Dhikr</button>
            </div>
        </div>
      </div>
      
      <div className={`custom-modal fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center ${isColorModalVisible ? 'show' : 'opacity-0'}`}>
        <div className="bg-secondary p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-primary text-xl font-bold mb-4 text-center">Customize Bead Color</h3>
            {['pattern', 'plain'].map(type => (
                <div key={type} className='mb-6'>
                    <h4 className='text-primary font-semibold mb-2 capitalize'>{type}ed Colors</h4>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {COLOR_OPTIONS.filter(o => o.type === type).map(option => (
                            <div key={option.id} className='text-center'>
                                <div className={`color-preview ${beadStyle === option.id ? 'selected' : ''}`} style={option.style} onClick={() => saveBeadStyle(option.id)} aria-label={option.name}></div>
                                <span className='text-xs text-secondary mt-1 block'>{option.name.split(' ')[type === 'pattern' ? 0 : 1]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button className="mt-6 w-full px-4 py-2 accent-bg text-inverted rounded-lg font-semibold" onClick={() => setIsColorModalVisible(false)}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Tasbeeh;