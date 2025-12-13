import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { DEEP_DIVE_SCRIPT } from '../constants';

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [hasError, setHasError] = useState(false);

  // Helper functions for decoding audio data from Gemini
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    // Note: Gemini output is raw PCM, but usually with a header if we ask for WAV? 
    // The guidelines say raw PCM. However, let's try to interpret as standard.
    // If raw PCM:
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        // Little-endian
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const fetchAndGenerateAudio = async () => {
    if (!process.env.API_KEY) {
      console.error("API_KEY not found");
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [
            { 
                parts: [{ text: DEEP_DIVE_SCRIPT }] 
            }
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                { speaker: 'Host', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } } },
                { speaker: 'Expert', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
              ]
            }
          }
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = ctx;
        
        const bytes = decode(base64Audio);
        const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
        setAudioBuffer(buffer);
        playBuffer(buffer, ctx);
      } else {
        throw new Error("No audio data returned");
      }

    } catch (e) {
      console.error("Audio generation failed", e);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer, ctx: AudioContext) => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      // Pause/Stop
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
        setIsPlaying(false);
      }
    } else {
      // Play
      if (audioBuffer && audioContextRef.current) {
        audioContextRef.current.resume();
        setIsPlaying(true);
      } else {
        fetchAndGenerateAudio();
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-ink/5 py-3 px-6 flex justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center space-x-4">
        <button 
          onClick={togglePlay}
          disabled={isLoading}
          className={`w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center hover:bg-grove-forest transition-colors shadow-sm ${isLoading ? 'opacity-70 cursor-wait' : ''} ${hasError ? 'bg-red-500 hover:bg-red-600' : ''}`}
        >
          {isLoading ? (
             <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          )}
        </button>
        <div className="flex flex-col">
           <span className="text-[9px] font-mono uppercase text-ink-muted tracking-[0.2em] mb-0.5">Deep Dive Briefing</span>
           <span className="font-display font-bold text-ink text-sm">
             {hasError ? "Generation Failed - Check API Key" : "The Grove: Official Audio Summary"}
           </span>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-1">
         {/* Waveform */}
         {[...Array(16)].map((_, i) => (
             <div 
               key={i} 
               className={`w-0.5 bg-ink/20 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse bg-grove-forest/60' : ''}`}
               style={{ 
                 height: isPlaying ? `${Math.random() * 20 + 8}px` : '4px',
                 animationDelay: `${i * 0.1}s`
               }}
             ></div>
         ))}
      </div>
    </div>
  );
};

export default AudioPlayer;