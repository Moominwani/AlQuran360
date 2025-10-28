import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KaabaIcon, LayFlatIcon, CalibrationIcon } from '../components/icons/QiblaIcons';

// Constants
const KAABA_COORDS = { lat: 21.4225, lon: 39.8262 };
const HEADING_SMOOTHING = 0.1; // Lower is smoother but slower
const ALIGNMENT_THRESHOLD = 5; // Degrees within which it's considered "aligned"
const FLAT_THRESHOLD = 15; // Degrees for beta/gamma to be considered "flat"

// --- Utility Functions ---
function toRadians(degrees: number): number { return degrees * (Math.PI / 180); }
function toDegrees(radians: number): number { return radians * (180 / Math.PI); }

function calculateQiblaDirection(userLat: number, userLon: number): number {
    const lat1 = toRadians(userLat);
    const lon1 = toRadians(userLon);
    const lat2 = toRadians(KAABA_COORDS.lat);
    const lon2 = toRadians(KAABA_COORDS.lon);
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
}

const Qibla: React.FC = () => {
    const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
    const [heading, setHeading] = useState<number | null>(null);
    const [isFlat, setIsFlat] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [needsPermission, setNeedsPermission] = useState(false);
    const [screenOrientation, setScreenOrientation] = useState(window.screen?.orientation?.angle || 0);
    const isAlignedRef = useRef(false);

    // Get user location from local storage
    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            const { latitude, longitude } = JSON.parse(savedLocation);
            if (latitude && longitude) {
                setQiblaDirection(calculateQiblaDirection(latitude, longitude));
            } else {
                 setError("Invalid location data. Please set your location again from the Home page.");
            }
        } else {
            setError("Location not found. Please set your location from the Home page.");
        }
    }, []);

    // Handle screen orientation changes to correct `alpha` heading
    useEffect(() => {
        if (!window.screen?.orientation) return;
        const handleScreenOrientationChange = () => {
            setScreenOrientation(window.screen.orientation.angle);
        };
        window.screen.orientation.addEventListener('change', handleScreenOrientationChange);
        return () => {
            window.screen.orientation.removeEventListener('change', handleScreenOrientationChange);
        };
    }, []);

    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        // --- 1. Get corrected heading ---
        let newHeading: number | null = null;
        if (typeof (event as any).webkitCompassHeading !== 'undefined') {
            // Use iOS-specific property which is more reliable
            newHeading = (event as any).webkitCompassHeading;
        } else if (event.alpha !== null) {
            // For other devices, use alpha and correct for screen orientation
            newHeading = (event.alpha + screenOrientation) % 360;
        }

        if (newHeading === null) return;

        // --- 2. Smooth the heading value to reduce jitter ---
        setHeading(prevHeading => {
            if (prevHeading === null) return newHeading;
            // A simple low-pass filter for smoother rotation
            let diff = newHeading! - prevHeading;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            return prevHeading + diff * HEADING_SMOOTHING;
        });

        // --- 3. Check if device is held flat ---
        const beta = event.beta || 0;
        const gamma = event.gamma || 0;
        setIsFlat(Math.abs(beta) < FLAT_THRESHOLD && Math.abs(gamma) < FLAT_THRESHOLD);
    }, [screenOrientation]);

    const requestPermission = useCallback(async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
            setError("Your browser does not support compass access.");
            return;
        }
        try {
            const permissionState = await (DeviceOrientationEvent as any).requestPermission();
            if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation, true);
                setNeedsPermission(false);
            } else {
                setError('Compass permission denied. You can grant it in your browser settings.');
            }
        } catch (err) {
            setError('Error requesting compass permission.');
        }
    }, [handleOrientation]);
    
    // Setup and teardown for device orientation listener
    useEffect(() => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            setNeedsPermission(true);
        } else {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, [handleOrientation]);
    
    const isAligned = heading !== null && qiblaDirection !== null && Math.abs(heading - qiblaDirection) < ALIGNMENT_THRESHOLD;
    
    // Vibrate when alignment is first achieved
    useEffect(() => {
        const currentlyAligned = isAligned && isFlat;
        if (currentlyAligned && !isAlignedRef.current) {
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        }
        isAlignedRef.current = currentlyAligned;
    }, [isAligned, isFlat]);
    
    // --- Render Logic ---
    const renderInstruction = () => {
        if (heading === null && !needsPermission) {
            return (
                <div className="flex flex-col items-center space-y-2 animate-fade-in">
                    <CalibrationIcon className="w-10 h-10 text-secondary" />
                    <p className="font-medium text-lg">Calibrating...</p>
                    <p className="text-sm text-secondary">Move your device in a figure 8 pattern.</p>
                </div>
            );
        }
        if (!isFlat) {
            return (
                <div className="flex flex-col items-center space-y-2 text-yellow-400 animate-pulse">
                    <LayFlatIcon className="w-10 h-10"/>
                    <span className="font-medium text-lg">Please lay your phone flat</span>
                </div>
            );
        }
        if (isAligned) {
             return <p className="text-2xl font-bold accent-text animate-fade-in">Qibla Found!</p>;
        }
        return (
            <div className="text-center text-primary">
                <p className="font-semibold text-lg">Rotate your phone</p>
                <p className="text-sm text-secondary">Align the Kaaba icon with the top pointer.</p>
            </div>
        );
    }

    const renderContent = () => {
        if (error) {
            return <div className="text-center text-red-500 p-4 bg-tertiary rounded-lg">{error}</div>;
        }
        if (needsPermission) {
            return (
                <div className="flex flex-col items-center justify-center flex-grow text-center p-4">
                    <button onClick={requestPermission} className="px-6 py-3 accent-bg text-inverted font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity">
                        Enable Compass
                    </button>
                    <p className="text-sm text-secondary mt-3 max-w-xs">To find the Qibla, we need access to your device's motion sensors.</p>
                </div>
            );
        }
        if (qiblaDirection === null) {
            return null; // Should be caught by the error state.
        }
        return (
            <div className="flex flex-col items-center justify-around flex-grow animate-fade-in w-full max-w-sm mx-auto">
                <div className="h-24 flex items-center justify-center text-center px-4">
                    {renderInstruction()}
                </div>

                <div className="relative w-80 h-80 flex items-center justify-center">
                    {/* Top static pointer */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-500" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))', transform: `translateX(-50%) scale(${isAligned && isFlat ? 1.2 : 1})` }}>
                        <div className={`w-0 h-0 border-l-[14px] border-r-[14px] border-b-[21px] border-l-transparent border-r-transparent transition-colors duration-500 ${isAligned && isFlat ? 'border-b-green-500' : 'border-b-primary'}`}></div>
                    </div>

                    {/* Rotating Part */}
                    <div
                        className="relative w-full h-full rounded-full transition-transform duration-200 ease-out"
                        style={{ transform: `rotate(${-(heading || 0)}deg)` }}
                    >
                        <div className={`w-full h-full rounded-full bg-secondary transition-all duration-500 p-2 border-4 ${isAligned && isFlat ? 'border-green-500 shadow-[0_0_25px_rgba(16,185,129,0.7)]' : 'border-transparent'}`}>
                             <div className="relative w-full h-full bg-tertiary rounded-full flex items-center justify-center text-primary overflow-hidden">
                                {Array.from({ length: 120 }).map((_, i) => (
                                    <div key={`tick-${i}`} className="absolute w-full h-full" style={{transform: `rotate(${i * 3}deg)`}}>
                                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-secondary ${i % 15 === 0 ? 'w-1 h-4' : 'w-0.5 h-2'}`}></div>
                                    </div>
                                ))}

                                {['N', 'E', 'S', 'W'].map((dir, i) => (
                                    <div key={dir} className="absolute w-full h-full" style={{transform: `rotate(${i * 90}deg)`}}>
                                        <span className={`absolute top-5 left-1/2 -translate-x-1/2 text-xl font-bold ${dir === 'N' ? 'accent-text' : 'text-secondary'}`}>{dir}</span>
                                    </div>
                                ))}
                                
                                <div className="absolute w-full h-full" style={{transform: `rotate(${qiblaDirection}deg)`}}>
                                    <div className={`absolute top-5 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center transition-transform duration-500 ${isAligned && isFlat ? 'scale-125' : ''}`}>
                                        <KaabaIcon className="w-10 h-10" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-2xl font-mono text-secondary">
                    {qiblaDirection !== null ? `${Math.round(qiblaDirection)}°` : '--°'}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-primary text-primary min-h-full flex flex-col p-4">
            <h1 className="text-xl font-bold text-center my-2">Qibla Finder</h1>
            <div className="flex-grow flex items-center justify-center">
                {renderContent()}
            </div>
        </div>
    );
};

export default Qibla;
