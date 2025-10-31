import { Page } from '../types';
import { surahMetadata } from './surahMetadata';

// Invert surahMetadata for easy lookup from number to name
const surahNumberMap: { [key: number]: string } = {};
surahMetadata.forEach(surah => {
    surahNumberMap[surah.number] = surah.englishName;
});

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
    const cleanedQuery = query.toLowerCase().replace(/^(al-?|as-?|at-?|ad-?|the)\s*/, '').replace(/['-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    let bestMatch: { name: string; number: number } | null = null;
    let minDistance = 100;

    for (const surah of surahMetadata) {
        const namesToTest = [
            surah.englishName,
            surah.englishNameTranslation,
            ...surah.aliases
        ];

        for (const name of namesToTest) {
            const cleanedName = name.toLowerCase().replace(/^(al-?|as-?|at-?|ad-?|the)\s*/, '').replace(/['-]/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Prioritize perfect or near-perfect matches
            if (cleanedName.includes(cleanedQuery)) {
                 const distance = Math.abs(cleanedName.length - cleanedQuery.length); // simple distance for includes
                 if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = { name: surah.englishName, number: surah.number };
                 }
                 // If it's an exact match, return immediately
                 if (distance === 0) return bestMatch;
            }
        }
    }
    
    // If no substring match was found, use Levenshtein distance as a fallback
    if (!bestMatch) {
         for (const surah of surahMetadata) {
            const namesToTest = [surah.englishName, ...surah.aliases];
            for (const name of namesToTest) {
                const cleanedName = name.toLowerCase().replace(/^(al-?|as-?|at-?|ad-?|the)\s*/, '').replace(/['-]/g, ' ').replace(/\s+/g, ' ').trim();
                const distance = levenshtein(cleanedQuery, cleanedName);
                const threshold = Math.max(1, Math.floor(cleanedQuery.length / 2.5));
                if (distance < minDistance && distance <= threshold) {
                    minDistance = distance;
                    bestMatch = { name: surah.englishName, number: surah.number };
                }
            }
        }
    }
    
    return bestMatch;
};


export type AppAction = {
  type: 'navigate_page' | 'navigate_surah' | 'greet' | 'help' | 'clarification_needed' | 'unknown';
  payload: any;
  responseText?: string;
}

export const parseCommand = (command: string): AppAction => {
    const lowerCommand = command.toLowerCase().trim();

    // === Greetings & Conversation ===
    if (/\b(hello|hi|hey|salam|as-salamu alaykum)\b/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "Wa Alaikum Assalam! How can I help you?" };
    }
    if (/\b(thank you|thanks|shukran|jazakallah)\b/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "You're welcome! Wa iyyakum." };
    }
    
    // === Help Command ===
    if (/\b(help|commands|what can you do|what can i ask)\b/.test(lowerCommand)) {
        const helpText = `I can help you interact with the app. Try asking me to:

**📖 Quran**
• "Read Surah Al-Mulk"
• "Play Surah Ar-Rahman"
• "Open verse 15 of Yasin"
• "How many verses are in Al-Baqarah?"
• "Which is the longest surah?"

**🧭 Navigation**
• "Open Hadith books"
• "Go to my Tasbeeh counter"
• "Show me the Qibla compass"
• "Go to appearance settings"

**ℹ️ App Info**
• "Who developed this app?"`;
        return { type: 'help', payload: {}, responseText: helpText };
    }
    
    // === About Developer ===
    if (/\b(who|developer|developed|creator|made)\b/.test(lowerCommand) && /\b(app|alquran360|this)\b/.test(lowerCommand)) {
        return { 
            type: 'greet', 
            payload: {}, 
            responseText: "AlQuran360 is developed with ❤️ by Moomin Wani. He is a passionate developer from Kashmir, dedicated to creating beautiful and useful applications for the Muslim community to help them in their daily religious practices." 
        };
    }
    
    // === In-App Knowledge ===
    if (/pillar/.test(lowerCommand) && /islam/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "The Five Pillars of Islam are:\n1. Shahada (Faith)\n2. Salah (Prayer)\n3. Zakat (Charity)\n4. Sawm (Fasting)\n5. Hajj (Pilgrimage to Mecca)" };
    }
    if (/islamic month|hijri month/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "The 12 months in the Islamic calendar are: Muharram, Safar, Rabi' al-awwal, Rabi' al-thani, Jumada al-awwal, Jumada al-thani, Rajab, Sha'ban, Ramadan, Shawwal, Dhu al-Qi'dah, Dhu al-Hijjah." };
    }
    
    // === Quran Facts & Info (from app data) ===
    if (/heart of the quran/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "Surah Ya-Sin is often referred to as the heart of the Quran." };
    }
    if (/surah without bismillah/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "Surah At-Tawbah (Chapter 9) is the only surah in the Quran that does not begin with the Bismillah." };
    }
    if (/longest surah/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "The longest surah in the Quran is Al-Baqarah, with 286 verses." };
    }
    if (/shortest surah/.test(lowerCommand)) {
        return { type: 'greet', payload: {}, responseText: "The shortest surahs in the Quran are Al-Kawthar, Al-Asr, and An-Nasr, each with 3 verses." };
    }
    const surahCountMatch = lowerCommand.match(/how many (meccan|medinan) surahs/);
    if (surahCountMatch) {
        const type = surahCountMatch[1];
        const count = surahMetadata.filter(s => s.revelationType.toLowerCase() === type).length;
        return { type: 'greet', payload: {}, responseText: `There are ${count} ${type} surahs in the Quran.` };
    }
    const infoRegex = /(how many|number of|what is|what's the|is|was) (.*) (verses|ayahs|ayat|revelation|revealed in|english name|translation)/;
    const infoMatch = lowerCommand.match(infoRegex);
    if (infoMatch) {
        const surahQuery = infoMatch[2].replace('surah', '').trim();
        const surah = findBestSurahMatch(surahQuery);
        if (surah) {
            const metadata = surahMetadata.find(s => s.number === surah.number)!;
            if (infoMatch[3].includes('verse') || infoMatch[3].includes('ayah')) {
                return { type: 'greet', payload: {}, responseText: `${metadata.englishName} has ${metadata.numberOfAyahs} verses.` };
            }
            if (infoMatch[3].includes('revelation') || infoMatch[3].includes('revealed')) {
                return { type: 'greet', payload: {}, responseText: `${metadata.englishName} is a ${metadata.revelationType} surah.` };
            }
             if (infoMatch[3].includes('english name') || infoMatch[3].includes('translation')) {
                return { type: 'greet', payload: {}, responseText: `The English translation for Surah ${metadata.englishName} is "${metadata.englishNameTranslation}".` };
            }
        }
    }

    // === General Page Navigation (High Priority) ===
    if (/\b(settings)\b/.test(lowerCommand)) {
        if (/\b(appearance|theme|dark mode|light mode)\b/.test(lowerCommand)) {
             return { type: 'navigate_page', payload: { page: Page.Settings, view: 'appearance' }, responseText: 'Opening appearance settings.' };
        }
        if (/\b(time|format|clock)\b/.test(lowerCommand)) {
            return { type: 'navigate_page', payload: { page: Page.Settings, view: 'time' }, responseText: 'Opening time format settings.' };
        }
        return { type: 'navigate_page', payload: { page: Page.Settings }, responseText: 'Opening settings.' };
    }
    if (/\b(hadith|hadees)\b/.test(lowerCommand)) return { type: 'navigate_page', payload: { page: Page.Hadith }, responseText: 'Opening the Hadith library.' };
    if (/\b(qibla|qiblah|direction|kaaba)\b/.test(lowerCommand)) return { type: 'navigate_page', payload: { page: Page.Qibla }, responseText: 'Opening the Qibla finder.' };
    if (/\b(tasbeeh|tasbih|counter|dhikr|zikr)\b/.test(lowerCommand)) {
        if (/\b(reset)\b/.test(lowerCommand)) {
            return { type: 'navigate_page', payload: { page: Page.Tasbeeh }, responseText: 'Opening the Tasbeeh counter. You can reset it there.' };
        }
        return { type: 'navigate_page', payload: { page: Page.Tasbeeh }, responseText: 'Opening the Tasbeeh counter.' };
    }
    
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
    const actionVerbsAndNouns = ['read', 'open', 'load', 'recite', 'play', 'listen to', 'show me', 'go to', 'take me to', 'surah', 'chapter', 'of'];
    const cleanupRegex = new RegExp(`\\b(${actionVerbsAndNouns.join('|')})\\b`, 'g');
    const surahQuery = commandToParseForSurah.replace(cleanupRegex, '').trim();
    
    // Step 3: Find the best surah match for the cleaned query
    const surah = findBestSurahMatch(surahQuery);

    if (surah) {
        const startPlayback = /\b(play|recite|listen)\b/.test(lowerCommand);
        const metadata = surahMetadata.find(s => s.number === surah.number)!;
        const surahName = metadata.englishName.startsWith("Al-") || metadata.englishName.startsWith("As-") || metadata.englishName.startsWith("At-") || metadata.englishName.startsWith("Ad-") ? metadata.englishName : `Surah ${metadata.englishName}`;
        
        let responseText = '';
        if (ayahNumber) {
            if (ayahNumber <= 0 || ayahNumber > metadata.numberOfAyahs) {
                return {
                    type: 'greet', // Use a non-navigational type
                    payload: {},
                    responseText: `Apologies, but ${surahName} only has ${metadata.numberOfAyahs} verses. Please ask for a verse number within this range.`
                };
            }
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
    
    // Step 4: Handle cases where only an ayah number was provided
    if (ayahNumber && !surah) {
        return {
            type: 'clarification_needed',
            payload: { 
                pendingQuestion: { type: 'ayah_number_missing_surah', data: { ayahNumber } } 
            },
            responseText: `Of course. Which surah would you like to see verse ${ayahNumber} of?`
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
    return { type: 'unknown', payload: {}, responseText: "Sorry, I didn't quite understand that. You can ask 'what can you do?' to see a list of commands." };
};