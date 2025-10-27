export enum Page {
  Home = 'Home',
  Quran = 'Quran',
  Qibla = 'Qibla',
  Tasbeeh = 'Tasbeeh',
}

export interface PrayerTimes {
  [key: string]: string;
}

export interface PrayerData {
  timings: PrayerTimes;
  date: {
    readable: string;
    hijri: {
      date: string;
      day: string;
      month: {
        en: string;
      };
      year: string;
    };
  };
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
}

export interface Ayah {
  number: number;
  audio: string;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface SurahDetailData extends Surah {
  ayahs: Ayah[];
}

// FIX: Added missing Hadith related types.
export interface Hadith {
  collection: string;
  book: number;
  bookName: string;
  chapter: number;
  chapterName: string;
  hadith: number;
  body: string;
}

export interface SavedHadith extends Hadith {
  id: string;
}

export interface HadithChapter {
  chapter: number;
  chapterName: string;
  hadiths: Hadith[];
}

export interface HadithBook {
  book: number;
  bookName: string;
  chapters: HadithChapter[];
}

export interface HadithCollection {
  name: string;
  title: string;
  shortDescription: string;
  books: HadithBook[];
  hadithsCount?: number;
  booksCount?: number;
}
