import React, { useState } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import LocationModal from './LocationModal';

interface LocationManagerProps {
    onLocationSet: () => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({ onLocationSet }) => {
    const [permissionRequested, setPermissionRequested] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const { latitude, longitude, error, loading } = useGeolocation();

    const handleAllow = () => {
        // This will trigger the browser's native permission prompt
        // The useGeolocation hook will handle the result
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocode to get city name
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village || 'Current Location';
                    localStorage.setItem('userLocation', JSON.stringify({ city, latitude, longitude }));
                    onLocationSet();
                } catch (e) {
                     // Fallback if reverse geocoding fails
                    localStorage.setItem('userLocation', JSON.stringify({ city: 'Current Location', latitude, longitude }));
                    onLocationSet();
                }
            },
            () => { // Error callback
                setShowManualModal(true);
            }
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
    
    if (showManualModal) {
        return <LocationModal onLocationSet={handleManualLocationSet} onClose={() => { /* Cannot close until location is set */ }} />;
    }

    return (
        <div className="bg-[#143d31] min-h-screen flex flex-col items-center justify-center p-8 text-white text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to AlQuran360</h1>
            <p className="text-lg text-gray-300 mb-8">To provide you with accurate prayer times, please grant location access or set your city manually.</p>
            
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
                    Deny
                </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-8">Your location data is used only to calculate prayer times and is not stored or shared.</p>
        </div>
    );
};

export default LocationManager;