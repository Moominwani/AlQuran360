import React, { useState, useEffect, useMemo } from 'react';
import TopBar from '../components/TopBar';
import LocationModal from '../components/LocationModal';
import { PrayerData } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, FajrIcon, SunriseIcon, DhuhrIcon, AsrIcon, MaghribIcon, IshaIcon } from '../contexts/MiscIcons';

const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const prayerIcons: { [key: string]: React.ElementType } = {
  Fajr: FajrIcon,
  Sunrise: SunriseIcon,
  Dhuhr: DhuhrIcon,
  Asr: AsrIcon,
  Maghrib: MaghribIcon,
  Isha: IshaIcon,
};

interface HomeProps {
    onOpenAbout: () => void;
    onOpenSettings: () => void;
}

const Home: React.FC<HomeProps> = ({ onOpenAbout, onOpenSettings }) => {
    const [location, setLocation] = useState<{ city: string, latitude: number, longitude: number } | null>(null);
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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
        // Refetch prayer times for new location
        setPrayerData(null);
        setLoading(true);
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (location) {
            const fetchPrayerTimes = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${location.latitude}&longitude=${location.longitude}&method=2`);
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
    }, [location]);

    const { currentPrayer, nextPrayer, timeToNextPrayer } = useMemo(() => {
        if (!prayerData) return { currentPrayer: null, nextPrayer: null, timeToNextPrayer: '00:00:00' };

        const now = new Date();
        let nextPrayerName: string | null = null;
        let currentPrayerName: string | null = null;
        let nextPrayerTime: Date | null = null;
        
        const todayStr = now.toISOString().slice(0, 10);

        const sortedPrayers = prayerOrder
            .map(name => ({ name, time: new Date(`${todayStr} ${prayerData.timings[name]}`) }))
            .sort((a, b) => a.time.getTime() - b.time.getTime());

        for (let i = 0; i < sortedPrayers.length; i++) {
            if (sortedPrayers[i].time > now) {
                nextPrayerName = sortedPrayers[i].name;
                nextPrayerTime = sortedPrayers[i].time;
                currentPrayerName = i > 0 ? sortedPrayers[i-1].name : sortedPrayers[sortedPrayers.length-1].name;
                break;
            }
        }

        if (!nextPrayerName) { // After Isha, next prayer is Fajr of next day
            nextPrayerName = 'Fajr';
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().slice(0, 10);
            nextPrayerTime = new Date(`${tomorrowStr} ${prayerData.timings.Fajr}`);
            currentPrayerName = 'Isha';
        }
         
        let diff = (nextPrayerTime ? nextPrayerTime.getTime() - now.getTime() : 0);
        const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        diff %= (1000 * 60 * 60);
        const minutes = Math.floor(diff / (1000 * 60)).toString().padStart(2, '0');
        diff %= (1000 * 60);
        const seconds = Math.floor(diff / 1000).toString().padStart(2, '0');

        return {
            currentPrayer: currentPrayerName,
            nextPrayer: nextPrayerName,
            timeToNextPrayer: `${hours}:${minutes}:${seconds}`,
        };
    }, [prayerData, currentTime]);
    
    if (loading) return <div className="flex items-center justify-center h-screen"><p>Loading prayer times...</p></div>;
    if (error && !location) return <div className="flex flex-col items-center justify-center h-screen"><p className="text-red-400">Error: {error}</p><button onClick={() => setIsLocationModalOpen(true)} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">Set Location</button></div>;

    return (
        <div className="p-4">
            <TopBar 
                location={location?.city || "Set Location"} 
                onLocationClick={() => setIsLocationModalOpen(true)}
                onOpenAbout={onOpenAbout}
                onOpenSettings={onOpenSettings}
            />
            
            {isLocationModalOpen && <LocationModal onClose={() => setIsLocationModalOpen(false)} onLocationSet={handleLocationUpdate} />}

            <div className="text-center my-8">
                <h2 className="text-4xl font-bold">{currentPrayer || 'Loading...'}</h2>
                <p className="text-8xl font-light tracking-tighter my-2">
                    {prayerData && currentPrayer ? prayerData.timings[currentPrayer].split(':')[0] : '00'}:
                    <span className="font-bold">{prayerData && currentPrayer ? prayerData.timings[currentPrayer].split(':')[1] : '00'}</span>
                    <span className="text-5xl align-top ml-2">PM</span>
                </p>
                <p className="text-secondary">Next prayer in {timeToNextPrayer}</p>
            </div>

            <div className="flex items-center justify-between text-sm my-6">
                <ChevronLeftIcon className="w-6 h-6 text-secondary" />
                <div>
                    <span className="font-semibold">{prayerData?.date.readable}</span>
                    <span className="text-secondary"> • {prayerData?.date.hijri.day} {prayerData?.date.hijri.month.en}, {prayerData?.date.hijri.year} AH</span>
                </div>
                <ChevronRightIcon className="w-6 h-6 text-secondary" />
            </div>

            <div className="bg-secondary rounded-2xl p-4 space-y-2">
                {prayerOrder.map(prayer => {
                    const PrayerIcon = prayerIcons[prayer];
                    const isActive = prayer === currentPrayer;
                    return (
                        <div key={prayer} className={`flex items-center justify-between p-3 rounded-lg transition-all ${isActive ? 'bg-tertiary accent-border border' : ''}`}>
                            <div className="flex items-center space-x-4">
                                <PrayerIcon className={`w-5 h-5 ${isActive ? 'accent-text' : 'text-secondary'}`} />
                                <span className="font-medium">{prayer}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="font-mono text-lg">{prayerData?.timings[prayer]}</span>
                                <div className="w-5 h-5 border-2 border-secondary rounded"></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Home;
