import React, { useState, useEffect, useMemo } from 'react';
import TopBar from '../TopBar';
import LocationModal from '../components/LocationModal';
import { Page, PrayerData } from '../types';
import { useTimeFormat } from '../contexts/TimeFormatContext';
import { QuranIcon } from '../components/icons/NavIcons';
import { AzkarIcon, NearbyMosqueIcon, QiblaCompassIcon, TasbihIcon, PrayerManIcon, LocationIcon } from '../components/icons/MiscIcons';

const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

interface HomeProps {
    onNavigate: (page: Page) => void;
}

const QuickActionButton: React.FC<{ Icon: React.ElementType; label: string; onClick?: () => void }> = ({ Icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center space-y-2 text-primary">
        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
            <Icon className="w-8 h-8 accent-text" />
        </div>
        <span className="text-sm font-medium">{label}</span>
    </button>
);


const Home: React.FC<HomeProps> = ({ onNavigate }) => {
    const [location, setLocation] = useState<{ city: string, latitude: number, longitude: number } | null>(null);
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const { timeFormat } = useTimeFormat();

    const formatPrayerTime = (time24: string): string => {
        if (timeFormat === '24h' || !time24) return time24 || '';
        const [hour, minute] = time24.split(':');
        let h = parseInt(hour, 10);
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minute}${period}`;
    };

    useEffect(() => {
        // This component only renders after a location is set by LocationManager,
        // so we can safely assume it exists in localStorage.
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            setLocation(JSON.parse(savedLocation));
        } else {
            // This is a fallback case, shouldn't normally be reached.
            setError("Location not found. Please restart the app.");
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

    useEffect(() => {
        if (location) {
            const fetchPrayerTimes = async () => {
                setLoading(true);
                const date = new Date();
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
                try {
                    const response = await fetch(`https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${location.latitude}&longitude=${location.longitude}&method=3`);
                    if (!response.ok) throw new Error('Failed to fetch prayer times.');
                    const data = await response.json();
                    setPrayerData(data.code === 200 ? data.data : null);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An error occurred.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPrayerTimes();
        }
    }, [location]);

    const { timeToNextPrayer, prayerForMainDisplay } = useMemo(() => {
        if (!prayerData?.meta?.timezone) return { timeToNextPrayer: null, prayerForMainDisplay: null };

        const prayerTimeZone = prayerData.meta.timezone;
        const now = new Date();
        
        // Use toLocaleTimeString for robust, timezone-aware time fetching.
        const timeInLocation = now.toLocaleTimeString('en-GB', {
            timeZone: prayerTimeZone,
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hourCycle: 'h23'
        });

        const [nowHours, nowMinutes, nowSeconds] = timeInLocation.split(':').map(Number);
        const nowInSeconds = nowHours * 3600 + nowMinutes * 60 + nowSeconds;

        const prayerTimesInSeconds = prayerOrder.map(name => {
            if (!prayerData.timings[name]) return { name, timeInSeconds: 0 };
            const [h, m] = prayerData.timings[name].split(':').map(Number);
            return { name, timeInSeconds: h * 3600 + m * 60 };
        });

        let nextPrayerIndex = prayerTimesInSeconds.findIndex(p => p.timeInSeconds > nowInSeconds);

        let diff;
        let nextPrayerName;

        if (nextPrayerIndex === -1) {
            // After Isha, next prayer is Fajr tomorrow
            nextPrayerName = prayerTimesInSeconds[0].name;
            const fajrTomorrowInSeconds = prayerTimesInSeconds[0].timeInSeconds + (24 * 3600);
            diff = fajrTomorrowInSeconds - nowInSeconds;
        } else {
            nextPrayerName = prayerTimesInSeconds[nextPrayerIndex].name;
            diff = prayerTimesInSeconds[nextPrayerIndex].timeInSeconds - nowInSeconds;
        }
        
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = Math.floor(diff % 60);

        let timeString;
        if (hours > 0) {
            timeString = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
        } else {
            timeString = `${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
        }
        
        return {
            timeToNextPrayer: timeString,
            prayerForMainDisplay: nextPrayerName,
        };
    }, [prayerData, currentTime]);

    const mainPrayerTime = prayerData && prayerForMainDisplay ? formatPrayerTime(prayerData.timings[prayerForMainDisplay]) : '--:--';

    return (
        <div className="pb-8 relative">
            <TopBar 
              title="AlQuran360"
            />
            
            <div className="px-4 pt-2 pb-3">
                 <button 
                    onClick={() => setIsLocationModalOpen(true)} 
                    className="flex items-center space-x-1 text-secondary hover:text-primary transition-colors duration-200"
                >
                    <LocationIcon className="w-4 h-4" />
                    <span className="font-medium text-sm">{location?.city || 'Set Location'}</span>
                 </button>
            </div>
            
            {isLocationModalOpen && <LocationModal onClose={() => setIsLocationModalOpen(false)} onLocationSet={handleLocationUpdate} />}

            <div className="px-4 space-y-6">
                <button 
                    onClick={() => onNavigate(Page.Prayer)}
                    className="w-full text-left rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 text-white p-6 shadow-lg relative overflow-hidden animate-fade-in-up">
                    <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">{prayerData?.date.hijri.day} {prayerData?.date.hijri.month.en}, {prayerData?.date.hijri.year} AH</p>
                    </div>
                    <div className="my-4">
                        <p className="text-xl font-semibold">{prayerForMainDisplay || '...'}</p>
                        <p className="text-6xl font-bold tracking-tight">{mainPrayerTime}</p>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            {timeToNextPrayer && <p className="text-sm opacity-90">Next prayer in {timeToNextPrayer}</p>}
                            <p className="text-sm font-semibold mt-2">Tap to view more prayer times</p>
                        </div>
                    </div>
                    <PrayerManIcon className="absolute -bottom-4 -right-2 w-36 h-36 opacity-20" />
                </button>

                <div className="grid grid-cols-5 gap-2 text-center">
                    <QuickActionButton Icon={QuranIcon} label="Quran" onClick={() => onNavigate(Page.Quran)} />
                    <QuickActionButton Icon={AzkarIcon} label="Azkar" />
                    <QuickActionButton Icon={NearbyMosqueIcon} label="Nearby Mo" />
                    <QuickActionButton Icon={QiblaCompassIcon} label="Qibla" onClick={() => onNavigate(Page.Qibla)} />
                    <QuickActionButton Icon={TasbihIcon} label="Tasbih" onClick={() => onNavigate(Page.Tasbeeh)} />
                </div>
            </div>
        </div>
    );
};

export default Home;