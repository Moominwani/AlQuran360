import React, { useState, useEffect, useMemo } from 'react';
import { HadithCollection, HadithBook, HadithChapter, Hadith, SavedHadith } from '../types';
import { SearchIcon, ChevronRightIcon, BookOpenIcon, ChevronLeftIcon } from '../contexts/MiscIcons';
import { StarIcon, FilledStarIcon } from '../components/icons/MiscIcons';

const Hadith: React.FC = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'collections' | 'books' | 'chapters' | 'hadiths' | 'favorites'>('collections');
  const [selectedCollection, setSelectedCollection] = useState<HadithCollection | null>(null);
  const [selectedBook, setSelectedBook] = useState<HadithBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<HadithChapter | null>(null);
  
  const [favorites, setFavorites] = useState<SavedHadith[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions.json');
        if (!response.ok) throw new Error("Could not fetch Hadith collections.");
        const data = await response.json();
        const collectionsArray = Object.values(data.hadiths).filter((c: any) => c.collection.some((col: any) => col.lang === 'en'));
        setCollections(collectionsArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
    loadFavorites();
  }, []);
  
  const loadFavorites = () => {
      const saved = localStorage.getItem('hadithFavorites');
      if (saved) {
          setFavorites(JSON.parse(saved));
      }
  };

  const isFavorite = (hadith: Hadith) => {
      return favorites.some(f => f.collection === hadith.collection && f.book === hadith.book && f.hadith === hadith.hadith);
  };
  
  const toggleFavorite = (hadith: Hadith) => {
    let updatedFavorites;
    const hadithId = `${hadith.collection}-${hadith.book}-${hadith.hadith}`;

    if (isFavorite(hadith)) {
      updatedFavorites = favorites.filter(f => f.id !== hadithId);
    } else {
      updatedFavorites = [...favorites, { ...hadith, id: hadithId }];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('hadithFavorites', JSON.stringify(updatedFavorites));
  };

  const removeFromFavorites = (hadithId: string) => {
    const updatedFavorites = favorites.filter(f => f.id !== hadithId);
    setFavorites(updatedFavorites);
    localStorage.setItem('hadithFavorites', JSON.stringify(updatedFavorites));
  };


  const handleCollectionSelect = async (collection: any) => {
    try {
      setLoading(true);
      const collectionName = collection.name.split('-')[0];
      const response = await fetch(`https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/eng-${collectionName}.json`);
      if (!response.ok) throw new Error(`Could not load ${collection.collection[0].title}.`);
      const data = await response.json();
      
      const booksMap: { [key: number]: HadithBook } = {};
      data.hadiths.forEach((h: Hadith) => {
        if (!booksMap[h.book]) {
          booksMap[h.book] = { book: h.book, bookName: h.bookName, chapters: [] };
        }
      });
      
      const chaptersMap: { [key: string]: HadithChapter } = {};
      data.hadiths.forEach((h: Hadith) => {
         const chapterId = `${h.book}-${h.chapter}`;
         if (!chaptersMap[chapterId]) {
             chaptersMap[chapterId] = { chapter: h.chapter, chapterName: h.chapterName, hadiths: [] };
         }
         chaptersMap[chapterId].hadiths.push(h);
      });

      Object.values(chaptersMap).forEach(ch => {
        const book = booksMap[ch.hadiths[0].book];
        if (book) book.chapters.push(ch);
      });

      setSelectedCollection({
        name: collectionName,
        title: collection.collection.find((c:any) => c.lang === 'en').title,
        shortDescription: '',
        books: Object.values(booksMap)
      });
      setView('books');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookSelect = (book: HadithBook) => {
    setSelectedBook(book);
    setView('chapters');
  };

  const handleChapterSelect = (chapter: HadithChapter) => {
    setSelectedChapter(chapter);
    setView('hadiths');
  };

  const goBack = () => {
    if (view === 'hadiths') {
        setView('chapters');
        setSelectedChapter(null);
    } else if (view === 'chapters') {
        setView('books');
        setSelectedBook(null);
    } else if (view === 'books') {
        setView('collections');
        setSelectedCollection(null);
    } else if (view === 'favorites') {
        setView('collections');
    }
  }

  const Header: React.FC<{title: string; onBack?: () => void}> = ({ title, onBack }) => (
    <div className="flex items-center mb-4">
        {onBack && <button onClick={onBack} className="p-2 mr-2"><ChevronLeftIcon className="w-6 h-6 text-primary"/></button>}
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
    </div>
  );

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      {view === 'collections' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-primary">Hadith Collections</h1>
            <button 
                onClick={() => { loadFavorites(); setView('favorites'); }} 
                className="text-sm font-medium accent-text flex items-center bg-secondary px-3 py-2 rounded-lg"
            >
                <FilledStarIcon className="w-5 h-5 mr-2 text-yellow-400"/> Favorites
            </button>
          </div>
          <div className="space-y-4">
            {collections.map(collection => (
              <div key={collection.name} onClick={() => handleCollectionSelect(collection)} className="bg-secondary rounded-xl p-4 flex items-start space-x-4 cursor-pointer">
                <div className="flex-shrink-0 w-16 h-16 bg-tertiary rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="w-8 h-8 text-secondary" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                      <div>
                        <h2 className="font-bold text-lg text-primary">{collection.collection.find((c:any) => c.lang === 'en').title}</h2>
                        <p className="text-sm text-secondary mt-1 line-clamp-2">{collection.collection.find((c:any) => c.lang === 'en').shortIntro}</p>
                      </div>
                      <ChevronRightIcon className="w-6 h-6 text-secondary flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-secondary mt-3">
                    <span>{collection.total} Hadith</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'favorites' && (
        <>
            <Header title="Favorite Hadiths" onBack={goBack} />
            {favorites.length === 0 ? (
                <p className="text-center text-secondary mt-8">You haven't saved any Hadiths yet.</p>
            ) : (
                <div className="space-y-6">
                    {favorites.map(hadith => (
                      <div key={hadith.id} className="bg-secondary rounded-xl p-4">
                         <div className="flex justify-between items-center mb-2">
                            <p className="font-bold accent-text">{hadith.collection.toUpperCase()} {hadith.hadith}</p>
                            <button 
                                onClick={() => removeFromFavorites(hadith.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-semibold"
                            >
                                Remove
                            </button>
                         </div>
                         <p className="text-sm text-secondary mb-2">{hadith.bookName} - {hadith.chapterName}</p>
                         <p className="text-primary leading-relaxed">{hadith.body}</p>
                      </div>
                    ))}
                 </div>
            )}
        </>
      )}

      {view === 'books' && selectedCollection && (
        <>
            <Header title={selectedCollection.title} onBack={goBack}/>
             <div className="space-y-3">
                {selectedCollection.books.map(book => (
                  <button key={book.book} onClick={() => handleBookSelect(book)} className="w-full bg-secondary rounded-xl p-4 flex items-center justify-between text-left">
                     <p className="font-bold text-lg text-primary">{book.bookName}</p>
                     <ChevronRightIcon className="w-6 h-6 text-secondary" />
                  </button>
                ))}
             </div>
        </>
      )}

      {view === 'chapters' && selectedBook && (
         <>
            <Header title={selectedBook.bookName} onBack={goBack}/>
             <div className="space-y-3">
                {selectedBook.chapters.map(chapter => (
                  <button key={chapter.chapter} onClick={() => handleChapterSelect(chapter)} className="w-full bg-secondary rounded-xl p-4 flex items-center justify-between text-left">
                     <p className="text-md text-primary">{chapter.chapterName}</p>
                     <ChevronRightIcon className="w-6 h-6 text-secondary" />
                  </button>
                ))}
             </div>
        </>
      )}
      
      {view === 'hadiths' && selectedChapter && (
         <>
            <Header title={selectedChapter.chapterName} onBack={goBack}/>
             <div className="space-y-6">
                {selectedChapter.hadiths.map(hadith => (
                  <div key={hadith.hadith} className="bg-secondary rounded-xl p-4">
                     <div className="flex justify-between items-center mb-2">
                        <p className="font-bold accent-text">{selectedCollection?.title} {hadith.hadith}</p>
                        <button onClick={() => toggleFavorite(hadith)}>
                            {isFavorite(hadith) ? <FilledStarIcon className="w-6 h-6 text-yellow-400"/> : <StarIcon className="w-6 h-6 text-secondary"/>}
                        </button>
                     </div>
                     <p className="text-primary leading-relaxed">{hadith.body}</p>
                  </div>
                ))}
             </div>
        </>
      )}

    </div>
  );
};

export default Hadith;