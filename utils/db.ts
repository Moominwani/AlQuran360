const DB_NAME = 'AlQuran360DB';
const DB_VERSION = 1;
const QURAN_STORE_NAME = 'quran_text';
const FULL_QURAN_KEY = 'full_quran_uthmani';

interface QuranData {
    surahs: any[]; // A more generic type to avoid complexity
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
