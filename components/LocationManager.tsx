import React, { useState, useEffect } from 'react';
import LocationModal from './LocationModal';

interface LocationManagerProps {
    onLocationSet: () => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ onLocationSet }) => {
    const [statusMessage, setStatusMessage] = useState('Checking location permissions...');
    const [error, setError] = useState<string | null>(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    const handleManualLocationSet = (location: { city: string, latitude: number, longitude: number }) => {
        localStorage.setItem('userLocation', JSON.stringify(location));
        onLocationSet();
        setShowManualModal(false);
    };

    const fetchAndSetLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your device.");
            setShowManualModal(true);
            return;
        }

        setIsLocating(true);
        setStatusMessage('Getting your location...');
        setError(null);

        const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 15000, // 15s timeout
                enableHighAccuracy: true,
            });
        });

        locationPromise
            .then(async (position) => {
                const { latitude, longitude } = position.coords;
                setStatusMessage('Finding your city...');
                try {
                    // Using a reliable reverse geocoder
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (!response.ok) throw new Error('Failed to fetch city name.');
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Current Location';
                    localStorage.setItem('userLocation', JSON.stringify({ city, latitude, longitude }));
                    onLocationSet();
                } catch (reverseGeocodeError) {
                    console.error("Reverse geocoding failed:", reverseGeocodeError);
                    // Fallback if reverse geocoding fails
                    localStorage.setItem('userLocation', JSON.stringify({ city: 'Current Location', latitude, longitude }));
                    onLocationSet();
                } finally {
                    setIsLocating(false);
                }
            })
            .catch((err) => {
                setIsLocating(false);
                let errorMessage = "An error occurred. Please set your location manually.";
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = "Location access was denied. You can set your city manually or enable permissions and reload the app.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = "Location is unavailable. Check your GPS and network, then try again or set it manually.";
                        break;
                    case err.TIMEOUT:
                        errorMessage = "Could not get your location in time. Please try again or set it manually.";
                        break;
                }
                setError(errorMessage);
            });
    };
    
    useEffect(() => {
        const checkPermissionsAndLocate = async () => {
            // Check for permissions API support
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const status = await navigator.permissions.query({ name: 'geolocation' });
                    if (status.state === 'granted') {
                        fetchAndSetLocation();
                    }
                    // Listen for changes, e.g., if user enables permission in settings
                    status.onchange = () => {
                       if (status.state === 'granted') {
                           fetchAndSetLocation();
                       }
                    };
                } catch (e) {
                    console.warn("Could not query permissions, will wait for user action.", e);
                }
            }
        };
        checkPermissionsAndLocate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    if (showManualModal) {
        return <LocationModal onLocationSet={handleManualLocationSet} onClose={() => { /* Cannot close */ }} />;
    }

    if (isLocating) {
         return (
            <div className="bg-primary min-h-screen flex flex-col items-center justify-center p-8 text-primary text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <h2 className="text-2xl font-semibold">{statusMessage}</h2>
                <p className="text-secondary">Please wait a moment...</p>
            </div>
        );
    }

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center p-8 text-primary text-center">
            <h1 className="text-4xl font-bold mb-4">Location Required</h1>
            <p className="text-lg text-secondary mb-8">To calculate accurate prayer times, AlQuran360 needs to access your location. You can also set it manually.</p>
            
            {error && <p className="text-red-400 bg-red-500/20 p-3 rounded-lg mb-4 text-sm max-w-sm">{error}</p>}

            <div className="w-full max-w-xs space-y-4">
                <button 
                    onClick={fetchAndSetLocation}
                    className="w-full accent-bg text-inverted font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Allow Location Access
                </button>
                <button 
                    onClick={() => setShowManualModal(true)}
                    className="w-full bg-tertiary hover:bg-tertiary/80 text-primary font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    Set Manually
                </button>
            </div>
            
            <p className="text-xs text-secondary mt-8">Your location data is used only to calculate prayer times and is not stored or shared.</p>
        </div>
    );
};

export default LocationManager;
