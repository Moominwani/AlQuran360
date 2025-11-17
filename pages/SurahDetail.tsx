import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { SurahDetailData, Ayah } from '../types';
import { BackIcon } from '../components/icons/SurahDetailIcons';
import AyahActions from '../components/AyahActions';
import AudioPlayer from '../components/AudioPlayer';
import { getQuranFromDB, saveLastReadLocation, getFavoriteAyahs, addFavoriteAyah, removeFavoriteAyah, saveLastPlayedLocation, saveLastReadJuz, saveLastPlayedJuz } from '../utils/db';
import { FilledStarIcon } from '../components/icons/MiscIcons';
import { getJuzNumber } from '../utils/juzMetadata';

interface SurahDetailProps {
  surahNumber: number;
  onBack: () => void;
  startPlayback?: boolean;
  ayahNumber?: number;
}

const SurahDetail: React.FC<SurahDetailProps> = ({ surahNumber, onBack, startPlayback, ayahNumber }) => {
  const [surahData, setSurahData] = useState<SurahDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentAyah, setCurrentAyah] = useState<Ayah | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [playbackQueue, setPlaybackQueue] = useState<Ayah[]>([]);
  const [repeatAyah, setRepeatAyah] = useState(false);
  const [replayTrigger, setReplayTrigger] = useState(0);

  const [favoriteAyahs, setFavoriteAyahs] = useState<{[key: number]: Ayah}>({});
  const [tempHighlightAyah, setTempHighlightAyah] = useState<number | null>(null);
  
  const ayahRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);

  // Reset scroll flag when surah changes
  useEffect(() => {
    initialScrollDone.current = false;
  }, [surahNumber]);


  useEffect(() => {
    const fetchSurahDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const offlineData = await getQuranFromDB();
            let textSurah: SurahDetailData | null = null;
            if (offlineData?.surahs) {
                const foundSurah = offlineData.surahs.find(s => s.number === surahNumber);
                if (foundSurah) textSurah = foundSurah as SurahDetailData;
            }

            let mergedSurah = textSurah;
            if (navigator.onLine) {
                try {
                    const audioResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`);
                    if (audioResponse.ok) {
                        const audioJson = await audioResponse.json();
                        if (audioJson.code === 200 && textSurah) {
                            const audioAyahs = audioJson.data.ayahs;
                            const mergedAyahs = textSurah.ayahs.map((ayah: any, index: number) => ({ ...ayah, audio: audioAyahs[index]?.audio || '' }));
                            mergedSurah = { ...textSurah, ayahs: mergedAyahs };
                        }
                    }
                } catch (audioError) {
                    console.warn("Could not fetch audio, proceeding with text only.", audioError);
                    if (mergedSurah) {
                         const ayahsWithoutAudio = mergedSurah.ayahs.map((ayah: any) => ({ ...ayah, audio: '' }));
                         mergedSurah = { ...mergedSurah, ayahs: ayahsWithoutAudio };
                    }
                }
            } else if (mergedSurah) {
                const ayahsWithoutAudio = mergedSurah.ayahs.map((ayah: any) => ({ ...ayah, audio: '' }));
                mergedSurah = { ...mergedSurah, ayahs: ayahsWithoutAudio };
            }

            if (!mergedSurah) {
                const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,ar.alafasy`);
                if (!response.ok) throw new Error('Failed to fetch Surah details');
                const data = await response.json();
                if (data.code === 200) {
                    const textData = data.data[0]; const audioData = data.data[1];
                    const mergedAyahs = textData.ayahs.map((ayah: Ayah, index: number) => ({ ...ayah, audio: audioData.ayahs[index].audio }));
                    setSurahData({ ...textData, ayahs: mergedAyahs });
                } else {
                    throw new Error(data.status);
                }
            } else {
                setSurahData(mergedSurah);
            }

            const favAyahs = await getFavoriteAyahs();
            setFavoriteAyahs(favAyahs);

        } catch (err) {
            if (!navigator.onLine) {
                setError("You are offline. Quran data has not been downloaded for offline use.");
            } else {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };
    fetchSurahDetail();
  }, [surahNumber]);

  useLayoutEffect(() => {
    // This effect handles the initial scroll to a specific ayah if provided
    if (surahData && ayahNumber && !initialScrollDone.current) {
      const elementToScroll = ayahRefs.current[ayahNumber - 1];
      if (elementToScroll) {
        // Use 'auto' for an instant jump, which is more reliable for initial setup.
        elementToScroll.scrollIntoView({ behavior: 'auto', block: 'center' });
        if (!startPlayback) {
          setTempHighlightAyah(ayahNumber);
        }
        initialScrollDone.current = true; // Prevent this from running again
      }
    }
  }, [surahData, ayahNumber, startPlayback]);
  
  useEffect(() => {
    // This effect initializes the audio player state once the surah data is loaded
    if (surahData && surahData.ayahs.length > 0) {
        const initialAyah = ayahNumber
            ? surahData.ayahs.find(a => a.numberInSurah === ayahNumber) || surahData.ayahs[0]
            : surahData.ayahs[0];

        if (startPlayback) {
            const startIndex = surahData.ayahs.indexOf(initialAyah);
            const allAyahsFromStart = surahData.ayahs.slice(startIndex);
            resetPlaybackModes();
            setPlaybackQueue(allAyahsFromStart);
            setCurrentAyah(initialAyah);
            setIsPlaying(true);
        } else {
            // For regular view, just set the current ayah for the player without starting playback.
            // This makes the player appear, ready to be used.
            setCurrentAyah(initialAyah);
            setIsPlaying(false);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahData, startPlayback, ayahNumber, surahNumber]);

  useEffect(() => {
    // This effect centralizes saving the last played location whenever the current ayah changes.
    if (currentAyah) {
        const location = { surahNumber: surahNumber, ayahNumber: currentAyah.numberInSurah };
        saveLastPlayedLocation(location);
        const juz = getJuzNumber(location.surahNumber, location.ayahNumber);
        saveLastPlayedJuz({ juz, ...location });
    }
  }, [currentAyah, surahNumber]);


  useEffect(() => {
    if (tempHighlightAyah !== null) {
        const timer = setTimeout(() => {
            setTempHighlightAyah(null);
        }, 3000); // Animation is 3s long
        return () => clearTimeout(timer);
    }
  }, [tempHighlightAyah]);


  const findTopmostVisibleAyah = useCallback(() => {
    if (!surahData) return null;
    for (let i = 0; i < ayahRefs.current.length; i++) {
        const el = ayahRefs.current[i];
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top >= 60) { // 60px offset for the header
                return surahData.ayahs[i] || null;
            }
        }
    }
    return surahData.ayahs[surahData.ayahs.length - 1]; // Fallback to last ayah
  }, [surahData]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const visibleAyah = findTopmostVisibleAyah();
            if (visibleAyah && surahData) {
                const location = {
                    surahNumber: surahData.number,
                    ayahNumber: visibleAyah.numberInSurah,
                    page: visibleAyah.page
                };
                saveLastReadLocation(location);
                const juz = getJuzNumber(location.surahNumber, location.ayahNumber);
                // FIX: Removed `page` property from the object passed to `saveLastReadJuz` to match expected type.
                saveLastReadJuz({ juz, surahNumber: location.surahNumber, ayahNumber: location.ayahNumber });
            }
        }, 500); // Debounce time
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => { // on unmount
        scrollContainer.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      
        if (surahData) {
            const visibleAyah = findTopmostVisibleAyah();
            if (visibleAyah) {
                 const location = {
                    surahNumber: surahData.number,
                    ayahNumber: visibleAyah.numberInSurah,
                    page: visibleAyah.page
                };
                saveLastReadLocation(location);
                const juz = getJuzNumber(location.surahNumber, location.ayahNumber);
                // FIX: Removed `page` property from the object passed to `saveLastReadJuz` to match expected type.
                saveLastReadJuz({ juz, surahNumber: location.surahNumber, ayahNumber: location.ayahNumber });
            }
        }
    }
  }, [surahData, findTopmostVisibleAyah]);


  const handleAyahClick = (e: React.MouseEvent, ayah: Ayah) => {
    e.stopPropagation();
    setSelectedAyah(ayah);
    setIsMenuOpen(true);
    if (surahData) {
        saveLastReadLocation({
            surahNumber: surahData.number,
            ayahNumber: ayah.numberInSurah,
            page: ayah.page
        });
    }
  };
  
  const resetPlaybackModes = () => {
      setPlaybackQueue([]);
      setRepeatAyah(false);
      setReplayTrigger(0);
  }
  
  const handlePlayPause = () => {
    if (currentAyah) {
        setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    resetPlaybackModes();
    if (surahData && currentAyah) {
      const currentIndex = surahData.ayahs.findIndex(a => a.number === currentAyah.number);
      if (currentIndex < surahData.ayahs.length - 1) {
        const nextAyah = surahData.ayahs[currentIndex + 1];
        setCurrentAyah(nextAyah);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handlePrev = () => {
    resetPlaybackModes();
    if (surahData && currentAyah) {
      const currentIndex = surahData.ayahs.findIndex(a => a.number === currentAyah.number);
      if (currentIndex > 0) {
        const prevAyah = surahData.ayahs[currentIndex - 1];
        setCurrentAyah(prevAyah);
        setIsPlaying(true);
      }
    }
  };
  
  const handleAudioEnded = () => {
    if (repeatAyah) {
      setReplayTrigger(c => c + 1);
    } else if (playbackQueue.length > 0) {
        const currentIndex = playbackQueue.findIndex(a => a.number === currentAyah?.number);
        if (currentIndex !== -1 && currentIndex < playbackQueue.length - 1) {
            setCurrentAyah(playbackQueue[currentIndex + 1]);
        } else {
            setIsPlaying(false);
            setPlaybackQueue([]);
        }
    } else {
        handleNext();
    }
  };

  const handlePlayToEndOfJuz = () => {
    if (!surahData || !selectedAyah) return;
    const currentJuz = selectedAyah.juz;
    const remainingAyahsInJuz = surahData.ayahs.filter(a => a.juz === currentJuz && a.numberInSurah >= selectedAyah.numberInSurah);
    
    resetPlaybackModes();
    setPlaybackQueue(remainingAyahsInJuz);
    setCurrentAyah(remainingAyahsInJuz[0]);
    setIsPlaying(true);
    setIsMenuOpen(false);
  };

  const handleRepeat = () => {
    if (!selectedAyah) return;
    resetPlaybackModes();
    setRepeatAyah(true);
    setCurrentAyah(selectedAyah);
    setIsPlaying(true);
    setIsMenuOpen(false);
  };

  const toggleAyahFavorite = async () => {
    if (!selectedAyah) return;
    const isFav = !!favoriteAyahs[selectedAyah.number];
    if (isFav) {
      await removeFavoriteAyah(selectedAyah.number);
      setFavoriteAyahs(prev => {
        const next = {...prev};
        delete next[selectedAyah.number];
        return next;
      });
    } else {
      await addFavoriteAyah(selectedAyah);
      setFavoriteAyahs(prev => ({...prev, [selectedAyah.number]: selectedAyah}));
    }
    setIsMenuOpen(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-primary text-primary"><p>Loading Surah...</p></div>;
  if (error) return <div className="flex items-center justify-center h-screen bg-primary text-primary"><p className="text-red-400 p-4 text-center">{error}</p></div>;
  if (!surahData) return null;

  const hasAudio = !!(surahData?.ayahs?.[0]?.audio);
  let lastRuku = -1;

  return (
    <div ref={scrollContainerRef} className={`bg-primary text-primary min-h-screen allow-selection ${currentAyah && hasAudio ? 'pb-40' : 'pb-4'}`}>
      <header className="sticky top-0 bg-primary/80 backdrop-blur-sm z-10 p-4 flex items-center justify-between border-b border-primary">
        <button onClick={onBack} className="p-2"><BackIcon className="w-6 h-6 text-primary" /></button>
        <div className="text-center">
            <h1 className="text-xl font-bold text-primary">{surahData.englishName}</h1>
            <p className="text-sm text-secondary">{surahData.englishNameTranslation}</p>
        </div>
        <div className="w-10 h-10"></div>
      </header>
      
      <div className="p-4 space-y-6">
        <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="font-arabic text-3xl mb-2 text-primary">{surahData.name}</p>
            <p className="text-sm text-secondary uppercase tracking-widest">
                {surahData.revelationType} • {surahData.numberOfAyahs} VERSES
            </p>
        </div>
        
        {surahData.number !== 1 && surahData.number !== 9 && (
            <p className="text-center font-arabic text-2xl text-primary">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
        )}

        {surahData.ayahs.map((ayah) => {
          const showRukuSeparator = ayah.ruku !== lastRuku && lastRuku !== -1;
          lastRuku = ayah.ruku;
          const isCurrent = currentAyah?.number === ayah.number;
          const isTempHighlighted = tempHighlightAyah === ayah.numberInSurah;
          const isFavorited = !!favoriteAyahs[ayah.number];
          
          return (
          <React.Fragment key={ayah.number}>
            {showRukuSeparator && (
                <div className="ruku-separator">
                    <span className="text-sm px-2 bg-primary">Ruku {ayah.ruku}</span>
                </div>
            )}
            <div 
              ref={el => { ayahRefs.current[ayah.numberInSurah - 1] = el; }}
              onClick={(e) => handleAyahClick(e, ayah)}
              className={`
                cursor-pointer rounded-lg p-2 transition-all duration-200
                border-l-4
                hover:bg-tertiary
                active:bg-green-500/10 active:scale-[0.98]
                ${isTempHighlighted ? 'highlight-ai-pulse' : ''}
                ${isCurrent ? 'bg-green-500/20 border-green-500' : 'border-transparent'}
              `}
            >
              <div className="flex justify-between items-center mb-4">
                <span className={`text-sm font-bold px-2 py-1 rounded transition-colors duration-300 bg-secondary ${isCurrent ? 'accent-text' : 'text-secondary'}`}>
                  {surahData.number}:{ayah.numberInSurah}
                </span>
                {isFavorited && <FilledStarIcon className="w-5 h-5 text-yellow-400" />}
              </div>
              <p className={`text-right font-arabic text-3xl leading-loose transition-colors duration-300 ${isCurrent ? 'accent-text' : 'text-primary'}`}>
                {ayah.text}
              </p>
            </div>
          </React.Fragment>
          );
        })}
      </div>
      
      {isMenuOpen && selectedAyah && (
        <AyahActions
          ayah={selectedAyah}
          hasAudio={hasAudio}
          isAyahFavorite={!!favoriteAyahs[selectedAyah.number]}
          onClose={() => setIsMenuOpen(false)}
          onPlayToEndOfJuz={handlePlayToEndOfJuz}
          onRepeat={handleRepeat}
          onToggleAyahFavorite={toggleAyahFavorite}
          onCopy={() => { navigator.clipboard.writeText(selectedAyah.text); setIsMenuOpen(false); }}
          onShare={() => {
            if (!selectedAyah) return;
            const title = `Quran ${surahData.englishName}:${selectedAyah.numberInSurah}`;
            const textToShare = `"${selectedAyah.text}"\n\n- Quran ${surahData.number}:${selectedAyah.numberInSurah}`;

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
            console.log("Attempting to share...");
            console.log("Checking for AndroidShareInterface:", window.hasOwnProperty('AndroidShareInterface'));
            if ((window as any).AndroidShareInterface) {
                console.log("AndroidShareInterface object found. Checking for shareText method:", typeof (window as any).AndroidShareInterface.shareText);
            } else {
                console.log("AndroidShareInterface not found.");
            }
            console.log("Checking for navigator.share:", navigator.share !== undefined);

            if ((window as any).AndroidShareInterface && typeof (window as any).AndroidShareInterface.shareText === 'function') {
                console.log("Using AndroidShareInterface.shareText to share.");
                (window as any).AndroidShareInterface.shareText(title, textToShare);
            } else if (navigator.share) {
                console.log("Using navigator.share API.");
                navigator.share({
                    title: title,
                    text: textToShare,
                }).catch(error => console.log('Error sharing:', error));
            } else {
                console.log("No share mechanism found. Falling back to copy.");
                navigator.clipboard.writeText(textToShare);
                alert("Share feature not supported. This can happen if the native Android interface is not available in the WebView. Content copied to clipboard.");
            }
            setIsMenuOpen(false);
          }}
        />
      )}

      {currentAyah && hasAudio && (
        <AudioPlayer 
            surah={surahData}
            currentAyah={currentAyah}
            isPlaying={isPlaying}
            replayTrigger={replayTrigger}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
            onEnded={handleAudioEnded}
            onClose={() => { setCurrentAyah(null); setIsPlaying(false); resetPlaybackModes(); }}
        />
      )}
    </div>
  );
};

export default SurahDetail;