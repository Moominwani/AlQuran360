import React, { useState, useEffect } from 'react';
import LocationModal from './LocationModal';

interface LocationManagerProps {
    onLocationSet: () => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ onLocationSet }) => {
    const [showManualModal, setShowManualModal] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [permissionState, setPermissionState] = useState<'loading' | 'prompt' | 'granted' | 'denied'>('loading');
    const [error, setError] = useState<string | null>(null);

    const handleAllow = () => {
        setIsLocating(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village || 'Current Location';
                    localStorage.setItem('userLocation', JSON.stringify({ city, latitude, longitude }));
                    onLocationSet();
                } catch (e) {
                    localStorage.setItem('userLocation', JSON.stringify({ city: 'Current Location', latitude, longitude }));
                    onLocationSet();
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => { 
                setIsLocating(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setError("Location access was denied. Please set your city manually or enable permissions in your device/browser settings.");
                    setPermissionState('denied');
                } else if (err.code === err.TIMEOUT) {
                    setError("Could not determine your location in time. Please try again or set it manually.");
                } else {
                    setError("An error occurred while fetching your location. Please set it manually.");
                }
            },
            { timeout: 15000, enableHighAccuracy: true }
        );
    };

    const handleDeny = () => {
        setShowManualModal(true);
    };

    const handleManualLocationSet = (location: { city: string, latitude: number, longitude: number }) => {
        localStorage.setItem('userLocation', JSON.stringify(location));
        onLocationSet();
        setShowManualModal(false);
    };
    
    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your device or browser.");
            setShowManualModal(true);
            return;
        }

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then(status => {
                setPermissionState(status.state);
                if (status.state === 'granted') {
                    handleAllow();
                }
                status.onchange = () => {
                    setPermissionState(status.state);
                    if(status.state === 'granted') {
                        handleAllow();
                    }
                };
            });
        } else {
            setPermissionState('prompt');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (showManualModal) {
        return <LocationModal onLocationSet={handleManualLocationSet} onClose={() => { /* Cannot close until location is set */ }} />;
    }

    if (permissionState === 'loading' || isLocating) {
        return (
            <div className="bg-[#143d31] min-h-screen flex flex-col items-center justify-center p-8 text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <h2 className="text-2xl font-semibold">Getting Location</h2>
                <p className="text-gray-300">Please wait a moment...</p>
                 {error && <p className="text-red-400 bg-red-500/20 p-3 rounded-lg mt-4 text-sm">{error}</p>}
            </div>
        );
    }

    if (permissionState === 'denied') {
        return (
            <div className="bg-[#143d31] min-h-screen flex flex-col items-center justify-center p-8 text-white text-center">
                <h1 className="text-4xl font-bold mb-4">Location Access Denied</h1>
                <p className="text-lg text-gray-300 mb-8">Set your city manually, or enable location access in your device/browser settings and reload the app.</p>
                {error && <p className="text-red-400 bg-red-500/20 p-3 rounded-lg mb-4 text-sm">{error}</p>}
                <div className="w-full max-w-xs space-y-4">
                    <button 
                        onClick={handleDeny}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        Set Manually
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-8">Your location data is used only to calculate prayer times and is not stored or shared.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#143d31] min-h-screen flex flex-col items-center justify-center p-8 text-white text-center">
            <h1 className="text-4xl font-bold mb-4">Location Required</h1>
            <p className="text-lg text-gray-300 mb-8">To calculate accurate prayer times, AlQuran360 needs to access your location. You can also set it manually.</p>
            
             {error && <p className="text-red-400 bg-red-500/20 p-3 rounded-lg mb-4 text-sm">{error}</p>}

            <div className="w-full max-w-xs space-y-4">
                <button 
                    onClick={handleAllow}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Allow Location Access
                </button>
                <button 
                    onClick={handleDeny}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Set Manually
                </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-8">Your location data is used only to calculate prayer times and is not stored or shared.</p>
        </div>
    );
};

export default LocationManager;