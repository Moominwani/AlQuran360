import React, { useState, useMemo, useEffect } from 'react';
import { Surah, Ayah } from '../types';
import { StarIcon, FilledStarIcon } from '../components/icons/MiscIcons';
import { surahMetadata } from '../utils/surahMetadata';
import { juzToSurahAyah } from '../utils/juzMetadata';
import { getLastReadLocation, getLastPlayedLocation, getFavoriteSurahs, addFavoriteSurah, removeFavoriteSurah, getFavoriteAyahs } from '../utils/db';

interface QuranProps {
  onSurahSelect: (surahNumber: number, startPlayback?: boolean, ayahNumber?: number) => void;
}

type QuranTab = 'surah' | 'juz' | 'bookmarks';
type BookmarkTab = 'surahs' | 'ayahs';

const KhatamQuranCard: React.FC = () => (
    <div className="bg-secondary p-4 rounded-2xl flex items-center justify-between col-span-2">
        <div>
            <p className="font-bold text-primary">Khatam Quran</p>
            <p className="text-sm text-secondary">Start New Reading Plan</p>
        </div>
        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        </div>
    </div>
);

const SummaryCard: React.FC<{
    title: string;
    surahName: string;
    detail: string;
    surahNumber?: number;
    isFavorite?: boolean;
    onBookmark?: () => void;
    onClick: () => void;
}> = ({ title, surahName, detail, surahNumber, isFavorite, onBookmark, onClick }) => (
    <div onClick={onClick} className="bg-secondary p-4 rounded-2xl cursor-pointer">
        <div className="flex justify-between items-start">
            <p className="text-sm text-secondary">{title}</p>
            {onBookmark && (
                 <button onClick={(e) => { e.stopPropagation(); onBookmark(); }} className="p-1">
                    {isFavorite ? <FilledStarIcon className="w-5 h-5 text-yellow-400" /> : <StarIcon className="w-5 h-5 text-secondary" />}
                </button>
            )}
        </div>
        <p className="font-bold text-lg text-primary mt-2 truncate">{surahName}</p>
        <p className="text-sm text-secondary">{detail}</p>
    </div>
);


