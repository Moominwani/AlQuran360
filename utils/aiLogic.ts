import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse } from '@google/genai';
import { Page } from '../types';

export interface AIAction {
    type: 'navigate_page' | 'navigate_surah' | 'navigate_settings' | 'info';
    payload: any;
}

// --- Define Function Declarations for the AI model ---

const navigateToPage: FunctionDeclaration = {
    name: 'navigate_page',
    description: 'Navigates the user to a specific page within the app, like Prayer times, Quran index, or Hadith library.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            page: {
                type: Type.STRING,
                description: 'The destination page.',
                enum: ['Home', 'Prayer', 'Quran', 'Hadith']
            },
        },
        required: ['page'],
    },
};

const navigateToSurah: FunctionDeclaration = {
    name: 'navigate_surah',
    description: 'Opens a specific Surah (chapter) of the Quran by its number. Can also start audio playback immediately.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            surahNumber: {
                type: Type.INTEGER,
                description: 'The number of the Surah to open (1-114).',
            },
            startPlayback: {
                type: Type.BOOLEAN,
                description: 'Whether to start playing the audio recitation immediately. Set to true if the user asks to "listen", "play", or "recite".',
            },
        },
        required: ['surahNumber', 'startPlayback'],
    },
};

const navigateToSettings: FunctionDeclaration = {
    name: 'navigate_settings',
    description: 'Opens the app\'s settings screen, where users can change theme, appearance, etc.',
    parameters: {
        type: Type.OBJECT,
        properties: {}, // No parameters needed
    },
};

const systemInstruction = `You are a friendly and helpful AI assistant for an Islamic application called 'AlQuran360'.
Your primary role is to understand user requests and use the provided tools to navigate them through the app.
- When a user asks to go to a specific section (e.g., "show me prayer times", "open hadith library"), use the 'navigate_page' tool.
- When a user wants to read or listen to a specific Surah (e.g., "read surah yasin", "play surah 55"), use the 'navigate_surah' tool. Infer the surah number if they use a name. If they say "listen", "play", or "recite", set startPlayback to true.
- When a user wants to change settings (e.g., "change the theme"), use the 'navigate_settings' tool.
- For general Islamic questions or greetings, provide a concise and helpful answer without using tools.
- Confirm the action you are taking, for example, "Certainly, opening Surah Al-Mulk." or "Navigating to the prayer times screen."
- This app was created by Moomin Wani.`;


export const getIntentAndResponse = async (prompt: string): Promise<{ responseText: string, action: AIAction | null }> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API key not found. Please select an API key to use AI features.");
        }
        const ai = new GoogleGenAI({ apiKey });

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{
                    functionDeclarations: [navigateToPage, navigateToSurah, navigateToSettings]
                }],
            }
        });

        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0]; // Process the first function call
            const { name, args } = call;

            let action: AIAction | null = null;
            let responseText = "Understood. One moment."; // Default confirmation

            if (name === 'navigate_page' && args.page) {
                action = { type: 'navigate_page', payload: { page: args.page as Page } };
                responseText = `Navigating to the ${args.page} page.`;
            } else if (name === 'navigate_surah' && args.surahNumber) {
                action = { type: 'navigate_surah', payload: { surahNumber: args.surahNumber, startPlayback: !!args.startPlayback } };
                responseText = args.startPlayback 
                    ? `Playing Surah number ${args.surahNumber}.` 
                    : `Opening Surah number ${args.surahNumber}.`;
            } else if (name === 'navigate_settings') {
                action = { type: 'navigate_settings', payload: {} };
                responseText = "Opening settings for you.";
            }

            return { responseText, action };
        }

        // If no function call, but we got a text response
        const textResponse = response.text;
        if (textResponse) {
            return {
                responseText: textResponse,
                action: { type: 'info', payload: {} } // It's an informational response
            };
        }

        // Fallback if there's no text and no function call
        return {
            responseText: "Sorry, I'm having trouble understanding. Could you please rephrase?",
            action: null
        };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Re-throw the error so UI components can handle it, e.g., by prompting for an API key.
        throw error;
    }
};