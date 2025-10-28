import { HadithCollection } from './types';

export interface Dhikr {
  arabic: string;
  transliteration: string;
  translation: string;
}

export const dhikrData: Dhikr[] = [
  {
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illal-lahu wahdahu la shareeka lah, lahul-mulku walahul-hamd, wahuwa AAala kulli shayin qadeer',
    translation: 'None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise and He is over all things omnipotent.'
  },
  {
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subhan-Allah',
    translation: 'Glory be to Allah.'
  },
  {
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'All praise is due to Allah.'
  },
  {
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest.'
  },
  {
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirul-lah',
    translation: 'I seek forgiveness from Allah.'
  },
  {
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: 'Subhan-Allahi wa bihamdihi, Subhan-Allahil-Azeem',
    translation: 'Glory be to Allah and praise Him, Glory be to Allah the Supreme.'
  }
];


export const HADITH_COLLECTIONS: HadithCollection[] = [
  // FIX: Updated object to match the HadithCollection interface. Renamed 'hadiths' to 'hadithsCount', 'books' to 'booksCount' and added the required 'books' array.
  {
    name: "bukhari",
    title: "Sahih al-Bukhari",
    shortDescription: "Sahih al-Bukhari is a collection of hadith compiled by Abu Abdullah Muhammad Ibn Isma'il al-Bukhari...",
    hadithsCount: 7563,
    booksCount: 97,
    books: []
  },
  // FIX: Updated object to match the HadithCollection interface. Renamed 'hadiths' to 'hadithsCount', 'books' to 'booksCount' and added the required 'books' array.
  {
    name: "muslim",
    title: "Sahih Muslim",
    shortDescription: "Sahih Muslim is a collection of hadith compiled by Imam Muslim ibn al-Hajjaj al-Naysaburi (rahimahullah). His...",
    hadithsCount: 7190,
    booksCount: 56,
    books: []
  },
  // FIX: Updated object to match the HadithCollection interface. Renamed 'hadiths' to 'hadithsCount', 'books' to 'booksCount' and added the required 'books' array.
  {
    name: "abudawud",
    title: "Sunan Abi Dawud",
    shortDescription: "Sunan Abu Dawud is a collection of hadith compiled by Imam Abu Dawud Sulayman ibn al-Ash'ath as-Sijistani...",
    hadithsCount: 5274,
    booksCount: 43,
    books: []
  },
  // FIX: Updated object to match the HadithCollection interface. Renamed 'hadiths' to 'hadithsCount', 'books' to 'booksCount' and added the required 'books' array.
  {
    name: "tirmidhi",
    title: "Jami` at-Tirmidhi",
    shortDescription: "Jami` at-Tirmidhi is a collection of hadith compiled by Imam Abu `Isa Muhammad at-Tirmidhi (rahimahullah). His...",
    hadithsCount: 3956,
    booksCount: 46,
    books: []
  }
];