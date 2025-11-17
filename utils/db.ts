import { Ayah } from '../types';

const DB_NAME = 'AlQuran360DB';
const DB_VERSION = 3; // Incremented DB version
const QURAN_STORE_NAME = 'quran_text';
const TASBEEH_STORE_NAME = 'tasbeeh_data';
const SETTINGS_STORE_NAME = 'app_settings';
const PRAYER_TIMES_STORE_NAME = 'prayer_times';

const FULL_QURAN_KEY = 'full_quran_uthmani';
const LAST_DHIKR_KEY = 'last_selected_dhikr_id';

// New keys for Quran state
const LAST_READ_LOCATION_KEY = 'quran_last_read_location';
const LAST_PLAYED_LOCATION_KEY = 'quran_last_played_location';
const FAVORITE_SURAHS_KEY = 'quran_favorite_surahs';
const FAVORITE_AYAHS_KEY = 'quran_favorite_ayahs';
const LAST_READ_JUZ_KEY = 'quran_last_read_juz';
const LAST_PLAYED_JUZ_KEY = 'quran_last_played_juz';


interface QuranData {
    surahs: any[]; // A more generic type to avoid complexity
}

export interface Dhikr {
    id: string;
    text: string;
    ar: string;
    translation: string;
    count: number;
    target: number;
    rounds: number;
    isCustom?: boolean;
}

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error("Database error: ", event);
            reject("Error opening database");
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(QURAN_STORE_NAME)) {
                db.createObjectStore(QURAN_STORE_NAME);
            }
            if (!db.objectStoreNames.contains(TASBEEH_STORE_NAME)) {
                db.createObjectStore(TASBEEH_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                db.createObjectStore(SETTINGS_STORE_NAME);
            }
            if (!db.objectStoreNames.contains(PRAYER_TIMES_STORE_NAME)) {
                db.createObjectStore(PRAYER_TIMES_STORE_NAME);
            }
        };
    });
};

export const saveQuranToDB = async (data: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(QURAN_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(QURAN_STORE_NAME);
        const request = store.put(data, FULL_QURAN_KEY);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error("Error saving quran to DB", event);
            reject("Could not save data");
        };
    });
};

export const getQuranFromDB = async (): Promise<QuranData | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(QURAN_STORE_NAME, 'readonly');
        const store = transaction.objectStore(QURAN_STORE_NAME);
        const request = store.get(FULL_QURAN_KEY);

        request.onsuccess = (event) => {
            const result = (event.target as IDBRequest).result;
            resolve(result || null);
        };

        request.onerror = (event) => {
            console.error("Error fetching quran from DB", event);
            reject("Could not fetch data");
        };
    });
};

// --- Generic Settings Functions ---
export const saveSetting = async (key: string, value: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE_NAME);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = (err) => {
            console.error(`Error saving setting '${key}':`, err);
            reject(`Could not save setting '${key}'`);
        };
    });
};

export const getSetting = async <T>(key: string): Promise<T | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (err) => {
            console.error(`Error getting setting '${key}':`, err);
            reject(`Could not get setting '${key}'`);
        };
    });
};


// --- Prayer Times Cache ---
export const saveMonthlyPrayerTimes = async (key: string, data: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PRAYER_TIMES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(PRAYER_TIMES_STORE_NAME);
        const request = store.put(data, key);
        request.onsuccess = () => resolve();
        request.onerror = (err) => {
            console.error(`Error saving prayer times for key '${key}':`, err);
            reject(`Could not save prayer times`);
        };
    });
};

export const getMonthlyPrayerTimes = async (key: string): Promise<any[] | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PRAYER_TIMES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(PRAYER_TIMES_STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (err) => {
            console.error(`Error getting prayer times for key '${key}':`, err);
            reject(`Could not get prayer times`);
        };
    });
};


// --- Tasbeeh Functions ---

export const getTasbeehDhikrs = async (): Promise<Dhikr[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TASBEEH_STORE_NAME, 'readonly');
        const store = transaction.objectStore(TASBEEH_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (err) => {
            console.error("Error getting dhikrs:", err);
            reject("Could not get dhikrs");
        };
    });
};

