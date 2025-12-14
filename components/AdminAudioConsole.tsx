import React, { useState, useEffect } from 'react';
import { AUDIO_MANIFEST } from '../data/audioConfig';
import { generateAudioBlob } from '../services/audioService';

const AdminAudioConsole: React.FC = () => {
    const [selectedTrackId, setSelectedTrackId] = useState<string>(AUDIO_MANIFEST[0].id);
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<string>('');

    // Cloud State
    const [files, setFiles] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Editable state
    const currentTrack = AUDIO_MANIFEST.find(t => t.id === selectedTrackId);
    const [script, setScript] = useState(currentTrack?.transcript || '');

    // Load Cloud Files
    useEffect(() => {
        fetch('/api/admin/files')
            .then(res => res.json())
            .then(data => setFiles(data.files || []))
            .catch(err => console.error("Failed to load files:", err));
    }, [refreshTrigger]);

    const handleGenerateAndUpload = async () => {
        if (!currentTrack) return;
        setIsGenerating(true);
        setStatus('Initializing Client-Side Generation...');

        // Default filename convention: trackId_timestamp.wav
        // We use .wav because the client-side generator creates a WAV blob
        const filename = `${selectedTrackId}_${Date.now()}.wav`;

        try {
            // 1. Generate in Browser (No Timeout Limit)
            setStatus('Synthesizing Audio (Gemini)...');
            const blob = await generateAudioBlob(script, currentTrack.voiceConfig);

            console.log("Generated Blob Size:", blob.size, "Type:", blob.type);

            if (blob.size === 0) {
                throw new Error("Generated audio is empty (0 bytes).");
            }

            // 2. Upload to Server
            setStatus(`Uploading (${(blob.size / 1024).toFixed(1)} KB)...`);

            // Note: server.js expects 'filename' as a query param and raw body
            const res = await fetch(`/api/admin/upload?filename=${filename}`, {
                method: 'POST',
                headers: { 'Content-Type': blob.type || 'audio/wav' }, // Send actual type
                body: blob
            });

            if (!res.ok) {
                const text = await res.text();
                let err;
                try { err = JSON.parse(text).error; } catch { err = text; }
                throw new Error(err || 'Upload server error');
            }

            const data = await res.json();
            setStatus('Success!');
            alert(`Success! File generated & uploaded: ${data.url}`);
            setRefreshTrigger(prev => prev + 1); // Reload list

        } catch (e: any) {
            console.error(e);
            setStatus('Error: ' + e.message);
            alert("Process failed: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied URL to clipboard!");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-12 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 border-b border-gray-200 pb-6 flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-3xl">Audio Admin Console</h1>
                        <p className="text-gray-500 mt-2">Hybrid Generator: Client-Side Synthesis → Server-Side Storage</p>
                    </div>
                    <a href="/" className="text-xs font-mono uppercase tracking-widest hover:text-green-600">
                        ← Back to App
                    </a>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column: Configuration */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                            <label className="block text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">Select Track</label>
                            <select
                                value={selectedTrackId}
                                onChange={(e) => {
                                    setSelectedTrackId(e.target.value);
                                    const t = AUDIO_MANIFEST.find(track => track.id === e.target.value);
                                    if (t) setScript(t.transcript);
                                }}
                                className="w-full p-2 border border-gray-200 rounded-sm bg-gray-50 mb-4"
                            >
                                {AUDIO_MANIFEST.map(track => (
                                    <option key={track.id} value={track.id}>{track.title} ({track.status})</option>
                                ))}
                            </select>

                            <label className="block text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">Transcript</label>
                            <textarea
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                className="w-full h-96 p-4 border border-gray-200 rounded-sm font-serif text-sm leading-relaxed focus:outline-none focus:border-green-600"
                            />
                        </div>
                    </div>

                    {/* Right Column: Action & Library */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                            <h3 className="font-bold text-xl mb-6">Action & Library</h3>

                            <div className="mb-8">
                                <button
                                    onClick={handleGenerateAndUpload}
                                    disabled={isGenerating}
                                    className="w-full px-6 py-4 bg-green-900 text-white font-mono text-sm uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex justify-center items-center"
                                    style={{ backgroundColor: '#2f4f4f' }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {status}
                                        </>
                                    ) : 'Generate & Upload to Cloud'}
                                </button>
                                <div className="flex justify-between mt-2">
                                    <p className="text-xs text-gray-400">Gen: Client (No Timeout)</p>
                                    <p className="text-xs text-gray-400">Store: Server (Secure)</p>
                                </div>
                            </div>

                            <hr className="border-gray-100 my-6" />

                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Cloud Library (GCS)</h4>
                            <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 font-mono text-xs uppercase">
                                        <tr>
                                            <th className="p-3">Filename</th>
                                            <th className="p-3 text-right">Size</th>
                                            <th className="p-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {files.length === 0 ? (
                                            <tr><td colSpan={3} className="p-4 text-center text-gray-400">No files found.</td></tr>
                                        ) : (
                                            files.map((f, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="p-3 truncate max-w-[200px]" title={f.name}>{f.name}</td>
                                                    <td className="p-3 text-right font-mono text-xs">{(f.size / 1024 / 1024).toFixed(2)} MB</td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => copyToClipboard(f.url)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                                        >
                                                            Copy URL
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-blue-50 p-4 mt-6 rounded-sm border border-blue-100 text-blue-800 text-xs">
                                <strong>Next Step:</strong> Copy the URL of your generated file and paste it into <code>src/data/audioConfig.ts</code> locally, then commit.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAudioConsole;
