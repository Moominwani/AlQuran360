import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PrayerData } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, LocationIcon } from '../components/icons/MiscIcons';
import { useTimeFormat } from '../contexts/TimeFormatContext';

// The full list of times to fetch from API and for logic
const prayerApiOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
// The 5 main prayers to display in the list
const prayerUIRenderOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const prayerEmojiMap: { [key: string]: string } = {
  Fajr: '✨',
  Dhuhr: '☀️',
  Asr: '⛅️',
  Maghrib: '🌅',
  Isha: '🌙',
};

interface PrayerProps {
    dateOffset?: number;
}

interface City {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
}

const Prayer: React.FC<PrayerProps> = ({ dateOffset }) => {
    const [location, setLocation] = useState<{ city: string, latitude: number, longitude: number } | null>(null);
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(() => {
        const date = new Date();
        if (dateOffset) {
            date.setDate(date.getDate() + dateOffset);
        }
        return date;
    });
    const { timeFormat } = useTimeFormat();

    // State for new inline search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<City[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isAutoLocating, setIsAutoLocating] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const formatPrayerTime = useCallback((time24: string): string => {
        if (!time24) return '--:--';
        if (timeFormat === '24h') return time24;
        
        const [hour, minute] = time24.split(':');
        let h = parseInt(hour, 10);
        const period = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        return `${h}:${minute}${period}`;
    }, [timeFormat]);

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
        setPrayerData(null);
        setLoading(true);
    };

    const handleSelectCity = (city: City) => {
        handleLocationUpdate({
            city: city.name,
            latitude: city.latitude,
            longitude: city.longitude
        });
        setIsSearchFocused(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleUseCurrentLocation = () => {
        setIsAutoLocating(true);
        setSearchError(null);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village || 'Current Location';
                    handleLocationUpdate({ city, latitude, longitude });
                } catch (e) {
                     handleLocationUpdate({ city: 'Current Location', latitude, longitude });
                } finally {
                    setIsAutoLocating(false);
                    setIsSearchFocused(false);
                }
            },
            (err) => { 
                setSearchError(`Location Error: ${err.message}`);
                setIsAutoLocating(false);
            }
        );
    };


    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleDateChange = (offset: number) => {
        setPrayerData(null);
        setLoading(true);
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + offset);
            return newDate;
        });
    };

    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        const fetchCities = async () => {
            setSearchLoading(true);
            setSearchError(null);
            try {
                const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=10&language=en&format=json`);
                if (!response.ok) throw new Error("Could not fetch cities.");
                const data = await response.json();
                setSearchResults(data.results || []);
            } catch (err) {
                setSearchError(err instanceof Error ? err.message : 'An error occurred.');
            } finally {
                setSearchLoading(false);
            }
        };

        const debounce = setTimeout(fetchCities, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);


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
                    setError(err instanceof Error ? err.message : 'An an error occurred.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPrayerTimes();
        }
    }, [location, currentDate]);

    const { activePrayer, nextPrayer, nextPrayerTime, isToday, nextMainPrayer, nextMainPrayerCountdown } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const viewingDate = new Date(currentDate);
        viewingDate.setHours(0, 0, 0, 0);
        const viewingToday = today.getTime() === viewingDate.getTime();

        if (!prayerData?.meta?.timezone) {
            return { activePrayer: null, nextPrayer: null, nextPrayerTime: null, isToday: viewingToday, nextMainPrayer: null, nextMainPrayerCountdown: null };
        }
        
        if (!viewingToday) {
            return { activePrayer: null, nextPrayer: null, nextPrayerTime: null, isToday: viewingToday, nextMainPrayer: null, nextMainPrayerCountdown: null };
        }

        const prayerTimeZone = prayerData.meta.timezone;
        const now = new Date();
        
        // Use seconds for precision, matching Home.tsx
        const timeInLocation = now.toLocaleTimeString('en-GB', {
            timeZone: prayerTimeZone,
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hourCycle: 'h23'
        });
        const [nowHours, nowMinutes, nowSeconds] = timeInLocation.split(':').map(Number);
        const nowInSeconds = nowHours * 3600 + nowMinutes * 60 + nowSeconds;

        const prayerTimesInSeconds = prayerApiOrder.map(name => {
            if (!prayerData.timings[name]) return { name, timeInSeconds: 0 };
            const [h, m] = prayerData.timings[name].split(':').map(Number);
            return { name, timeInSeconds: h * 3600 + m * 60 };
        });

        // Find next event (includes Sunrise)
        let nextEventIndex = prayerTimesInSeconds.findIndex(p => p.timeInSeconds > nowInSeconds);
        const nextEvent = prayerTimesInSeconds[nextEventIndex === -1 ? 0 : nextEventIndex];

        // Find current main prayer period
        const mainPrayersInSeconds = prayerUIRenderOrder.map(name => prayerTimesInSeconds.find(p => p.name === name)!);
        
        // Find the last prayer time that has passed
        let activeMainPrayerName = 'Isha'; // Default to Isha (for time between Isha and Fajr)
        const passedMainPrayers = mainPrayersInSeconds.filter(p => p.timeInSeconds <= nowInSeconds);
        if (passedMainPrayers.length > 0) {
            activeMainPrayerName = passedMainPrayers[passedMainPrayers.length - 1].name;
        }

        // Find next main prayer for highlight and countdown
        let nextMainPrayerEvent = mainPrayersInSeconds.find(p => p.timeInSeconds > nowInSeconds);
        let nextMainPrayerName: string | null = null;
        let nextMainPrayerCountdownStr: string | null = null;

        if (nextMainPrayerEvent) {
            nextMainPrayerName = nextMainPrayerEvent.name;
            const diff = nextMainPrayerEvent.timeInSeconds - nowInSeconds;
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = Math.floor(diff % 60);
            if (hours > 0) {
                nextMainPrayerCountdownStr = `in ${hours}h ${minutes.toString().padStart(2, '0')}m`;
            } else {
                 nextMainPrayerCountdownStr = `in ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
            }
        } else { // After Isha
            nextMainPrayerName = 'Fajr';
            const fajrTimeInSeconds = mainPrayersInSeconds[0].timeInSeconds;
            const diff = (fajrTimeInSeconds + 24 * 3600) - nowInSeconds;
            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            nextMainPrayerCountdownStr = `in ${hours}h ${minutes.toString().padStart(2, '0')}m`;
        }

        return {
            activePrayer: activeMainPrayerName,
            nextPrayer: nextEvent.name,
            nextPrayerTime: formatPrayerTime(prayerData.timings[nextEvent.name]),
            isToday: true,
            nextMainPrayer: nextMainPrayerName,
            nextMainPrayerCountdown: nextMainPrayerCountdownStr,
        };
    }, [prayerData, currentTime, currentDate, formatPrayerTime]);
    
    return (
        <div className="bg-secondary text-primary min-h-full">
            <div className="p-4 max-w-lg mx-auto">
                 <div className="relative my-4">
                     <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary z-10" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            placeholder={location?.city || 'Change your location...'}
                            className="w-full bg-primary rounded-full py-3 pl-11 pr-4 text-primary placeholder-color shadow-sm border border-primary focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    {isSearchFocused && (
                        <>
                            <div className="fixed inset-0 z-10 bg-black/50" onClick={() => setIsSearchFocused(false)}></div>
                            <div className="absolute top-full mt-2 w-full bg-tertiary rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
                                <div className="p-2 border-b border-primary/20">
                                    <button onClick={handleUseCurrentLocation} disabled={isAutoLocating} className="w-full flex items-center space-x-3 text-left p-2 rounded-md hover:bg-secondary disabled:opacity-50">
                                        {isAutoLocating 
                                            ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                            : <LocationIcon className="w-5 h-5 accent-text" />
                                        }
                                        <span className="font-semibold text-primary">Use my current location</span>
                                    </button>
                                </div>
                                <div className="p-2">
                                    {searchLoading && <p className="text-center text-secondary p-2">Searching...</p>}
                                    {searchError && <p className="text-center text-red-400 p-2">{searchError}</p>}
                                    {searchResults.length > 0 ? (
                                        <ul className="space-y-1">
                                            {searchResults.map((city, index) => (
                                                <li key={index}>
                                                    <button onClick={() => handleSelectCity(city)} className="w-full text-left p-2 rounded-md hover:bg-secondary">
                                                        <p className="font-semibold text-primary">{city.name}</p>
                                                        <p className="text-sm text-secondary">{city.country}</p>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        !searchLoading && searchQuery.length >= 3 && <p className="text-center text-secondary p-2">No results found.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between my-4">
                    <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-tertiary"><ChevronLeftIcon className="w-6 h-6 text-secondary" /></button>
                    <div className="text-center">
                        <p className="font-semibold text-primary">{prayerData?.date.readable || '...'}</p>
                        <p className="text-secondary text-sm">{prayerData ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.en} ${prayerData.date.hijri.year}` : '...'}</p>
                    </div>
                    <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-tertiary"><ChevronRightIcon className="w-6 h-6 text-secondary" /></button>
                </div>

                {isToday && nextPrayer && (
                     <div className="text-center my-6 animate-fade-in">
                        <p className="text-2xl font-bold text-primary">{nextPrayer}</p>
                        <p className="text-secondary">Next prayer is at {nextPrayerTime}</p>
                    </div>
                )}
                
                {loading ? (
                    <div className="text-center p-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-secondary">Loading Times...</p>
                    </div>
                ) : error ? (
                    <div className="text-center p-10 text-red-500 bg-red-500/10 rounded-lg">
                        <p className="font-semibold">Error</p>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="space-y-3 mt-4 animate-fade-in">
                        {prayerUIRenderOrder.map(prayer => {
                            const isNextMainPrayer = isToday && prayer === nextMainPrayer;
                            
                            return (
                                <div key={prayer} className={`bg-primary rounded-xl p-4 flex items-center justify-between transition-all duration-300 ${isNextMainPrayer ? 'border-2 border-green-500 shadow-lg' : 'border-2 border-transparent'}`}>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xl">{prayerEmojiMap[prayer]}</span>
                                        <p className={`font-bold text-lg ${isNextMainPrayer ? 'text-green-500' : 'text-primary'}`}>{prayer}</p>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {isNextMainPrayer && nextMainPrayerCountdown && (
                                            <div className="text-sm font-semibold text-green-500">
                                                {nextMainPrayerCountdown}
                                            </div>
                                        )}
                                        <p className="font-bold text-lg w-24 text-right text-primary">
                                            {formatPrayerTime(prayerData?.timings[prayer])}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Prayer;