export const saveTasbeehDhikr = async (dhikr: Dhikr): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TASBEEH_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(TASBEEH_STORE_NAME);
        const request = store.put(dhikr);
        request.onsuccess = () => resolve();
        request.onerror = (err) => {
            console.error("Error saving dhikr:", err);
            reject("Could not save dhikr");
        };
    });
};

export const deleteTasbeehDhikr = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TASBEEH_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(TASBEEH_STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (err) => {
            console.error("Error deleting dhikr:", err);
            reject("Could not delete dhikr");
        };
    });
};

export const saveAllTasbeehDhikrs = async (dhikrs: Dhikr[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(TASBEEH_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(TASBEEH_STORE_NAME);
        let completed = 0;
        
        if (dhikrs.length === 0) {
            resolve();
            return;
        }

        dhikrs.forEach(dhikr => {
            const request = store.put(dhikr);
            request.onsuccess = () => {
                completed++;
                if (completed === dhikrs.length) {
                    resolve();
                }
            };
        });
        
        transaction.onerror = (err) => {
            console.error("Error saving all dhikrs:", err);
            reject("Could not save all dhikrs");
        };
    });
};

// Legacy functions for compatibility, now using generic settings functions
export const getLastSelectedDhikrId = async (): Promise<string | null> => getSetting(LAST_DHIKR_KEY);
export const saveLastSelectedDhikrId = async (id: string): Promise<void> => saveSetting(LAST_DHIKR_KEY, id);

// --- Quran State Functions ---
export const saveLastReadLocation = (location: { surahNumber: number; ayahNumber: number; page: number; }) => saveSetting(LAST_READ_LOCATION_KEY, location);
export const getLastReadLocation = () => getSetting<{ surahNumber: number; ayahNumber: number; page: number; }>(LAST_READ_LOCATION_KEY);
export const saveLastPlayedLocation = (location: { surahNumber: number; ayahNumber: number; }) => saveSetting(LAST_PLAYED_LOCATION_KEY, location);
export const getLastPlayedLocation = () => getSetting<{ surahNumber: number; ayahNumber: number; }>(LAST_PLAYED_LOCATION_KEY);

export const saveLastReadJuz = (location: { juz: number; surahNumber: number; ayahNumber: number; }) => saveSetting(LAST_READ_JUZ_KEY, location);
export const getLastReadJuz = () => getSetting<{ juz: number; surahNumber: number; ayahNumber: number; }>(LAST_READ_JUZ_KEY);
export const saveLastPlayedJuz = (location: { juz: number; surahNumber: number; ayahNumber: number; }) => saveSetting(LAST_PLAYED_JUZ_KEY, location);
export const getLastPlayedJuz = () => getSetting<{ juz: number; surahNumber: number; ayahNumber: number; }>(LAST_PLAYED_JUZ_KEY);


export const getFavoriteSurahs = async (): Promise<number[]> => {
    const favorites = await getSetting<number[]>(FAVORITE_SURAHS_KEY);
    return favorites || [];
};
export const addFavoriteSurah = async (surahNumber: number) => {
    const favorites = await getFavoriteSurahs();
    if (!favorites.includes(surahNumber)) {
        await saveSetting(FAVORITE_SURAHS_KEY, [...favorites, surahNumber]);
    }
};
export const removeFavoriteSurah = async (surahNumber: number) => {
    const favorites = await getFavoriteSurahs();
    await saveSetting(FAVORITE_SURAHS_KEY, favorites.filter(n => n !== surahNumber));
};

// --- Ayah Favorites ---
export const getFavoriteAyahs = async (): Promise<{ [key: number]: Ayah }> => {
    const favorites = await getSetting<{ [key: number]: Ayah }>(FAVORITE_AYAHS_KEY);
    return favorites || {};
};
export const addFavoriteAyah = async (ayah: Ayah) => {
    const favorites = await getFavoriteAyahs();
    favorites[ayah.number] = ayah;
    await saveSetting(FAVORITE_AYAHS_KEY, favorites);
};
export const removeFavoriteAyah = async (ayahGlobalNumber: number) => {
    const favorites = await getFavoriteAyahs();
    delete favorites[ayahGlobalNumber];
    await saveSetting(FAVORITE_AYAHS_KEY, favorites);
};
