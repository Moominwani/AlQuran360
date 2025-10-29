import React, { useState, useEffect, useMemo } from 'react';
import { PrayerData } from '../types';
import LocationModal from '../components/LocationModal';
import { ChevronLeftIcon, ChevronRightIcon, FajrIcon, SunriseIcon, DhuhrIcon, AsrIcon, MaghribIcon, IshaIcon, LocationIcon } from '../components/icons/MiscIcons';
import { useTimeFormat } from '../contexts/TimeFormatContext';

const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const prayerIcons: { [key: string]: React.ElementType } = {
  Fajr: FajrIcon,
  Sunrise: SunriseIcon,
  Dhuhr: DhuhrIcon,
  Asr: AsrIcon,
  Maghrib: MaghribIcon,
  Isha: IshaIcon,
};

const Prayer: React.FC = () => {
    const [location, setLocation] = useState<{ city: string, latitude: number, longitude: number } | null>(null);
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const { timeFormat } = useTimeFormat();

    const formatPrayerTime = (time24: string): string => {
        if (timeFormat === '24h' || !time24) {
            return time24 || '';
        }
        const [hour, minute] = time24.split(':');
        let h = parseInt(hour, 10);
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minute} ${period}`;
    };

    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            setLocation(JSON.parse(savedLocation));
        } else {
            setError("Location not set. Please set a location.");
            setLoading(false);
        }
    }, []);

    const handleLocationUpdate = (newLocation: { city: string, latitude: number, longitude: number }) => {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        setLocation(newLocation);
        setIsLocationModalOpen(false);
        setPrayerData(null);
        setLoading(true);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handlePrevDay = () => {
        setPrayerData(null);
        setLoading(true);
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() - 1);
            return newDate;
        });
    };

    const handleNextDay = () => {
        setPrayerData(null);
        setLoading(true);
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + 1);
            return newDate;
        });
    };

    useEffect(() => {
        if (location) {
            const fetchPrayerTimes = async () => {
                setLoading(true);
                const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;
                try {
                    const response = await fetch(`https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${location.latitude}&longitude=${location.longitude}&method=3`);
                    if (!response.ok) throw new Error('Failed to fetch prayer times.');
                    const data = await response.json();
                    if (data.code === 200) {
                        setPrayerData(data.data);
                        setError(null);
                    } else {
                        setError(data.status);
                    }
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPrayerTimes();
        }
    }, [location, currentDate]);

    const { nextPrayer, timeToNextPrayer, isAfterIsha, passedPrayerNames, isToday } = useMemo(() => {
        if (!prayerData) return { nextPrayer: null, timeToNextPrayer: null, isAfterIsha: false, passedPrayerNames: [], isToday: false };

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const viewingDate = new Date(currentDate);
        viewingDate.setHours(0, 0, 0, 0);

        const viewingToday = today.getTime() === viewingDate.getTime();

        if (!viewingToday) {
            const firstPrayerName = prayerOrder[0]; // Fajr
            return {
                nextPrayer: { name: firstPrayerName, time: new Date() },
                timeToNextPrayer: null,
                isAfterIsha: false,
                passedPrayerNames: [],
                isToday: false,
            };
        }

        const todayStr = now.toISOString().slice(0, 10);
        const prayerTimesToday = prayerOrder.map(name => ({
            name,
            time: new Date(`${todayStr} ${prayerData.timings[name]}`),
        }));

        let nextPrayerIndex = prayerTimesToday.findIndex(p => p.time > now);
        let afterIsha = false;

        if (nextPrayerIndex === -1) {
            nextPrayerIndex = 0;
            afterIsha = true;
        }

        const passed = afterIsha ? prayerOrder : prayerOrder.slice(0, nextPrayerIndex);
        const nextPrayerDetails = prayerTimesToday[nextPrayerIndex];
        let nextPrayerTime = nextPrayerDetails.time;

        if (afterIsha) {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            nextPrayerTime = new Date(`${tomorrow.toISOString().slice(0, 10)} ${prayerData.timings.Fajr}`);
        }

        const diff = nextPrayerTime.getTime() - now.getTime();
        if (diff < 0) return { nextPrayer: nextPrayerDetails, timeToNextPrayer: null, isAfterIsha: afterIsha, passedPrayerNames: passed, isToday: true };
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        return {
            nextPrayer: nextPrayerDetails,
            timeToNextPrayer: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
            isAfterIsha: afterIsha,
            passedPrayerNames: passed,
            isToday: true,
        };
    }, [prayerData, currentTime, currentDate]);
    
    if (loading || (!prayerData && !error)) return <div className="flex items-center justify-center h-screen"><p>Loading prayer times...</p></div>;
    if (error && !location) return <div className="flex flex-col items-center justify-center h-screen"><p className="text-red-400">Error: {error}</p><button onClick={() => setIsLocationModalOpen(true)} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">Set Location</button></div>;
    
    return (
        <div className="px-4 flex flex-col h-screen bg-primary text-primary overflow-hidden">
            {isLocationModalOpen && <LocationModal onClose={() => setIsLocationModalOpen(false)} onLocationSet={handleLocationUpdate} />}

            <header className="pt-4 flex-shrink-0">
                <div className="text-center">
                    <h1 className="text-xl font-bold">Prayer Times</h1>
                    <button onClick={() => setIsLocationModalOpen(true)} className="flex items-center justify-center space-x-1 text-secondary mx-auto">
                        <LocationIcon className="w-4 h-4" />
                        <span>{location?.city || '...'}</span>
                    </button>
                </div>

                <div className="flex items-center justify-between text-sm my-2">
                    <button onClick={handlePrevDay} className="p-2 rounded-full hover:bg-secondary"><ChevronLeftIcon className="w-6 h-6 text-secondary" /></button>
                    <div className="text-center">
                        <span className="font-semibold">{prayerData?.date.readable}</span>
                        <p className="text-secondary text-xs">{prayerData?.date.hijri.day} {prayerData?.date.hijri.month.en}, {prayerData?.date.hijri.year} AH</p>
                    </div>
                    <button onClick={handleNextDay} className="p-2 rounded-full hover:bg-secondary"><ChevronRightIcon className="w-6 h-6 text-secondary" /></button>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center">
                <div className="w-full max-w-sm bg-secondary rounded-3xl p-3 text-center shadow-lg animate-fade-in-up border border-primary">
                    <p className="text-base font-semibold accent-text">{isToday ? "Next Prayer" : prayerData?.date.readable}</p>
                    <p className="text-2xl font-bold my-1 text-primary">{nextPrayer?.name || '...'}</p>
                    <p className="text-4xl font-mono tracking-tight text-primary">
                        {prayerData && nextPrayer ? formatPrayerTime(prayerData.timings[nextPrayer.name]) : '--:--'}
                    </p>
                    <p className="text-secondary text-sm mt-1 h-5">
                        {timeToNextPrayer ? `in ${timeToNextPrayer}` : ''}
                    </p>
                </div>
            </main>

            <footer className="flex-shrink-0 pb-2">
                <div className="space-y-1">
                    {prayerOrder.filter(p => p !== 'Sunrise').map(prayer => {
                        const PrayerIcon = prayerIcons[prayer];
                        const isNext = prayer === nextPrayer?.name && !isAfterIsha && isToday;
                        const hasPassed = passedPrayerNames.includes(prayer) && isToday && !isNext;

                        let cardClass = 'bg-secondary border-black';
                        let textClass = 'text-primary';
                        let timeClass = 'text-secondary';
                        let iconClass = 'text-secondary';

                        if (isNext) {
                            cardClass = 'bg-green-500 border-green-600 shadow-lg';
                            textClass = 'text-white';
                            timeClass = 'text-white/90';
                            iconClass = 'text-white';
                        } else if (hasPassed) {
                            cardClass = 'bg-secondary border-black opacity-60';
                        }

                        return (
                            <div key={prayer} className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-300 ${cardClass}`}>
                                <div className="flex items-center space-x-3">
                                    <PrayerIcon className={`w-5 h-5 transition-colors ${iconClass}`} />
                                    <p className={`font-semibold text-base transition-colors ${textClass}`}>{prayer}</p>
                                </div>
                                <p className={`font-mono text-base transition-colors ${timeClass}`}>
                                    {prayerData ? formatPrayerTime(prayerData.timings[prayer]) : '--:--'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </footer>
        </div>
    );
};

export default Prayer;