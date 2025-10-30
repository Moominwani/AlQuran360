export const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
        if ('speechSynthesis' in window && text) {
            // Cancel any ongoing speech before starting a new one
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
            // Resolve the promise when speech ends
            utterance.onend = () => {
                resolve();
            };
            
            // Handle cases where speaking doesn't start
            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
                resolve(); // Resolve even on error to not block the app
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            if (!text) {
                console.warn('TTS: Received empty text to speak.');
            } else {
                console.warn('Text-to-speech not supported in this browser.');
            }
            resolve(); // Resolve immediately if not supported or text is empty
        }
    });
};

export const cancelSpeech = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};
