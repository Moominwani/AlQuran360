import React, { useState, useEffect } from 'react';

interface LocationModalProps {
    onClose: () => void;
    onLocationSet: (location: { city: string, latitude: number, longitude: number }) => void;
}

interface City {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
}

const LocationModal: React.FC<LocationModalProps> = ({ onClose, onLocationSet }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<City[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (query.length < 3) {
            setResults([]);
            return;
        }

        const fetchCities = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=10&language=en&format=json`);
                if (!response.ok) throw new Error("Could not fetch cities.");
                const data = await response.json();
                if (data.results) {
                    setResults(data.results);
                } else {
                    setResults([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred.');
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchCities, 500);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelectCity = (city: City) => {
        onLocationSet({
            city: city.name,
            latitude: city.latitude,
            longitude: city.longitude
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-secondary rounded-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-primary">Set Your Location</h2>
                    <button onClick={onClose} className="text-secondary">&times;</button>
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a city..."
                    className="w-full bg-primary border border-primary rounded-lg py-2 px-4 text-primary placeholder-color focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <div className="mt-4 h-64 overflow-y-auto">
                    {loading && <p className="text-center text-secondary">Searching...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    <ul className="space-y-2">
                        {results.map((city, index) => (
                            <li key={index}>
                                <button 
                                    onClick={() => handleSelectCity(city)}
                                    className="w-full text-left p-2 rounded-lg hover:bg-tertiary"
                                >
                                    <p className="font-semibold text-primary">{city.name}</p>
                                    <p className="text-sm text-secondary">{city.country}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
