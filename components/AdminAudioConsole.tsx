import React, { useState, useEffect } from 'react';
import { generateAudioBlob } from '../services/audioService';
import { AudioManifest, AudioTrack } from '../types';

const AVAILABLE_VOICES = ['Kore', 'Orus', 'Gacrux', 'Umbriel'];
const DEFAULT_MANIFEST: AudioManifest = { version: "1.0", placements: {}, tracks: {} };

const AdminAudioConsole: React.FC = () => {
    // App State
    const [manifest, setManifest] = useState<AudioManifest>(DEFAULT_MANIFEST);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    // Editor State
    const [selectedVoiceHost, setSelectedVoiceHost] = useState('Orus');
    const [selectedVoiceExpert, setSelectedVoiceExpert] = useState('Kore');
    const [script, setScript] = useState('');
    const [title, setTitle] = useState('New Episode');

    // Load Manifest on Mount
    useEffect(() => {
        fetch('/api/manifest')
            .then(res => res.json())
            .then(data => {
                console.log("Loaded manifest:", data);
                setManifest(data);
            })
            .catch(err => console.error("Failed to load manifest", err));
    }, []);

    const handleGenerateAndSave = async () => {
        setLoading(true);
        setStatus('Generating Audio...');

        try {
            // 1. Generate Audio (Client Side calls Gemini)
            // We pass the styles/voices to the service
            const blob = await generateAudioBlob(script, { host: selectedVoiceHost, expert: selectedVoiceExpert });

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

            // 3. Update Manifest Local State
            const newTrack: AudioTrack = {
                id: trackId,
                title: title,
                description: "Generated via Admin Console",
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

            setStatus('Success! Track Saved.');
            alert("Track Generated & Manifest Updated!");

        } catch (e: any) {
            setStatus('Error: ' + e.message);
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPlacement = async (placementKey: string, trackId: string) => {
        const updatedManifest = {
            ...manifest,
            placements: { ...manifest.placements, [placementKey]: trackId }
        };
        setManifest(updatedManifest);

        // Auto-save on placement change
        try {
            await fetch('/api/admin/manifest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedManifest)
            });
        } catch (e) {
            console.error("Failed to save placement", e);
            alert("Failed to save placement");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-12 font-sans text-gray-900">
            <h1 className="text-3xl font-bold mb-8">Antigravity Audio Admin</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* CREATOR PANEL */}
                <div className="bg-white p-6 rounded shadow border border-gray-200">
                    <h2 className="font-bold text-xl mb-6">1. Create New Track</h2>

                    <div className="mb-4">
                        <label className="block text-xs font-mono uppercase text-gray-400">Title</label>
                        <input className="w-full p-2 border rounded" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-mono uppercase text-gray-400">Host Voice</label>
                            <select className="w-full p-2 border rounded" value={selectedVoiceHost} onChange={e => setSelectedVoiceHost(e.target.value)}>
                                {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-mono uppercase text-gray-400">Expert Voice</label>
                            <select className="w-full p-2 border rounded" value={selectedVoiceExpert} onChange={e => setSelectedVoiceExpert(e.target.value)}>
                                {AVAILABLE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-mono uppercase text-gray-400">Script</label>
                        <textarea
                            className="w-full h-64 p-2 border rounded font-mono text-xs"
                            value={script}
                            onChange={e => setScript(e.target.value)}
                            placeholder="Host: Hello world..."
                        />
                    </div>

                    <button
                        onClick={handleGenerateAndSave}
                        disabled={loading}
                        className="w-full py-4 bg-green-800 text-white font-bold uppercase tracking-widest hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? status : "Generate & Save to Library"}
                    </button>
                </div>

                {/* MANAGEMENT PANEL */}
                <div className="space-y-8">
                    {/* Placements */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <h2 className="font-bold text-xl mb-4">2. Manage Placements</h2>
                        <p className="text-xs text-gray-500 mb-4">Select which track plays in specific app slots.</p>

                        <div className="flex items-center justify-between p-4 bg-gray-50 border rounded">
                            <span className="font-mono text-sm font-bold">deep-dive-main</span>
                            <select
                                className="p-2 border rounded text-sm max-w-[200px]"
                                value={manifest.placements['deep-dive-main'] || ''}
                                onChange={(e) => handleAssignPlacement('deep-dive-main', e.target.value)}
                            >
                                <option value="">(None)</option>
                                {Object.values(manifest.tracks).map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.title} ({new Date(t.createdAt).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Library */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <h2 className="font-bold text-xl mb-4">Library ({Object.keys(manifest.tracks).length})</h2>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {Object.values(manifest.tracks).sort((a, b) => b.createdAt - a.createdAt).map(track => (
                                <div key={track.id} className="p-3 border rounded text-sm hover:bg-gray-50">
                                    <div className="font-bold">{track.title}</div>
                                    <div className="text-gray-400 text-xs truncate">{track.bucketUrl}</div>
                                    <div className="mt-1 flex gap-2">
                                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 rounded">Host: {track.voiceConfig.host}</span>
                                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 rounded">Expert: {track.voiceConfig.expert}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAudioConsole;
