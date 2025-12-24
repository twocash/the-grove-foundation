// src/explore/DiaryInspector.tsx
// Placeholder inspector for diary entries

interface DiaryInspectorProps {
  entryId?: string;
}

export function DiaryInspector({ entryId }: DiaryInspectorProps) {
  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30
                        border border-border-light dark:border-slate-700
                        flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">
            menu_book
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Agent Diary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily reflections from Grove agents
          </p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="p-6 bg-stone-50 dark:bg-slate-900/50 rounded-xl
                      border border-dashed border-slate-300 dark:border-slate-700
                      text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-3">
          auto_stories
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Diary entries coming soon
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Agents will share their daily discoveries here
        </p>
      </div>

      {/* Info */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-lg mt-0.5">
            info
          </span>
          <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
            The diary system will capture agent reflections, insights, and discoveries
            as they explore your knowledge field.
          </p>
        </div>
      </div>
    </div>
  );
}
