import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from 'react';
import { ChevronLeftIcon, StarIcon, FilledStarIcon, BookOpenIcon, SearchIcon, SlidersIcon } from '../components/icons/MiscIcons';
import { CopyIcon, ShareIcon } from '../components/icons/PlayerIcons';

// --- API Configuration ---
const API_KEY = '$2y$10$b7nXn4eOT5QD9c3dvsPBsOloRdSlnwWD7EZ8xyKHHPuR6MNWTIF';
const API_BASE = 'https://hadithapi.com/api';

// --- Reader Settings ---
interface HadithSettings {
    fontSize: number;
    lineSpacing: number;
}

const defaultSettings: HadithSettings = {
    fontSize: 16,
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

const PageHeader: React.FC<{ title: string; onBack?: () => void; rightAction?: React.ReactNode }> = ({ title, onBack, rightAction }) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const checkOverflow = () => {
            const el = titleRef.current;
            if (el) {
                const hasOverflow = el.scrollWidth > el.clientWidth;
                if (hasOverflow) {
                    const scrollAmount = el.scrollWidth - el.clientWidth;
                    // Adjust speed based on how much text is hidden. Base 5s + 1s per 50px overflow
                    const duration = 5 + (scrollAmount / 50);
                    el.style.setProperty('--scroll-amount', `-${scrollAmount}px`);
                    el.style.setProperty('--scroll-duration', `${duration}s`);
                }
                setIsOverflowing(hasOverflow);
            }
        };

        // Check on mount and on title change
        checkOverflow();

        // Check on resize
        const resizeObserver = new ResizeObserver(checkOverflow);
        if (titleRef.current) {
            resizeObserver.observe(titleRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [title]);

    return (
        <header className="flex items-center gap-x-2 mb-2 sticky top-0 bg-primary py-4 z-10">
            {onBack && (
                <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary flex-shrink-0">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            )}
            <div className="flex-1 overflow-hidden">
                <h1 
                    ref={titleRef} 
                    className={`text-2xl font-bold whitespace-nowrap ${isOverflowing ? 'autoscroll-on-overflow' : ''}`}
                >
                    {title}
                </h1>
            </div>
            {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
        </header>
    );
};


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
                if (!navigator.onLine) {
                    setError("You are offline. This content is not available in the cache.");
                } else {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred. Please check your network connection.');
                }
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
                        <div className="flex-grow min-w-0">
                            <p className="font-bold text-lg text-primary truncate">{book.bookName}</p>
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
                            <p className="font-arabic text-lg text-right text-secondary pl-4 max-w-[40%] truncate">{chapter.chapterArabic}</p>
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
        const title = `Hadith: ${hadith.book.bookName} ${hadith.hadithNumber}`;
        const textToShare = `${hadith.hadithEnglish}\n\n[${hadith.book.bookName} ${hadith.hadithNumber}]`;

        // FOR ANDROID APK (WEBVIEW):
        // This code checks for a special 'AndroidShareInterface' object on the window.
        // To make sharing work in your WebView APK, you must create and inject this
        // interface from your native Android code.
        //
        // Here is an example of how to do this in your Android Activity (Kotlin):
        //
        // 1. Create a class for the interface:
        //    class WebAppInterface(private val mContext: Context) {
        //        @android.webkit.JavascriptInterface
        //        fun shareText(title: String, text: String) {
        //            val sendIntent: Intent = Intent().apply {
        //                action = Intent.ACTION_SEND
        //                putExtra(Intent.EXTRA_TITLE, title)
        //                putExtra(Intent.EXTRA_TEXT, text)
        //                type = "text/plain"
        //            }
        //            val shareIntent = Intent.createChooser(sendIntent, null)
        //            mContext.startActivity(shareIntent)
        //        }
        //    }
        //
        // 2. Attach it to your WebView:
        //    yourWebView.addJavascriptInterface(WebAppInterface(this), "AndroidShareInterface")
        //
        // 1. Check for custom Android WebView interface
        if ((window as any).AndroidShareInterface && typeof (window as any).AndroidShareInterface.shareText === 'function') {
            (window as any).AndroidShareInterface.shareText(title, textToShare);
        } 
        // 2. Check for standard Web Share API
        else if (navigator.share) {
            navigator.share({
                title: title,
                text: textToShare,
            }).catch(error => console.log('Error sharing:', error));
        } 
        // 3. Fallback to copying to clipboard
        else {
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
                className="text-right font-arabic text-primary mb-4 break-words"
                style={{ fontSize: `${settings.fontSize + 4}px`, lineHeight: settings.lineSpacing }}
            >
                {hadith.hadithArabic}
            </p>
            <p 
                className="text-primary break-words"
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

interface HadithProps {
    pageProps: { 
        view?: 'books' | 'chapters' | 'hadiths' | 'favorites';
        book?: { slug: string; name: string };
        chapter?: { number: string; name: string };
    };
    onNavigate: (props: any) => void;
}

const HadithContent: React.FC<HadithProps> = ({ pageProps, onNavigate }) => {
    const { 
        view = 'books',
        book: selectedBook,
        chapter: selectedChapter
    } = pageProps || {};

    const handleBookSelect = (slug: string, name: string) => {
        onNavigate({ view: 'chapters', book: { slug, name } });
    };

    const handleChapterSelect = (number: string, name: string) => {
        if (!selectedBook) return;
        onNavigate({ view: 'hadiths', book: selectedBook, chapter: { number, name } });
    };
    
    const handleShowFavorites = () => {
        if (!selectedBook) return;
        onNavigate({ view: 'favorites', book: selectedBook });
    };

    const handleBack = () => {
        window.history.back();
    };

    const renderContent = () => {
        switch (view) {
            case 'favorites':
                if (!selectedBook) return <BooksList onSelect={handleBookSelect} />;
                return <FavoritesList bookSlug={selectedBook.slug} bookName={selectedBook.name} onBack={handleBack} />;
            case 'hadiths':
                if (!selectedBook || !selectedChapter) return <BooksList onSelect={handleBookSelect} />;
                return <HadithsList bookSlug={selectedBook.slug} chapterNumber={selectedChapter.number} chapterName={selectedChapter.name} onBack={handleBack} />;
            case 'chapters':
                if (!selectedBook) return <BooksList onSelect={handleBookSelect} />;
                return <ChaptersList bookSlug={selectedBook.slug} bookName={selectedBook.name} onSelect={handleChapterSelect} onSelectFavorites={handleShowFavorites} onBack={handleBack} />;
            case 'books':
            default:
                return <BooksList onSelect={handleBookSelect} />;
        }
    };

    return (
        <div className="p-4 allow-selection">
            {renderContent()}
        </div>
    );
};


const Hadith: React.FC<HadithProps> = ({ pageProps, onNavigate }) => {
    return (
        <HadithSettingsProvider>
            <HadithContent pageProps={pageProps} onNavigate={onNavigate} />
        </HadithSettingsProvider>
    );
};

export default Hadith;
