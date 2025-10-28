import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeftIcon, StarIcon, FilledStarIcon } from '../components/icons/MiscIcons';
import { CopyIcon, ShareIcon } from '../components/icons/PlayerIcons';

// --- API Configuration ---
const API_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';

// --- Reusable Components ---
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
    <div className="p-4 my-4 text-center text-red-400 bg-red-500/10 rounded-lg">
        <p className="font-semibold">An Error Occurred</p>
        <p className="text-sm">{message}</p>
    </div>
);

const PageHeader: React.FC<{ title: string; onBack?: () => void }> = ({ title, onBack }) => (
    <header className="flex items-center mb-4 sticky top-0 bg-primary py-4 z-10">
        {onBack && (
            <button onClick={onBack} className="p-2 mr-2 rounded-full hover:bg-secondary">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
        )}
        <h1 className="text-2xl font-bold truncate">{title}</h1>
    </header>
);

// --- API Fetch Hook ---
const useFetchData = <T,>(url: string) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) return;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setData(null);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status} ${response.statusText}. Please try again later.`);
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred. Please check your network connection.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [url]);

    return { data, loading, error };
};


// --- View Components ---

const collectionImageMap: { [key: string]: string } = {
  bukhari: 'https://assets.sunnah.com/images/books/1.png',
  muslim: 'https://assets.sunnah.com/images/books/2.png',
  abudawud: 'https://assets.sunnah.com/images/books/3.png',
  tirmidhi: 'https://assets.sunnah.com/images/books/4.png',
  nasai: 'https://assets.sunnah.com/images/books/5.png',
  ibnmajah: 'https://assets.sunnah.com/images/books/6.png',
  malik: 'https://assets.sunnah.com/images/books/7.png',
  riyadussalihin: 'https://assets.sunnah.com/images/books/10.png',
  adab: 'https://assets.sunnah.com/images/books/46.png',
  bulugh: 'https://assets.sunnah.com/images/books/48.png',
  forty: 'https://assets.sunnah.com/images/books/41.png',
  nawawi: 'https://assets.sunnah.com/images/books/41.png',
  shamail: 'https://assets.sunnah.com/images/books/47.png',
  qudsi: 'https://assets.sunnah.com/images/books/42.png',
};

const CollectionsList: React.FC<{ onSelect: (name: string, title: string) => void }> = ({ onSelect }) => {
    const { data: editions, loading, error } = useFetchData<any>(`${API_BASE}/editions.json`);

    const englishEditions = useMemo(() => {
        if (!editions) {
            return [];
        }
        // The API is expected to return an array, but we handle objects just in case.
        const editionsArray = Array.isArray(editions) ? editions : Object.values(editions);
        return editionsArray.filter(edition => edition && typeof edition === 'object' && edition.language === 'en');
    }, [editions]);

    return (
        <div className="animate-fade-in">
            <PageHeader title="Hadith Collections" />
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            <div className="space-y-4">
                {englishEditions?.map(edition => {
                    const collectionKey = edition.name.replace('eng-', '');
                    const imageUrl = collectionImageMap[collectionKey] || 'https://assets.sunnah.com/images/books/placeholder.png';
                    const title = edition.collection?.[0]?.title || edition.name;
                    return (
                        <div key={edition.name} onClick={() => onSelect(edition.name, title)} className="w-full bg-secondary rounded-xl p-4 flex items-center space-x-4 text-left cursor-pointer transition-transform transform hover:scale-[1.02]">
                            <img src={imageUrl} alt={title} className="w-20 h-28 object-cover rounded-md flex-shrink-0 bg-tertiary" onError={(e) => { e.currentTarget.src = 'https://assets.sunnah.com/images/books/placeholder.png'; }} />
                            <div className="flex-grow">
                                <p className="font-bold text-lg text-primary">{title}</p>
                                <p className="text-sm text-secondary mt-1">{edition.author}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SectionsList: React.FC<{ collectionName: string; collectionTitle: string; onSelect: (sectionNumber: string, sectionName: string) => void; onBack: () => void }> = ({ collectionName, collectionTitle, onSelect, onBack }) => {
    const { data: info, loading, error } = useFetchData<any>(`${API_BASE}/info.json`);

    const collectionInfo = useMemo(() => {
        return info ? info[collectionName]?.metadata : null;
    }, [info, collectionName]);

    return (
        <div className="animate-fade-in">
            <PageHeader title={collectionTitle} onBack={onBack} />
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            {collectionInfo && (
                <div>
                    {Object.entries(collectionInfo.sectionDetails).map(([number, name]) => {
                        const range = collectionInfo.sections[number];
                        return (
                            <button key={number} onClick={() => onSelect(number, name as string)} className="w-full flex items-center justify-between text-left py-4 border-b border-primary/20">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-tertiary rounded-full flex items-center justify-center font-mono text-sm font-bold text-primary">
                                        {number}
                                    </div>
                                    <p className="font-semibold text-primary">{name as string}</p>
                                </div>
                                {range && <p className="font-mono text-sm text-secondary">{range.from}-{range.to}</p>}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

interface MergedHadith {
    hadithnumber: number;
    arabicnumber: number;
    englishText: string;
    arabicText: string;
    grades: any[];
}

const HadithCard: React.FC<{ hadith: MergedHadith; collectionName: string; isFavorite: boolean; onFavorite: () => void; }> = ({ hadith, collectionName, isFavorite, onFavorite }) => {
    
    const handleCopy = () => {
        const textToCopy = `${hadith.arabicText}\n\n${hadith.englishText}\n\n[${collectionName.replace('eng-', '')} ${hadith.hadithnumber}]`;
        navigator.clipboard.writeText(textToCopy);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Hadith: ${collectionName.replace('eng-', '')} ${hadith.hadithnumber}`,
                text: `${hadith.englishText}\n\n[${collectionName.replace('eng-', '')} ${hadith.hadithnumber}]`,
                url: window.location.href,
            });
        }
    };
    
    return (
        <div className="bg-secondary rounded-xl p-4 flex flex-col">
            <div className="flex items-center mb-4">
                <div className="w-8 h-8 flex-shrink-0 bg-tertiary text-primary rounded-full flex items-center justify-center font-bold text-sm">
                    {hadith.hadithnumber}
                </div>
            </div>

            <p className="text-right font-amiri text-2xl leading-loose text-primary mb-4">
                {hadith.arabicText}
            </p>
            <p className="text-primary leading-relaxed">
                {hadith.englishText}
            </p>

            <div className="border-t border-primary/20 mt-4 pt-3 flex justify-around items-center">
                <button onClick={handleCopy} className="flex flex-col items-center text-secondary hover:text-primary transition-colors p-2">
                    <CopyIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs">Copy</span>
                </button>
                <button onClick={onFavorite} className="flex flex-col items-center text-secondary hover:text-primary transition-colors p-2">
                    {isFavorite ? <FilledStarIcon className="w-5 h-5 mb-1 text-yellow-400" /> : <StarIcon className="w-5 h-5 mb-1" />}
                    <span className="text-xs">Favorite</span>
                </button>
                <button onClick={handleShare} className="flex flex-col items-center text-secondary hover:text-primary transition-colors p-2">
                    <ShareIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs">Share</span>
                </button>
            </div>
        </div>
    );
};

