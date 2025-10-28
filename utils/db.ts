import { openDB, IDBPDatabase } from 'idb';
import { Prayer, UserData } from '../pages/Tasbeeh';

const DB_NAME = 'AlQuran360-TasbeehDB';
const DB_VERSION = 1;
const PRAYERS_STORE = 'prayers';
const SETTINGS_STORE = 'settings';
const SETTINGS_KEY = 'userSettings';

export interface SettingsData {
  id: string;
  customPrayers: Prayer[];
  beadStyle: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = () => {
  if (dbPromise) return dbPromise;
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PRAYERS_STORE)) {
        db.createObjectStore(PRAYERS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
};

// --- Prayer Data Functions ---

export const getPrayer = async (prayerId: string): Promise<Partial<UserData> | undefined> => {
  const db = await initDB();
  return db.get(PRAYERS_STORE, prayerId);
};

export const savePrayer = async (prayerData: Partial<UserData> & { id: string }): Promise<void> => {
  const db = await initDB();
  await db.put(PRAYERS_STORE, prayerData);
};

export const getAllPrayers = async (): Promise<UserData[]> => {
  const db = await initDB();
  return db.getAll(PRAYERS_STORE);
};

export const deletePrayer = async (prayerId: string): Promise<void> => {
  const db = await initDB();
  await db.delete(PRAYERS_STORE, prayerId);
};


// --- Settings Functions ---

export const getSettings = async (): Promise<SettingsData | undefined> => {
    const db = await initDB();
    return db.get(SETTINGS_STORE, SETTINGS_KEY);
};

export const saveSettings = async (settings: SettingsData): Promise<void> => {
    const db = await initDB();
    await db.put(SETTINGS_STORE, settings);
};