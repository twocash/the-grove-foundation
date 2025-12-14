import React, { useState, useEffect } from 'react';
import { NarrativeGraph } from '../types';
import NarrativeGraphView from './NarrativeGraphView';

const AdminNarrativeConsole: React.FC = () => {
    const [graph, setGraph] = useState<NarrativeGraph | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
    const [jsonContent, setJsonContent] = useState('');

    // Load on Mount
    useEffect(() => {
        fetch('/api/narrative')
            .then(res => res.json())
            .then(data => {
                // Ensure valid structure if file was empty
                if (!data.nodes) data.nodes = {};
                setGraph(data);
                setJsonContent(JSON.stringify(data, null, 2));
            })
            .catch(err => console.error(err));
    }, []);

    // Sync graph state to JSON when graph changes
    useEffect(() => {
        if (graph) {
            setJsonContent(JSON.stringify(graph, null, 2));
        }
    }, [graph]);

    // 1. Upload & Generate
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setLoading(true);
        setStatus('Dreaming up structure...');

        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            const res = await fetch('/api/admin/generate-narrative', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success && data.graph) {
                // MERGE STRATEGY: Keep existing, add new
                setGraph(prev => ({
                    version: "1.0",
                    nodes: { ...prev?.nodes, ...data.graph.nodes }
                }));
                setStatus('Generated! Review the cards below.');
            } else {
                throw new Error(data.error || 'Generation failed');
            }
        } catch (err: any) {
            setStatus('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. Save Changes
    const handleSave = async () => {
        if (!graph) return;
        setStatus('Saving...');
        try {
            // If in JSON mode, parse from text area
            const dataToSave = viewMode === 'json' ? JSON.parse(jsonContent) : graph;

            const res = await fetch('/api/admin/narrative', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });
            const data = await res.json();
            if (data.success) {
                setStatus('Saved to Production');
                // Sync graph if we saved from JSON mode
                if (viewMode === 'json') {
                    setGraph(dataToSave);
                }
                setTimeout(() => setStatus(''), 3000);
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            if (e instanceof SyntaxError) {
                setStatus('Error: Invalid JSON');
            } else {
                setStatus('Error: ' + e.message);
            }
        }
    };

    // Handle JSON text changes
    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonContent(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            setGraph(parsed);
        } catch {
            // Don't update graph if JSON is invalid
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 text-gray-900">

            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Narrative Engine</h1>
                    <p className="text-gray-500 text-sm mt-1 italic">
                        "Architect the journey, let the AI fill the pages."
                    </p>
                </div>

                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('visual')}
                            className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'visual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            Visual
                        </button>
                        <button
                            onClick={() => setViewMode('json')}
                            className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition-all ${viewMode === 'json' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            JSON
                        </button>
                    </div>

                    {/* File Upload (PDF, Markdown, Text) */}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf,.md,.txt,.markdown"
                            onChange={handleFileUpload}
                            disabled={loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button disabled={loading} className="px-6 py-3 bg-white border border-gray-200 text-gray-900 font-bold uppercase text-xs tracking-widest hover:border-green-500 transition-colors rounded-lg shadow-sm">
                            {loading ? 'Ingesting...' : 'Import File'}
                        </button>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-green-600 text-white font-bold uppercase text-xs tracking-widest hover:bg-gray-900 transition-colors rounded-lg shadow-lg"
                    >
                        Save Graph
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            {status && (
                <div className="fixed top-24 right-8 bg-gray-900 text-white px-4 py-2 rounded text-xs font-mono uppercase tracking-widest animate-pulse z-50">
                    {status}
                </div>
            )}

            {/* Content Area */}
            {viewMode === 'visual' ? (
                /* Visual Editor */
                graph ? (
                    <NarrativeGraphView
                        graph={graph}
                        onUpdateGraph={setGraph}
                    />
                ) : (
                    <div className="text-center py-20 text-gray-500 italic">
                        Loading Narrative Matrix...
                    </div>
                )
            ) : (
                /* JSON Editor */
                <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col h-[800px]">
                    <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
                        <span className="text-xs font-mono text-gray-400">narratives.json</span>
                        <span className="text-xs font-mono text-gray-500">
                            {(() => {
                                try {
                                    const parsed = JSON.parse(jsonContent);
                                    return `${Object.keys(parsed.nodes || {}).length} nodes`;
                                } catch {
                                    return 'Invalid JSON';
                                }
                            })()}
                        </span>
                    </div>
                    <textarea
                        className="flex-1 w-full bg-gray-900 text-green-400 font-mono text-xs p-4 focus:outline-none resize-none"
                        value={jsonContent}
                        onChange={handleJsonChange}
                        spellCheck={false}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminNarrativeConsole;
