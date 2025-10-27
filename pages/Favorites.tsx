import React, { useState, useEffect } from 'react';
import { SavedHadith } from '../types';

const Favorites: React.FC = () => {
    const [favorites, setFavorites] = useState<SavedHadith[]>([]);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = () => {
        const saved = localStorage.getItem('hadithFavorites');
        if (saved) {
            setFavorites(JSON.parse(saved));
        }
    };
    
    const removeFromFavorites = (hadithId: string) => {
        const updatedFavorites = favorites.filter(f => f.id !== hadithId);
        setFavorites(updatedFavorites);
        localStorage.setItem('hadithFavorites', JSON.stringify(updatedFavorites));
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Favorite Hadiths</h1>

            {favorites.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-8">You haven't saved any Hadiths yet.</p>
            ) : (
                <div className="space-y-6">
                    {favorites.map(hadith => (
                      <div key={hadith.id} className="bg-gray-100 dark:bg-[#1a4538] rounded-xl p-4">
                         <div className="flex justify-between items-center mb-2">
                            <p className="font-bold text-green-500">{hadith.collection.toUpperCase()} {hadith.hadith}</p>
                            <button 
                                onClick={() => removeFromFavorites(hadith.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-semibold"
                            >
                                Remove
                            </button>
                         </div>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{hadith.bookName} - {hadith.chapterName}</p>
                         <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{hadith.body}</p>
                      </div>
                    ))}
                 </div>
            )}
        </div>
    );
};

export default Favorites;