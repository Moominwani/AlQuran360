import { Page } from '../types';
import { surahNameMap } from './surahNames';

// Invert surahNameMap for easy lookup from number to name
const surahNumberMap: { [key: number]: string } = {};
Object.entries(surahNameMap).forEach(([name, number]) => {
    if (!surahNumberMap[number] && !/The /.test(name)) {
        surahNumberMap[number] = name;
    }
});

const allSurahNames = Object.keys(surahNameMap);

// Levenshtein distance function for fuzzy string matching
const levenshtein = (s1: string, s2: string): number => {
    if (s1.length > s2.length) { [s1, s2] = [s2, s1]; }
    const distances = Array.from({ length: s1.length + 1 }, (_, i) => i);
    for (let j = 0; j < s2.length; j++) {
        let prev = distances[0];
        distances[0]++;
        for (let i = 0; i < s1.length; i++) {
            const temp = distances[i+1];
            distances[i+1] = Math.min(
                temp + 1,
                prev + 1,
                distances[i] + (s1[i] === s2[j] ? 0 : 1)
            );
            prev = temp;
        }
    }
    return distances[s1.length];
};

const findBestSurahMatch = (query: string): { name: string; number: number } | null => {
    if (!query || query.trim().length < 2) return null;
    const cleanedQuery = query.toLowerCase().replace(/^(al-?|the)\s*/, '').replace(/['-]/g, ' ').replace(/\s+/g, ' ').trim();

    // === Step 1: Prioritize perfect matches ===
    for (const name of allSurahNames) {
        const cleanedName = name.toLowerCase().replace(/^(al-?|the)\s*/, '').replace(/['-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanedQuery === cleanedName) {
            return { name, number: surahNameMap[name] };
        }
    }

    // === Step 2: Fallback to fuzzy matching if no perfect match is found ===
    let bestMatch: { name: string; number: number } | null = null;
    let minDistance = 100; // Start with a high number

    for (const name of allSurahNames) {
         const cleanedName = name.toLowerCase().replace(/^(al-?|the)\s*/, '').replace(/['-]/g, ' ').replace(/\s+/g, ' ').trim();
         const distance = levenshtein(cleanedQuery, cleanedName);

         // A good match should have a distance less than half the query length, and be better than previous matches
         const threshold = Math.max(1, Math.floor(cleanedQuery.length / 2));
         if (distance < minDistance && distance < threshold) {
             minDistance = distance;
             bestMatch = { name, number: surahNameMap[name] };
         }
    }
    
    return bestMatch;
};


export type AppAction = {
  type: 'navigate_page' | 'navigate_surah' | 'navigate_settings' | 'greet' | 'unknown';
  payload: any;
  responseText?: string;
}

export const parseCommand = (command: string): AppAction => {
    const lowerCommand = command.toLowerCase().trim();

    // === Greetings ===
    if (/\b(hello|hi|hey|salam|as-salamu alaykum)\b/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "Wa Alaikum Assalam! How can I help you?" };
    }
    
    // === About Developer ===
    if (/\b(who|developer|developed|creator|made)\b/.test(lowerCommand) && /\b(app|alquran360|this)\b/.test(lowerCommand)) {
        return { 
            type: 'greet', 
            payload: {}, 
            responseText: "AlQuran360 was developed with ❤️ by Moomin Wani. He is a passionate developer from Kashmir, dedicated to creating beautiful and useful applications for the Muslim community to help them in their daily religious practices." 
        };
    }

    // === General Page Navigation (High Priority) ===
    if (/\b(hadith|hadees)\b/.test(lowerCommand)) return { type: 'navigate_page', payload: { page: Page.Hadith }, responseText: 'Opening the Hadith library.' };
    if (/\b(settings|theme|appearance)\b/.test(lowerCommand)) return { type: 'navigate_settings', payload: {}, responseText: 'Opening settings.' };
    
    // === Prayer Times (with date logic) ===
    const prayerRegex = /\b(prayer|salah|salat|namaz|times?)\b/;
    if (prayerRegex.test(lowerCommand)) {
        let dateOffset = 0;
        let dayString = "today's";
        if (/\b(tomorrow)\b/.test(lowerCommand)) { dateOffset = 1; dayString = "tomorrow's"; }
        else if (/\b(yesterday)\b/.test(lowerCommand)) { dateOffset = -1; dayString = "yesterday's"; }
        return { type: 'navigate_page', payload: { page: Page.Prayer, dateOffset }, responseText: `Showing ${dayString} prayer times.` };
    }

    // === Surah & Ayah Logic ===
    let ayahNumber: number | null = null;
    let commandToParseForSurah = lowerCommand;

    // Step 1: Check for an ayah number
    const ayahMatch = lowerCommand.match(/(?:verse|ayah|ayat)\s+(\d+)/);
    if (ayahMatch) {
        ayahNumber = parseInt(ayahMatch[1], 10);
        // Remove the ayah part to not confuse the surah parser
        commandToParseForSurah = lowerCommand.replace(/(?:verse|ayah|ayat)\s+(\d+)/, '').trim();
    }
    
    // Step 2: Clean up common command words to isolate the surah name
    const actionVerbsAndNouns = ['read', 'open', 'load', 'recite', 'play', 'listen to', 'show me', 'go to', 'take me to', 'surah', 'chapter'];
    const cleanupRegex = new RegExp(`\\b(${actionVerbsAndNouns.join('|')})\\b`, 'g');
    const surahQuery = commandToParseForSurah.replace(cleanupRegex, '').trim();
    
    // Step 3: Find the best surah match for the cleaned query
    const surah = findBestSurahMatch(surahQuery);

    if (surah) {
        const startPlayback = /\b(play|recite|listen)\b/.test(lowerCommand);
        const surahName = surah.name.startsWith("Al-") || surah.name.startsWith("As-") || surah.name.startsWith("At-") || surah.name.startsWith("Ad-") ? surah.name : `Surah ${surah.name}`;
        
        let responseText = '';
        if (ayahNumber) {
            responseText = `Showing verse ${ayahNumber} of ${surahName}.`;
        } else {
            responseText = startPlayback ? `Playing ${surahName}.` : `Opening ${surahName}.`;
        }

        return {
            type: 'navigate_surah',
            payload: {
                surahNumber: surah.number,
                startPlayback: ayahNumber ? false : startPlayback, // Don't autoplay if navigating to a verse
                ayahNumber: ayahNumber || undefined,
            },
            responseText
        };
    }
    
    // Check for a number-only command as a final surah check
    const num = parseInt(lowerCommand, 10);
    if (!isNaN(num) && lowerCommand.match(/^\d+$/) && num >= 1 && num <= 114) {
        const surahName = surahNumberMap[num] || `Surah ${num}`;
        return { type: 'navigate_surah', payload: { surahNumber: num, startPlayback: false }, responseText: `Opening ${surahName}.` };
    }


    // === Fallback Page Navigation (Lower Priority) ===
    if (/\b(quran|koran)\b/.test(lowerCommand)) return { type: 'navigate_page', payload: { page: Page.Quran }, responseText: 'Opening the Quran index.' };
    if (/\b(home|main)\b/.test(lowerCommand)) return { type: 'navigate_page', payload: { page: Page.Home }, responseText: 'Going to the Home screen.' };


    // === Fallback ===
    return { type: 'unknown', payload: {}, responseText: "Sorry, I didn't quite understand that. Please try another command like 'open surah yasin'." };
};