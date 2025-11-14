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
    const [permissionDenied, setPermissionDenied] = useState(false);

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
        setPermissionDenied(false);
        setStatusMessage('Getting your location...');
        setError(null);

        const getLocation = (options: PositionOptions): Promise<GeolocationPosition> => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });
        };
    
        const processPosition = async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            setStatusMessage('Finding your city...');
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (!response.ok) throw new Error('Failed to fetch city name.');
                const data = await response.json();
                const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Current Location';
                localStorage.setItem('userLocation', JSON.stringify({ city, latitude, longitude }));
                onLocationSet();
            } catch (reverseGeocodeError) {
                console.error("Reverse geocoding failed:", reverseGeocodeError);
                localStorage.setItem('userLocation', JSON.stringify({ city: 'Current Location', latitude, longitude }));
                onLocationSet();
            } finally {
                setIsLocating(false);
            }
        };
    
        const handleError = (err: GeolocationPositionError) => {
            setIsLocating(false);
            if (err.code === err.PERMISSION_DENIED) {
                setPermissionDenied(true);
                setError("Location access was denied. You can set your city manually or enable permissions in settings.");
            } else {
                let errorMessage = "An error occurred. Please set your location manually.";
                switch (err.code) {
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = "Location is unavailable. Check your GPS and network, then try again or set it manually.";
                        break;
                    case err.TIMEOUT:
                        errorMessage = "Could not get your location in time. Please try again or set it manually.";
                        break;
                }
                setError(errorMessage);
            }
        };
        
        // Try high accuracy first
        getLocation({ timeout: 10000, enableHighAccuracy: true })
            .then(processPosition)
            .catch(err => {
                // If high accuracy fails, try low accuracy
                if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
                    setStatusMessage('Retrying with lower accuracy...');
                    getLocation({ timeout: 15000, enableHighAccuracy: false })
                        .then(processPosition)
                        .catch(handleError); // Handle final error
                } else {
                    handleError(err); // Handle other errors like permission denied
                }
            });
    };
    
    useEffect(() => {
        const checkPermissionsAndLocate = async () => {
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const status = await navigator.permissions.query({ name: 'geolocation' });
                    if (status.state === 'granted') {
                        fetchAndSetLocation();
                    }
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

    if (permissionDenied) {
        return (
             <div className="bg-primary min-h-screen flex flex-col items-center justify-center p-8 text-primary text-center">
                <div className="bg-secondary p-6 rounded-2xl w-full max-w-md">
                    <h2 className="text-xl font-bold mb-4">Location Access Denied</h2>
                    <p className="text-secondary my-4">To automatically detect your location, please enable location permissions for this app in your device's settings.</p>
                    <p className="text-sm text-secondary my-4 bg-tertiary p-3 rounded-lg">
                        <strong>How:</strong> Go to your phone's settings, find permissions for this app, and enable Location access.
                    </p>
                    <div className="mt-6 space-y-3">
                        <button onClick={fetchAndSetLocation} className="w-full accent-bg text-inverted font-bold py-3 px-4 rounded-lg">
                            I've enabled it, Retry
                        </button>
                        <button onClick={() => setShowManualModal(true)} className="w-full bg-tertiary text-primary font-bold py-3 px-4 rounded-lg">
                            Set Manually Instead
                        </button>
                    </div>
                </div>
            </div>
        );
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