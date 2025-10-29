import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { ChevronLeftIcon, StarIcon, FilledStarIcon, BookOpenIcon, SearchIcon } from '../components/icons/MiscIcons';
import { CopyIcon, ShareIcon } from '../components/icons/PlayerIcons';

// SlidersIcon might not exist, let's create a simple one if it's not in MiscIcons.
const SlidersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="4" y1="21" x2="4" y2="14"></line>
        <line x1="4" y1="10" x2="4" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="3"></line>
        <line x1="20" y1="21" x2="20" y2="16"></line>
        <line x1="20" y1="12" x2="20" y2="3"></line>
        <line x1="1" y1="14" x2="7" y2="14"></line>
        <line x1="9" y1="8" x2="15" y2="8"></line>
        <line x1="17" y1="16" x2="23" y2="16"></line>
    </svg>
);


// --- API Configuration ---
const API_KEY = '$2y$10$b7nXn4eOT5QD9c3dvsPBsOloRdSlnwWD7EZ8xyKHHPuR6MNWTIF';
const API_BASE = 'https://hadithapi.com/api';

// --- Reader Settings ---
interface HadithSettings {
    fontSize: number;
    fontStyle: 'default' | 'amiri';
    lineSpacing: number;
}

const defaultSettings: HadithSettings = {
    fontSize: 16,
    fontStyle: 'default',
    lineSpacing: 1.7,
};

const HadithSettingsContext = createContext<{
    settings: HadithSettings;
    setSettings: React.Dispatch<React.SetStateAction<HadithSettings>>;
} | undefined>(undefined);

const useHadithSettings = () => {
    const context = useContext(HadithSettingsContext);
    if (!context) {
        throw new Error('useHadithSettings must be used within a HadithSettingsProvider');
    }
    return context;
};

const HADITH_SETTINGS_KEY = 'hadith_reader_settings';

const HadithSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<HadithSettings>(() => {
        try {
            const savedSettings = localStorage.getItem(HADITH_SETTINGS_KEY);
            return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    useEffect(() => {
        localStorage.setItem(HADITH_SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    return (
        <HadithSettingsContext.Provider value={{ settings, setSettings }}>
            {children}
        </HadithSettingsContext.Provider>
    );
};

// --- Type Interfaces for the new API ---
interface Book {
    bookSlug: string;
    bookName: string;
    writerName: string;
    hadiths_count: number;
}

interface Chapter {
    chapterNumber: string;
    chapterEnglish: string;
    chapterArabic: string;
}

interface HadithData {
    hadithNumber: string;
    englishNarrator: string;
    hadithEnglish: string;
    hadithArabic: string;
    chapterId: string;
    book: {
        bookName: string;
    };
    grades?: any[];
}


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

const SearchBar: React.FC<{ searchTerm: string; setSearchTerm: (term: string) => void; placeholder: string }> = ({ searchTerm, setSearchTerm, placeholder }) => (
    <div className="relative my-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
        <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-primary rounded-lg py-2 pl-10 pr-4 text-primary placeholder-color focus:outline-none focus:ring-1 focus:ring-green-500"
        />
    </div>
);

const PageHeader: React.FC<{ title: string; onBack?: () => void; rightAction?: React.ReactNode }> = ({ title, onBack, rightAction }) => (
    <header className="flex items-center justify-between mb-2 sticky top-0 bg-primary py-4 z-10">
        <div className="flex items-center">
            {onBack && (
                <button onClick={onBack} className="p-2 mr-2 rounded-full hover:bg-secondary">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            )}
            <h1 className="text-2xl font-bold truncate">{title}</h1>
        </div>
        {rightAction}
    </header>
);

// --- Reader Settings Modal ---
const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { settings, setSettings } = useHadithSettings();

    if (!isOpen) return null;

    const changeFontSize = (delta: number) => {
        setSettings(s => ({ ...s, fontSize: Math.max(12, Math.min(28, s.fontSize + delta)) }));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
            <div className="w-full bg-secondary rounded-t-2xl p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-tertiary rounded-full mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-center mb-6 text-primary">Reader Settings</h2>
                <div className="space-y-6">
                    {/* Font Size */}
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Font Size</label>
                        <div className="flex items-center justify-between bg-tertiary rounded-lg p-2">
                            <button onClick={() => changeFontSize(-1)} className="px-4 py-2 text-xl font-bold text-primary">-</button>
                            <span className="text-lg font-mono text-primary">{settings.fontSize}px</span>
                            <button onClick={() => changeFontSize(1)} className="px-4 py-2 text-xl font-bold text-primary">+</button>
                        </div>
                    </div>
                    {/* Font Style */}
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">English Font</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setSettings(s => ({ ...s, fontStyle: 'default' }))} className={`py-2 rounded-lg ${settings.fontStyle === 'default' ? 'bg-green-500 text-inverted' : 'bg-tertiary text-primary'}`}>Default</button>
                            <button onClick={() => setSettings(s => ({ ...s, fontStyle: 'amiri' }))} className={`py-2 rounded-lg font-amiri ${settings.fontStyle === 'amiri' ? 'bg-green-500 text-inverted' : 'bg-tertiary text-primary'}`}>Amiri</button>
                        </div>
                    </div>
                    {/* Line Spacing */}
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Line Spacing</label>
                         <div className="flex items-center space-x-4 bg-tertiary p-2 rounded-lg">
                            <input
                                type="range"
                                min="1.4"
                                max="2.4"
                                step="0.1"
                                value={settings.lineSpacing}
                                onChange={(e) => setSettings(s => ({ ...s, lineSpacing: parseFloat(e.target.value) }))}
                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                            <span className="text-sm font-mono text-primary">{settings.lineSpacing.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

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

const BooksList: React.FC<{ onSelect: (slug: string, name: string) => void }> = ({ onSelect }) => {
    const { data, loading, error } = useFetchData<{ books: Book[] }>(`${API_BASE}/books?apiKey=${API_KEY}`);
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredBooks = useMemo(() => {
        if (!data?.books) return [];
        return data.books.filter(book =>
            book.bookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.writerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    return (
        <div className="animate-fade-in">
            <PageHeader title="Hadith Books" />
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search books by name or author..." />
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            <div className="space-y-3">
                {filteredBooks.map(book => (
                    <div key={book.bookSlug} onClick={() => onSelect(book.bookSlug, book.bookName)} className="w-full bg-secondary rounded-xl p-4 flex items-center space-x-4 text-left cursor-pointer transition-transform transform hover:scale-[1.02]">
                        <div className="w-16 h-16 bg-tertiary rounded-2xl flex items-center justify-center flex-shrink-0">
                           <BookOpenIcon className="w-8 h-8 text-secondary" />
                        </div>
                        <div className="flex-grow">
                            <p className="font-bold text-lg text-primary">{book.bookName}</p>
                            <p className="text-sm text-secondary mt-1">{book.writerName}</p>
                            <p className="text-xs text-secondary mt-1">{book.hadiths_count} Hadiths</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ChaptersList: React.FC<{ bookSlug: string; bookName: string; onSelect: (chapterNumber: string, chapterName: string) => void; onSelectFavorites: () => void; onBack: () => void }> = ({ bookSlug, bookName, onSelect, onSelectFavorites, onBack }) => {
    const { data, loading, error } = useFetchData<{ chapters: Chapter[] }>(`${API_BASE}/${bookSlug}/chapters?apiKey=${API_KEY}`);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChapters = useMemo(() => {
        if (!data?.chapters) return [];
        return data.chapters.filter(chapter =>
            chapter.chapterEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chapter.chapterArabic.includes(searchTerm) ||
            chapter.chapterNumber.toString().includes(searchTerm)
        );
    }, [data, searchTerm]);

    return (
        <div className="animate-fade-in">
            <PageHeader title={bookName} onBack={onBack} />
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search chapters..." />
            
            <button onClick={onSelectFavorites} className="w-full flex items-center justify-center space-x-2 text-left p-3 mb-3 bg-secondary rounded-lg hover:bg-tertiary transition-colors">
                <FilledStarIcon className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold text-primary">View Favorites</span>
            </button>

            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            {filteredChapters.length > 0 && (
                <div>
                    {filteredChapters.map((chapter) => (
                        <button key={chapter.chapterNumber} onClick={() => onSelect(chapter.chapterNumber, chapter.chapterEnglish)} className="w-full flex items-center justify-between text-left py-4 border-b border-primary/20">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-8 h-8 bg-tertiary rounded-full flex items-center justify-center font-mono text-sm font-bold text-primary">
                                    {chapter.chapterNumber}
                                </div>
                                <p className="font-semibold text-primary truncate">{chapter.chapterEnglish}</p>
                            </div>
                            <p className="font-amiri text-lg text-right text-secondary pl-4">{chapter.chapterArabic}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const HadithCard: React.FC<{ hadith: HadithData; isFavorite: boolean; onToggleFavorite: () => void; }> = ({ hadith, isFavorite, onToggleFavorite }) => {
    const { settings } = useHadithSettings();
    
    const handleCopy = () => {
        const textToCopy = `${hadith.hadithArabic}\n\n${hadith.hadithEnglish}\n\n[${hadith.book.bookName} ${hadith.hadithNumber}]`;
        navigator.clipboard.writeText(textToCopy);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Hadith: ${hadith.book.bookName} ${hadith.hadithNumber}`,
                text: `${hadith.hadithEnglish}\n\n[${hadith.book.bookName} ${hadith.hadithNumber}]`,
            }).catch(error => console.log('Error sharing:', error));
        } else {
            handleCopy();
            alert("Share feature not supported. Hadith copied to clipboard.");
        }
    };
    
    return (
        <div className="bg-secondary rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 flex-shrink-0 bg-tertiary text-primary rounded-full flex items-center justify-center font-bold text-sm">
                    {hadith.hadithNumber}
                </div>
                <p className="text-sm text-secondary text-right">{hadith.englishNarrator}</p>
            </div>

            <p 
                className="text-right font-amiri text-primary mb-4"
                style={{ fontSize: `${settings.fontSize + 4}px`, lineHeight: settings.lineSpacing }}
            >
                {hadith.hadithArabic}
            </p>
            <p 
                className={`text-primary ${settings.fontStyle === 'amiri' ? 'font-amiri' : ''}`}
                style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineSpacing }}
            >
                {hadith.hadithEnglish}
            </p>

            <div className="border-t border-primary/20 mt-4 pt-3 flex justify-around items-center">
                <button onClick={handleCopy} className="flex flex-col items-center text-secondary hover:text-primary transition-colors p-2">
                    <CopyIcon className="w-5 h-5 mb-1" />
                    <span className="text-xs">Copy</span>
                </button>
                <button onClick={onToggleFavorite} className="flex flex-col items-center text-secondary hover:text-primary transition-colors p-2">
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

const HadithsList: React.FC<{ bookSlug: string; chapterNumber: string; chapterName: string; onBack: () => void }> = ({ bookSlug, chapterNumber, chapterName, onBack }) => {
    const url = `${API_BASE}/hadiths?apiKey=${API_KEY}&book=${bookSlug}&chapter=${chapterNumber}`;
    const { data, loading, error } = useFetchData<{ hadiths: { data: HadithData[] } }>(url);
    const hadiths = data?.hadiths?.data || [];
    
    const [favorites, setFavorites] = useState<{ [id: string]: HadithData }>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const favoriteKey = 'hadith_favorites_v3';

    useEffect(() => {
        const savedFavorites = localStorage.getItem(favoriteKey);
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    const toggleFavorite = (hadith: HadithData) => {
        const hadithId = `${bookSlug}:${hadith.hadithNumber}`;
        const newFavorites = { ...favorites };
        if (newFavorites[hadithId]) {
            delete newFavorites[hadithId];
        } else {
            newFavorites[hadithId] = hadith;
        }
        setFavorites(newFavorites);
        localStorage.setItem(favoriteKey, JSON.stringify(newFavorites));
    };

    const filteredHadiths = useMemo(() => {
        if (!hadiths) return [];
        return hadiths.filter(h =>
            h.hadithEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.hadithArabic.includes(searchTerm) ||
            h.englishNarrator.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.hadithNumber.includes(searchTerm)
        );
    }, [hadiths, searchTerm]);

    return (
        <div className="animate-fade-in">
             <PageHeader 
                title={chapterName} 
                onBack={onBack}
                rightAction={
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-secondary">
                        <SlidersIcon className="w-6 h-6 text-primary" />
                    </button>
                }
            />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search in this chapter..." />
            {loading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            <div className="space-y-6">
                {filteredHadiths.map(hadith => {
                    const hadithId = `${bookSlug}:${hadith.hadithNumber}`;
                    return (
                        <HadithCard
                            key={hadithId}
                            hadith={hadith}
                            isFavorite={!!favorites[hadithId]}
                            onToggleFavorite={() => toggleFavorite(hadith)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const FavoritesList: React.FC<{ bookSlug: string; bookName: string; onBack: () => void }> = ({ bookSlug, bookName, onBack }) => {
    const favoriteKey = 'hadith_favorites_v3';
    const [allFavorites, setAllFavorites] = useState<{ [id: string]: HadithData }>({});
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const savedFavorites = localStorage.getItem(favoriteKey);
        if (savedFavorites) {
            setAllFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    const bookFavorites = useMemo(() => {
        return (Object.values(allFavorites) as HadithData[]).filter(h => h.book.bookName === bookName);
    }, [allFavorites, bookName]);
    
    const toggleFavorite = (hadith: HadithData) => {
        const hadithId = `${bookSlug}:${hadith.hadithNumber}`;
        const newFavorites = { ...allFavorites };
        if (newFavorites[hadithId]) {
            delete newFavorites[hadithId];
        }
        setAllFavorites(newFavorites);
        localStorage.setItem(favoriteKey, JSON.stringify(newFavorites));
    };
    
    return (
        <div className="animate-fade-in">
            <PageHeader 
                title={`${bookName} - Favorites`}
                onBack={onBack}
                rightAction={
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-secondary">
                        <SlidersIcon className="w-6 h-6 text-primary" />
                    </button>
                }
            />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            {bookFavorites.length === 0 ? (
                <div className="text-center text-secondary p-8 mt-10">
                    <p className="font-semibold">No Favorites Yet</p>
                    <p className="text-sm">You have no favorite hadiths in this book.</p>
                </div>
            ) : (
                <div className="space-y-6 mt-4">
                    {bookFavorites.map(hadith => {
                        const hadithId = `${bookSlug}:${hadith.hadithNumber}`;
                        return (
                            <HadithCard
                                key={hadithId}
                                hadith={hadith}
                                isFavorite={true}
                                onToggleFavorite={() => toggleFavorite(hadith)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const HadithContent: React.FC = () => {
    const [view, setView] = useState<'books' | 'chapters' | 'hadiths' | 'favorites'>('books');
    const [selectedBook, setSelectedBook] = useState<{ slug: string; name: string } | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<{ number: string; name: string } | null>(null);

    const handleBookSelect = (slug: string, name: string) => {
        setSelectedBook({ slug, name });
        setView('chapters');
    };

    const handleChapterSelect = (number: string, name: string) => {
        setSelectedChapter({ number, name });
        setView('hadiths');
    };
    
    const handleShowFavorites = () => {
        setView('favorites');
    };

    const handleBack = () => {
        if (view === 'hadiths' || view === 'favorites') {
            setView('chapters');
            setSelectedChapter(null);
        } else if (view === 'chapters') {
            setView('books');
            setSelectedBook(null);
        }
    }

    const renderContent = () => {
        switch (view) {
            case 'favorites':
                return <FavoritesList bookSlug={selectedBook!.slug} bookName={selectedBook!.name} onBack={handleBack} />;
            case 'hadiths':
                return <HadithsList bookSlug={selectedBook!.slug} chapterNumber={selectedChapter!.number} chapterName={selectedChapter!.name} onBack={handleBack} />;
            case 'chapters':
                return <ChaptersList bookSlug={selectedBook!.slug} bookName={selectedBook!.name} onSelect={handleChapterSelect} onSelectFavorites={handleShowFavorites} onBack={handleBack} />;
            case 'books':
            default:
                return <BooksList onSelect={handleBookSelect} />;
        }
    };

    return (
        <div className="p-4">
            {renderContent()}
        </div>
    );
};

const Hadith: React.FC = () => {
    return (
        <HadithSettingsProvider>
            <HadithContent />
        </HadithSettingsProvider>
    );
};

export default Hadith;
