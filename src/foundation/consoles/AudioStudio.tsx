// src/foundation/consoles/AudioStudio.tsx
// Foundation-styled Audio TTS generation and management console

import React, { useState, useEffect } from 'react';
import { DataPanel } from '../components/DataPanel';
import { GlowButton } from '../components/GlowButton';
import { MetricCard } from '../components/MetricCard';
import {
  Music,
  Mic,
  Play,
  Upload,
  Library,
  Settings,
  RefreshCw,
  Save
} from 'lucide-react';
import { generateAudioBlob } from '../../../services/audioService';
import { AudioManifest, AudioTrack } from '../../../types';

const AVAILABLE_VOICES = ['Kore', 'Orus', 'Gacrux', 'Umbriel'];
const DEFAULT_MANIFEST: AudioManifest = { version: "1.0", placements: {}, tracks: {} };

const AudioStudio: React.FC = () => {
  const [manifest, setManifest] = useState<AudioManifest>(DEFAULT_MANIFEST);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');

  // Editor State
  const [selectedVoiceHost, setSelectedVoiceHost] = useState('Orus');
  const [selectedVoiceExpert, setSelectedVoiceExpert] = useState('Kore');
  const [script, setScript] = useState('');
  const [title, setTitle] = useState('New Episode');

  // Load Manifest on Mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/manifest')
      .then(res => res.json())
      .then(data => {
        setManifest(data);
      })
      .catch(err => {
        console.error("Failed to load manifest", err);
        setStatus('Error loading manifest');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateAndSave = async () => {
    setGenerating(true);
    setStatus('Generating Audio...');

    try {
      // 1. Generate Audio
      const blob = await generateAudioBlob(script, {
        host: selectedVoiceHost,
        expert: selectedVoiceExpert
      });

      // 2. Upload File to GCS
      setStatus('Uploading WAV...');
      const trackId = `track_${Date.now()}`;
      const filename = `${trackId}.wav`;

      const uploadRes = await fetch(`/api/admin/upload?filename=${filename}`, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav' },
        body: blob
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.url) throw new Error("Upload failed");

      // 3. Update Manifest
      const newTrack: AudioTrack = {
        id: trackId,
        title: title,
        description: "Generated via Foundation Audio Studio",
        voiceConfig: { host: selectedVoiceHost, expert: selectedVoiceExpert },
        transcript: script,
        bucketUrl: uploadData.url,
        createdAt: Date.now()
      };

      const updatedManifest = {
        ...manifest,
        tracks: { ...manifest.tracks, [trackId]: newTrack }
      };

      setManifest(updatedManifest);

      // 4. Save Manifest to Server
      setStatus('Saving Manifest...');
      await fetch('/api/admin/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedManifest)
      });

      setStatus('Track saved successfully');
      setTimeout(() => setStatus(''), 3000);

      // Reset form
      setScript('');
      setTitle('New Episode');

    } catch (e: any) {
      setStatus('Error: ' + e.message);
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignPlacement = async (placementKey: string, trackId: string) => {
    const updatedManifest = {
      ...manifest,
      placements: { ...manifest.placements, [placementKey]: trackId }
    };
    setManifest(updatedManifest);

    try {
      await fetch('/api/admin/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedManifest)
      });
      setStatus('Placement updated');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      console.error("Failed to save placement", e);
      setStatus('Error saving placement');
    }
  };

  const tracks = Object.values(manifest.tracks).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-1">
            Audio Studio
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            TTS generation and track management
          </p>
        </div>
        {status && (
          <span className={`text-xs font-mono px-3 py-1 rounded ${
            status.includes('Error') ? 'bg-holo-red/20 text-holo-red' : 'bg-holo-lime/20 text-holo-lime'
          }`}>
            {status}
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Tracks" value={tracks.length} highlight />
        <MetricCard label="Placements" value={Object.keys(manifest.placements).length} />
        <MetricCard label="Voices Available" value={AVAILABLE_VOICES.length} />
        <MetricCard
          label="Status"
          value={generating ? 'Generating' : 'Ready'}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Creator Panel */}
        <DataPanel title="Create New Track" icon={Mic}>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="
                  w-full px-3 py-2 bg-obsidian border border-holo-cyan/20
                  rounded text-sm font-mono text-white
                  focus:outline-none focus:border-holo-cyan/50
                "
              />
            </div>

            {/* Voice Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                  Host Voice
                </label>
                <select
                  value={selectedVoiceHost}
                  onChange={(e) => setSelectedVoiceHost(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-obsidian border border-holo-cyan/20
                    rounded text-sm font-mono text-white
                    focus:outline-none focus:border-holo-cyan/50
                  "
                >
                  {AVAILABLE_VOICES.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                  Expert Voice
                </label>
                <select
                  value={selectedVoiceExpert}
                  onChange={(e) => setSelectedVoiceExpert(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-obsidian border border-holo-cyan/20
                    rounded text-sm font-mono text-white
                    focus:outline-none focus:border-holo-cyan/50
                  "
                >
                  {AVAILABLE_VOICES.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Script */}
            <div>
              <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                Script
              </label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={10}
                placeholder="Host: Hello world..."
                className="
                  w-full px-3 py-2 bg-obsidian border border-holo-cyan/20
                  rounded text-sm font-mono text-white resize-none
                  focus:outline-none focus:border-holo-cyan/50
                "
              />
            </div>

            {/* Generate Button */}
            <GlowButton
              variant="primary"
              icon={Music}
              loading={generating}
              onClick={handleGenerateAndSave}
              disabled={!script.trim()}
              className="w-full"
            >
              {generating ? status : 'Generate & Save'}
            </GlowButton>
          </div>
        </DataPanel>

        {/* Right: Management */}
        <div className="space-y-4">
          {/* Placements */}
          <DataPanel title="Placements" icon={Settings}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-obsidian rounded border border-holo-cyan/10">
                <span className="font-mono text-sm text-white">deep-dive-main</span>
                <select
                  value={manifest.placements['deep-dive-main'] || ''}
                  onChange={(e) => handleAssignPlacement('deep-dive-main', e.target.value)}
                  className="
                    px-2 py-1 bg-obsidian-raised border border-holo-cyan/20
                    rounded text-xs font-mono text-white max-w-[180px]
                    focus:outline-none focus:border-holo-cyan/50
                  "
                >
                  <option value="">(None)</option>
                  {tracks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </DataPanel>

          {/* Library */}
          <DataPanel title={`Library (${tracks.length})`} icon={Library}>
            {tracks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm font-mono">
                No tracks yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto f-scrollbar">
                {tracks.map(track => (
                  <div
                    key={track.id}
                    className="p-3 bg-obsidian rounded border border-holo-cyan/10 hover:border-holo-cyan/30 transition-colors"
                  >
                    <div className="font-medium text-white text-sm">{track.title}</div>
                    <div className="text-xs text-gray-600 font-mono truncate mt-1">
                      {track.id}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-holo-cyan/10 text-holo-cyan rounded">
                        Host: {track.voiceConfig.host}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-holo-magenta/10 text-holo-magenta rounded">
                        Expert: {track.voiceConfig.expert}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2">
                      {new Date(track.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DataPanel>
        </div>
      </div>
    </div>
  );
};

export default AudioStudio;
