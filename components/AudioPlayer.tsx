
import React, { useState, useRef, useEffect } from 'react';
import { AUDIO_MANIFEST, AUDIO_PLAYERS } from '../data/audioConfig';

// Default to the Main Village Hero player if no props provided
const DEFAULT_PLAYER_ID = 'main-village-hero';

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Find Player Config
  const playerConfig = AUDIO_PLAYERS.find(p => p.id === DEFAULT_PLAYER_ID);

  // 2. Find Track from Player Config
  const track = playerConfig
    ? AUDIO_MANIFEST.find(t => t.id === playerConfig.trackId)
    : null;

  useEffect(() => {
    if (!audioRef.current || !track?.bucketUrl) return;

    const audio = audioRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: any) => {
      console.error("Audio Playback Error:", e);
      console.error("Error Code:", audio.error?.code);
      console.error("Error Message:", audio.error?.message);
      setIsPlaying(false);
      alert("Playback Failed: " + (audio.error?.message || "Unknown Error. Check Console."));
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [track]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Play prevented:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  if (!track) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 py-3 px-6 flex justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">

      {/* Hidden Audio Element sourcing directly from Bucket */}
      {track.bucketUrl ? (
        <audio
          ref={audioRef}
          src={track.bucketUrl}
          preload="auto"
          crossOrigin="anonymous" // Helpful for CORS if needed, though GCS public usually fine
        />
      ) : (
        // Fallback or warning if no URL is configured yet
        <div className="hidden">No Audio Configured</div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          disabled={!track.bucketUrl}
          className={`w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm ${!track.bucketUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          )}
        </button>
        <div className="flex flex-col">
          <span className="text-[9px] font-mono uppercase text-gray-400 tracking-[0.2em] mb-0.5">
            {track.bucketUrl ? "Deep Dive Briefing" : "Briefing Offline"}
          </span>
          <span className="font-display font-bold text-gray-900 text-sm">
            {track.title}
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-1">
        {/* Waveform Animation */}
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className={`w-0.5 bg-gray-200 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse bg-green-700/60' : ''}`}
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