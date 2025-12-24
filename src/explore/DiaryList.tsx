// src/explore/DiaryList.tsx
// Placeholder content view for diary entries

export function DiaryList() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <span className="material-symbols-outlined text-6xl text-[var(--grove-text-dim)] mb-4">
        auto_stories
      </span>
      <h2 className="text-xl font-semibold text-[var(--grove-text)] mb-2">
        Agent Diary
      </h2>
      <p className="text-[var(--grove-text-muted)] max-w-md mb-6">
        Daily reflections and discoveries from Grove agents exploring your knowledge field.
      </p>
      <div className="px-4 py-2 border border-[var(--grove-border)] rounded text-[var(--grove-text-dim)] text-sm">
        Coming in Grove 1.0
      </div>
    </div>
  );
}
