import React, { useState, useEffect, useMemo } from 'react';
import { PrayerData } from '../types';
import LocationModal from '../components/LocationModal';
import { ChevronLeftIcon, ChevronRightIcon, FajrIcon, SunriseIcon, DhuhrIcon, AsrIcon, MaghribIcon, IshaIcon } from '../contexts/MiscIcons';
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
        h = h % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${String(h).padStart(2, '0')}:${minute} ${period}`;
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

    const currentPrayer = useMemo(() => {
        if (!prayerData) return null;

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const viewingDate = new Date(currentDate);
        viewingDate.setHours(0, 0, 0, 0);

        if (today.getTime() !== viewingDate.getTime()) return null;

        const todayStr = now.toISOString().slice(0, 10);
        const prayerTimesToday = prayerOrder.map(name => ({
            name,
            time: new Date(`${todayStr} ${prayerData.timings[name]}`),
        }));

        let nextPrayerIndex = prayerTimesToday.findIndex(p => p.time > now);
        
        if (nextPrayerIndex === -1) { // After Isha
            return 'Isha';
        }
        return nextPrayerIndex > 0 ? prayerTimesToday[nextPrayerIndex - 1].name : 'Isha';

    }, [prayerData, currentTime, currentDate]);
    
    if (loading || !prayerData) return <div className="flex items-center justify-center h-screen"><p>Loading prayer times...</p></div>;
    if (error && !location) return <div className="flex flex-col items-center justify-center h-screen"><p className="text-red-400">Error: {error}</p><button onClick={() => setIsLocationModalOpen(true)} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">Set Location</button></div>;
    
    return (
        <div className="p-4">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">Prayer Times</h1>
            </div>
            
            {isLocationModalOpen && <LocationModal onClose={() => setIsLocationModalOpen(false)} onLocationSet={handleLocationUpdate} />}

            <div className="flex items-center justify-between text-sm my-6">
                <button onClick={handlePrevDay} className="p-2"><ChevronLeftIcon className="w-6 h-6 text-secondary" /></button>
                <div className="text-center">
                    <span className="font-semibold">{prayerData?.date.readable}</span>
                    <span className="text-secondary"> • {prayerData?.date.hijri.day} {prayerData?.date.hijri.month.en}, {prayerData?.date.hijri.year} AH</span>
                </div>
                <button onClick={handleNextDay} className="p-2"><ChevronRightIcon className="w-6 h-6 text-secondary" /></button>
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
                                <span className="font-mono text-lg">{prayerData ? formatPrayerTime(prayerData.timings[prayer]) : ''}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Prayer;