const HadithsList: React.FC<{ collectionName: string; sectionNumber: string; sectionName: string; onBack: () => void }> = ({ collectionName, sectionNumber, sectionName, onBack }) => {
    const [hadiths, setHadiths] = useState<MergedHadith[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const favoriteKey = 'hadith_favorites';

    useEffect(() => {
        const savedFavorites = localStorage.getItem(favoriteKey);
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    const toggleFavorite = (hadithId: string) => {
        const newFavorites = favorites.includes(hadithId)
            ? favorites.filter(id => id !== hadithId)
            : [...favorites, hadithId];
        setFavorites(newFavorites);
        localStorage.setItem(favoriteKey, JSON.stringify(newFavorites));
    };

    const fetchHadiths = useCallback(async () => {
        setLoading(true);
        setError(null);
        setHadiths([]);
        const engUrl = `${API_BASE}/editions/${collectionName}/sections/${sectionNumber}.json`;
        const araUrl = `${API_BASE}/editions/${collectionName.replace('eng-', 'ara-')}/sections/${sectionNumber}.json`;
        try {
            const [engResponse, araResponse] = await Promise.all([fetch(engUrl), fetch(araUrl)]);
            
            if (!engResponse.ok) throw new Error(`Failed to fetch English Hadiths: ${engResponse.statusText}`);
            if (!araResponse.ok) throw new Error(`Failed to fetch Arabic Hadiths: ${araResponse.statusText}`);
            
            const engData = await engResponse.json();
            const araData = await araResponse.json();

            const araHadithsMap = new Map(araData.hadiths.map((h: any) => [h.hadithnumber, h]));

            const mergedHadiths: MergedHadith[] = engData.hadiths.map((engHadith: any) => ({
                hadithnumber: engHadith.hadithnumber,
                arabicnumber: engHadith.arabicnumber,
                englishText: engHadith.text,
                // Fix: Cast the result of `araHadithsMap.get` to `any` to resolve the TypeScript error.
                arabicText: (araHadithsMap.get(engHadith.hadithnumber) as any)?.text || 'Arabic text not available.',
                grades: engHadith.grades,
            }));

            setHadiths(mergedHadiths);

        } catch (err) {
            console.error("Fetch Hadiths error:", err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [collectionName, sectionNumber]);
    
    useEffect(() => {
        fetchHadiths();
    }, [fetchHadiths]);

    return (
        <div className="animate-fade-in">
            <PageHeader title={sectionName} onBack={onBack} />
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            <div className="space-y-6">
                {hadiths.map(hadith => {
                    const hadithId = `${collectionName}:${hadith.hadithnumber}`;
                    return (
                        <HadithCard
                            key={hadithId}
                            hadith={hadith}
                            collectionName={collectionName}
                            isFavorite={favorites.includes(hadithId)}
                            onFavorite={() => toggleFavorite(hadithId)}
                        />
                    );
                })}
            </div>
        </div>
    );
};


const Hadith: React.FC = () => {
    const [view, setView] = useState<'collections' | 'sections' | 'hadiths'>('collections');
    const [selectedCollection, setSelectedCollection] = useState<{ name: string; title: string } | null>(null);
    const [selectedSection, setSelectedSection] = useState<{ number: string; name: string } | null>(null);

    const handleCollectionSelect = (name: string, title: string) => {
        setSelectedCollection({ name, title });
        setView('sections');
    };

    const handleSectionSelect = (number: string, name: string) => {
        setSelectedSection({ number, name });
        setView('hadiths');
    };
    
    const handleBack = () => {
        if (view === 'hadiths') {
            setView('sections');
            setSelectedSection(null);
        } else if (view === 'sections') {
            setView('collections');
            setSelectedCollection(null);
        }
    }

    const renderContent = () => {
        switch (view) {
            case 'hadiths':
                return <HadithsList collectionName={selectedCollection!.name} sectionNumber={selectedSection!.number} sectionName={selectedSection!.name} onBack={handleBack} />;
            case 'sections':
                return <SectionsList collectionName={selectedCollection!.name} collectionTitle={selectedCollection!.title} onSelect={handleSectionSelect} onBack={handleBack} />;
            case 'collections':
            default:
                return <CollectionsList onSelect={handleCollectionSelect} />;
        }
    };
    
    return (
        <div className="p-4">
            {renderContent()}
        </div>
    );
};

export default Hadith;
