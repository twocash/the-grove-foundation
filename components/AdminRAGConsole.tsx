import React, { useState, useEffect } from 'react';

const AdminRAGConsole: React.FC = () => {
    const [files, setFiles] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [previewContext, setPreviewContext] = useState('');

    const refreshFiles = () => {
        fetch('/api/admin/knowledge')
            .then(res => res.json())
            .then(data => setFiles(data.files || []));

        fetch('/api/context')
            .then(res => res.json())
            .then(data => setPreviewContext(data.context || ''));
    };

    useEffect(() => { refreshFiles(); }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);

        const file = e.target.files[0];
        // FORCE the 'knowledge/' prefix here so the server organizes it correctly
        const filename = `knowledge/${file.name}`;

        try {
            // Re-using your existing generic upload endpoint
            await fetch(`/api/admin/upload?filename=${filename}`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: file
            });
            alert('Knowledge uploaded!');
            refreshFiles();
        } catch (err) {
            alert('Upload failed');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Delete ${filename}?`)) return;
        await fetch(`/api/admin/knowledge/${filename}`, { method: 'DELETE' });
        refreshFiles();
    };

    return (
        <div className="p-6 bg-white rounded shadow border border-gray-200">
            <h2 className="font-bold text-xl mb-6">🧠 Knowledge Base (RAG)</h2>
            <p className="text-sm text-gray-500 mb-6">
                Upload <code>.md</code> or <code>.txt</code> files here. They are automatically concatenated into the "System Prompt" for the Terminal.
            </p>

            {/* Upload Area */}
            <div className="mb-8 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors">
                <input
                    type="file"
                    id="rag-upload"
                    className="hidden"
                    accept=".md,.txt"
                    onChange={handleFileUpload}
                />
                <label htmlFor="rag-upload" className="cursor-pointer block w-full h-full">
                    <div className="text-4xl mb-2">📄</div>
                    <span className="font-bold text-gray-600 block">Click to Upload Knowledge</span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Markdown or Text Files Only</span>
                </label>
                {uploading && <div className="mt-4 text-green-600 font-mono text-xs">UPLOADING...</div>}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* File List */}
                <div>
                    <h3 className="font-mono text-xs uppercase text-gray-400 mb-4">Active Files</h3>
                    <ul className="border border-gray-200 rounded divide-y divide-gray-100 bg-gray-50">
                        {files.map(f => (
                            <li key={f.name} className="p-3 flex justify-between items-center hover:bg-white transition-colors">
                                <span className="font-mono text-sm truncate max-w-[200px]" title={f.name}>{f.name}</span>
                                <button onClick={() => handleDelete(f.name)} className="text-red-400 hover:text-red-600 px-2 font-bold">×</button>
                            </li>
                        ))}
                        {files.length === 0 && <li className="p-4 text-gray-400 text-sm italic">No knowledge files yet.</li>}
                    </ul>
                </div>

                {/* Live Preview */}
                <div>
                    <h3 className="font-mono text-xs uppercase text-gray-400 mb-4">Combined System Prompt Preview</h3>
                    <div className="h-64 overflow-y-auto bg-gray-900 text-green-400 p-4 font-mono text-xs rounded border border-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {previewContext || "// System context is empty."}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRAGConsole;
