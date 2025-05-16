// Google Cloud Text-to-Speech service

// Set API key from environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_TTS_API_KEY || '';

interface TextToSpeechOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
  ssmlGender?: 'NEUTRAL' | 'MALE' | 'FEMALE';
}

export const googleTTSService = {
  async synthesizeSpeech(options: TextToSpeechOptions): Promise<{ audioContent: string; success: boolean }> {
    try {
      if (!API_KEY) {
        console.warn('No Google TTS API key found. Will use browser TTS fallback.');
        return { audioContent: '', success: false };
      }

      // Google Cloud Text-to-Speech API endpoint
      const endpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
      
      // Prepare request payload
      const payload = {
        input: {
          text: options.text
        },
        voice: {
          languageCode: options.languageCode || 'en-US',
          name: options.voiceName || 'en-US-Neural2-F', // default to female neural voice
          ssmlGender: options.ssmlGender || 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      };
      
      // Make API request
      const response = await fetch(`${endpoint}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google TTS API error:', errorData);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      // Get audio content as base64
      const data = await response.json();
      return { audioContent: data.audioContent, success: true };
    } catch (error) {
      console.error('Error calling Google Text-to-Speech API:', error);
      return { audioContent: '', success: false };
    }
  },
  
  // Helper function to play the audio
  playAudio(base64Audio: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Convert base64 to array buffer
        const binaryString = window.atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create an audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Decode the array buffer to an audio buffer
        audioContext.decodeAudioData(bytes.buffer, (buffer) => {
          // Create audio source
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          
          // Play the audio
          source.onended = () => {
            resolve();
          };
          source.start(0);
        }, (error) => {
          console.error('Error decoding audio data:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Error playing audio:', error);
        reject(error);
      }
    });
  },
  
  // Get available Google voices
  async getVoicesList(languageCode: string = 'en-US'): Promise<string[]> {
    try {
      if (!API_KEY) {
        return [];
      }
      
      const endpoint = `https://texttospeech.googleapis.com/v1/voices?key=${API_KEY}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filter by language code and return voice names
      return data.voices
        .filter((voice: any) => voice.languageCodes.includes(languageCode))
        .map((voice: any) => voice.name);
    } catch (error) {
      console.error('Error getting Google TTS voices:', error);
      return [];
    }
  }
};

// Define AudioContext type for global window object
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
} 