const Quran: React.FC<QuranProps> = ({ onSurahSelect }) => {
  const [activeTab, setActiveTab] = useState<QuranTab>('surah');
  const [activeBookmarkTab, setActiveBookmarkTab] = useState<BookmarkTab>('surahs');
  const [lastRead, setLastRead] = useState<{ surahNumber: number, ayahNumber: number, page: number } | null>(null);
  const [lastPlayed, setLastPlayed] = useState<{ surahNumber: number, ayahNumber: number } | null>(null);
  const [favoriteSurahs, setFavoriteSurahs] = useState<number[]>([]);
  const [favoriteAyahs, setFavoriteAyahs] = useState<Ayah[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [read, played, favorites, favAyahsData] = await Promise.all([
        getLastReadLocation(),
        getLastPlayedLocation(),
        getFavoriteSurahs(),
        getFavoriteAyahs()
      ]);
      setLastRead(read);
      setLastPlayed(played);
      setFavoriteSurahs(favorites);
      setFavoriteAyahs(Object.values(favAyahsData).sort((a,b) => a.number - b.number));
    };
    fetchData();
  }, []);

  const toggleFavorite = async (surahNumber: number) => {
    const isFav = favoriteSurahs.includes(surahNumber);
    if (isFav) {
      await removeFavoriteSurah(surahNumber);
      setFavoriteSurahs(favs => favs.filter(n => n !== surahNumber));
    } else {
      await addFavoriteSurah(surahNumber);
      setFavoriteSurahs(favs => [...favs, surahNumber]);
    }
  };

  const surahListWithJuz = useMemo(() => {
    const items: (Surah | { type: 'juz'; number: number })[] = [];
    const juzMarkers = new Set();

    juzToSurahAyah.forEach(juzInfo => {
        const surahForJuz = surahMetadata.find(s => s.number === juzInfo.surah);
        if (surahForJuz) {
            juzMarkers.add(surahForJuz.number);
        }
    });

    let currentJuz = 1;
    surahMetadata.forEach(surah => {
        const juzStart = juzToSurahAyah.find(j => j.surah === surah.number);
        if(juzStart && juzStart.ayah === 1) {
            currentJuz = juzStart.juz;
            items.push({ type: 'juz', number: currentJuz });
        }
        items.push(surah);
    });
    return items;
  }, []);

  const TabButton: React.FC<{tab: QuranTab, label: string}> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`py-2 px-4 rounded-full text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-green-500 text-white' : 'text-secondary bg-tertiary'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4 text-primary">Quran</h1>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KhatamQuranCard />
        <SummaryCard 
            title="Last Recitation"
            surahName={lastRead ? surahMetadata[lastRead.surahNumber - 1].englishName : "Not Set"}
            detail={lastRead ? `Juz ${juzToSurahAyah.find(j=>j.surah === lastRead.surahNumber)?.juz}, Page ${lastRead.page}` : "-"}
            surahNumber={lastRead?.surahNumber}
            isFavorite={lastRead ? favoriteSurahs.includes(lastRead.surahNumber) : false}
            onBookmark={lastRead ? () => toggleFavorite(lastRead.surahNumber) : undefined}
            onClick={() => lastRead && onSurahSelect(lastRead.surahNumber, false, lastRead.ayahNumber)}
        />
        <SummaryCard 
            title="Last Played"
            surahName={lastPlayed ? surahMetadata[lastPlayed.surahNumber - 1].englishName : "Not Set"}
            detail={lastPlayed ? `Ayah ${lastPlayed.ayahNumber}` : "-"}
            onClick={() => lastPlayed && onSurahSelect(lastPlayed.surahNumber, true, lastPlayed.ayahNumber)}
        />
      </div>

      <div className="flex justify-center space-x-2 p-1 bg-tertiary rounded-full mb-6">
        <TabButton tab="surah" label="Surah" />
        <TabButton tab="juz" label="Juz" />
        <TabButton tab="bookmarks" label="Bookmarks" />
      </div>

      <div className="space-y-3">
        {activeTab === 'surah' && surahListWithJuz.map((item, index) => {
          if ('type' in item && item.type === 'juz') {
              return <p key={`juz-${item.number}`} className="text-secondary font-semibold pt-4">Juz {item.number}</p>
          }
          const surah = item as Surah;
          const isFavorite = favoriteSurahs.includes(surah.number);
          return (
            <div key={surah.number} className="flex items-center space-x-2">
                <div onClick={() => onSurahSelect(surah.number)} className="w-full bg-secondary rounded-xl p-3 flex items-center justify-between text-left cursor-pointer">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-tertiary rounded-lg flex items-center justify-center font-bold text-primary">
                            {surah.number}
                        </div>
                        <div>
                            <p className="font-bold text-primary">{surah.englishName}</p>
                            <p className="text-xs text-secondary">{surah.revelationType} • {surah.numberOfAyahs} Ayahs</p>
                        </div>
                    </div>
                    <p className="font-amiri text-2xl text-right text-primary">{surah.name}</p>
                </div>
                <button onClick={() => toggleFavorite(surah.number)} className="p-2">
                    {isFavorite ? <FilledStarIcon className="w-6 h-6 text-yellow-400"/> : <StarIcon className="w-6 h-6 text-secondary"/>}
                </button>
            </div>
          )
        })}
        {activeTab === 'juz' && juzToSurahAyah.map(({juz, surah, ayah}) => (
            <button key={juz} onClick={() => onSurahSelect(surah, false, ayah)} className="w-full bg-secondary rounded-xl p-4 flex items-center justify-between text-left">
                <p className="font-bold text-lg text-primary">Juz {juz}</p>
                <p className="text-sm text-secondary">Starts at {surahMetadata[surah-1].englishName}, Ayah {ayah}</p>
            </button>
        ))}
         {activeTab === 'bookmarks' && (
            <div>
                 <div className="flex justify-center space-x-2 p-1 bg-tertiary rounded-full mb-6">
                    <button onClick={() => setActiveBookmarkTab('surahs')} className={`py-2 px-4 w-1/2 rounded-full text-sm font-semibold transition-colors ${activeBookmarkTab === 'surahs' ? 'bg-green-500 text-white' : 'text-secondary bg-primary'}`}>Surahs</button>
                    <button onClick={() => setActiveBookmarkTab('ayahs')} className={`py-2 px-4 w-1/2 rounded-full text-sm font-semibold transition-colors ${activeBookmarkTab === 'ayahs' ? 'bg-green-500 text-white' : 'text-secondary bg-primary'}`}>Ayahs</button>
                 </div>
                 
                 {activeBookmarkTab === 'surahs' && (
                    <div className="space-y-3">
                        {surahMetadata.filter(s => favoriteSurahs.includes(s.number)).map(surah => (
                            <div key={surah.number} className="flex items-center space-x-2">
                                <div onClick={() => onSurahSelect(surah.number)} className="w-full bg-secondary rounded-xl p-3 flex items-center justify-between text-left cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-tertiary rounded-lg flex items-center justify-center font-bold text-primary">
                                            {surah.number}
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary">{surah.englishName}</p>
                                            <p className="text-xs text-secondary">{surah.revelationType} • {surah.numberOfAyahs} Ayahs</p>
                                        </div>
                                    </div>
                                    <p className="font-amiri text-2xl text-right text-primary">{surah.name}</p>
                                </div>
                                <button onClick={() => toggleFavorite(surah.number)} className="p-2">
                                    <FilledStarIcon className="w-6 h-6 text-yellow-400"/>
                                </button>
                            </div>
                        ))}
                        {favoriteSurahs.length === 0 && (
                            <div className="text-center text-secondary py-10">
                                <p>No favorite surahs yet.</p>
                                <p className="text-sm">You can add surahs to your favorites by tapping the star icon.</p>
                            </div>
                        )}
                    </div>
                 )}
                 {activeBookmarkTab === 'ayahs' && (
                    <div className="space-y-3">
                        {favoriteAyahs.map(ayah => {
                            // FIX: Find the surah for a favorited ayah by checking against the cumulative total of ayahs in the Quran.
                            // The original implementation was trying to access `s.ayahs` on surahMetadata objects, which does not exist.
                            let surahOfAyah: (typeof surahMetadata)[0] | undefined;
                            let cumulativeAyahs = 0;
                            for (const surah of surahMetadata) {
                                if (ayah.number > cumulativeAyahs && ayah.number <= cumulativeAyahs + surah.numberOfAyahs) {
                                    surahOfAyah = surah;
                                    break;
                                }
                                cumulativeAyahs += surah.numberOfAyahs;
                            }
                            const surahNum = surahOfAyah ? surahOfAyah.number : 0;
                            
                            return (
                                <div key={ayah.number} onClick={() => { if (surahNum > 0) onSurahSelect(surahNum, false, ayah.numberInSurah); }} className="bg-secondary rounded-xl p-4 cursor-pointer hover:bg-tertiary">
                                    <p className="font-bold text-primary mb-2">{surahOfAyah?.englishName || 'Unknown Surah'} : {ayah.numberInSurah}</p>
                                    <p className="font-amiri text-xl text-primary text-right">{ayah.text}</p>
                                </div>
                            )
                        })}
                         {favoriteAyahs.length === 0 && (
                            <div className="text-center text-secondary py-10">
                                <p>No favorite ayahs yet.</p>
                                <p className="text-sm">You can favorite an ayah from the surah detail page.</p>
                            </div>
                        )}
                    </div>
                 )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Quran;
