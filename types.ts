export enum Page {
  Home = 'Home',
  Prayer = 'Prayer',
  Quran = 'Quran',
  Hadith = 'Hadith',
  AIAssistant = 'AIAssistant',
  Settings = 'Settings',
  Qibla = 'Qibla',
  Tasbeeh = 'Tasbeeh',
  AIScholar = 'AIScholar',
}

export interface PrayerTimes {
  [key:string]: string;
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
  meta: {
    timezone: string;
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