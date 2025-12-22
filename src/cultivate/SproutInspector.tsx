// src/cultivate/SproutInspector.tsx
// Sprout detail and action inspector panel

import { useState } from 'react';
import { useSproutStorage } from '../../hooks/useSproutStorage';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { Sprout } from '../core/schema/sprout';

interface SproutInspectorProps {
  sproutId: string;
}

export function SproutInspector({ sproutId }: SproutInspectorProps) {
  const { getSprouts, updateSprout, deleteSprout } = useSproutStorage();
  const { getPersona, getJourney } = useNarrativeEngine();
  const { closeInspector } = useWorkspaceUI();

  const sprouts = getSprouts();
  const sprout = sprouts.find((s) => s.id === sproutId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [copied, setCopied] = useState(false);

  if (!sprout) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Sprout not found</p>
      </div>
    );
  }

  // Get related data
  const persona = sprout.personaId ? getPersona(sprout.personaId) : null;
  const journey = sprout.journeyId ? getJourney(sprout.journeyId) : null;
  const capturedDate = new Date(sprout.capturedAt);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sprout.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleStartEdit = () => {
    setEditTags(sprout.tags.join(', '));
    setEditNotes(sprout.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const newTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    updateSprout(sproutId, {
      tags: newTags,
      notes: editNotes || null,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this sprout? This cannot be undone.')) {
      deleteSprout(sproutId);
      closeInspector();
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-border-light dark:border-slate-700 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">
            eco
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sprout
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {capturedDate.toLocaleDateString()} at{' '}
            {capturedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span
          className={`
            px-2 py-0.5 text-xs rounded-full
            ${sprout.status === 'sprout' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : ''}
            ${sprout.status === 'sapling' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : ''}
            ${sprout.status === 'tree' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : ''}
          `}
        >
          {sprout.status}
        </span>
      </div>

      {/* Query */}
      <div className="p-3 bg-stone-50 dark:bg-slate-900/50 rounded-lg border border-border-light dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
          Your Question
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">{sprout.query}</p>
      </div>

      {/* Response */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Response
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-border-light dark:border-slate-700 max-h-48 overflow-y-auto">
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {sprout.response}
          </p>
        </div>
      </div>

      {/* Tags & Notes */}
      {isEditing ? (
        <div className="space-y-4 p-4 bg-stone-50 dark:bg-slate-900/50 rounded-xl border border-border-light dark:border-slate-700">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="e.g., ratchet, insight, important"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add your thoughts..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="py-2 px-3 rounded-lg text-sm font-medium border border-border-light dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tags */}
          {sprout.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sprout.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-stone-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {sprout.notes && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/50">
              <p className="text-xs text-amber-700 dark:text-amber-300 italic">
                "{sprout.notes}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Provenance */}
      <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Context
        </p>
        <div className="space-y-1.5 text-xs">
          {persona && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>Lens: {persona.publicLabel}</span>
            </div>
          )}
          {journey && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-sm">map</span>
              <span>Journey: {journey.title}</span>
            </div>
          )}
          {sprout.hubId && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-sm">hub</span>
              <span>Topic: {sprout.hubId}</span>
            </div>
          )}
          {!persona && !journey && !sprout.hubId && (
            <div className="text-slate-500 dark:text-slate-500 italic">
              Freestyle exploration
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleStartEdit}
          className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-border-light dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-700 transition-all"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  );
}
