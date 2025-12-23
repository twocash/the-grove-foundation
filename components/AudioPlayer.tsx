import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { AudioManifest, AudioTrack } from '../types';

// The ID of the placement this player is responsible for
const PLACEMENT_ID = 'deep-dive-main';

/**
 * AudioPlayer Component (CMS + Classic Style)
 * Features: Fixed Header, Waveform, Minimal UI
 * Sprint: active-grove-v1 Fix #8 - splitMode prop for 50% width in split layout
 */
interface AudioPlayerProps {
  splitMode?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ splitMode = false }) => {
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(true);

  // FETCH MANIFEST ON MOUNT
  useEffect(() => {
    const MANIFEST_URL = '/api/manifest';

    setLoading(true);
    fetch(MANIFEST_URL)
      .then(res => res.json())
      .then((data: AudioManifest) => {
        const trackId = data.placements[PLACEMENT_ID];
        if (trackId && data.tracks[trackId]) {
          setTrack(data.tracks[trackId]);
        } else {
          console.log("No track assigned to placement:", PLACEMENT_ID);
        }
      })
      .catch(err => {
        console.error("Audio config load failed", err);
        setError("Failed to load");
      })
      .finally(() => setLoading(false));
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error("Playback failed", err);
            setError("Error");
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return null; // Don't show header until loaded to prevent jump
  }

  if (!track) {
    return null; // Don't show if no audio
  }

  return (
    <div className={`fixed top-0 left-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 py-3 px-6 flex justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] print:hidden transition-all duration-700 ease-out ${
      splitMode
        ? 'w-1/2 md:w-[60%] lg:w-1/2'  // Match content-rail widths at each breakpoint
        : 'right-0'
    }`}>

      {/* LEFT: Controls & Info */}
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm group"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex flex-col">
          <span className="text-[9px] font-mono uppercase text-gray-400 tracking-[0.2em] mb-0.5">
            Deep Dive Briefing
          </span>
          <span className="font-serif font-bold text-gray-900 text-sm leading-none">
            {track.title}
          </span>
        </div>
      </div>

      {/* ERROR DISPLAY (If any) */}
      {error && (
        <div className="absolute left-1/2 transform -translate-x-1/2 text-red-500 text-[10px] font-mono uppercase tracking-widest bg-red-50 px-2 py-1 rounded">
          Playback Error
        </div>
      )}

      {/* RIGHT: Waveform Animation */}
      <div className="hidden md:flex items-center space-x-1.5 h-8">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className={`w-0.5 rounded-full transition-all duration-300 ${isPlaying ? 'bg-green-600 animate-pulse' : 'bg-gray-200'
              }`}
            style={{
              height: isPlaying ? `${Math.max(4, Math.random() * 24)}px` : '4px',
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={track.bucketUrl}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error("Audio Error", e);
          setError("Err");
        }}
        className="hidden"
      />
    </div>
  );
};

export default AudioPlayer;