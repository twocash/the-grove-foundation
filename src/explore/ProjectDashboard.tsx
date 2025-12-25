// src/explore/ProjectDashboard.tsx
// Placeholder dashboard for a Grove Project (field)

export function ProjectDashboard() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <span className="material-symbols-outlined text-6xl text-[var(--glass-text-subtle)] mb-4">
        forest
      </span>
      <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-2">
        Grove Project
      </h2>
      <p className="text-[var(--glass-text-muted)] max-w-md mb-6">
        Your personal knowledge field. Explore lenses, journeys, nodes, and more.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-8 text-left max-w-sm">
        <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
          <span className="material-symbols-outlined text-lg">chat_bubble</span>
          <span className="text-sm">Terminal</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
          <span className="material-symbols-outlined text-lg">eyeglasses</span>
          <span className="text-sm">Lenses</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
          <span className="material-symbols-outlined text-lg">map</span>
          <span className="text-sm">Journeys</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
          <span className="material-symbols-outlined text-lg">account_tree</span>
          <span className="text-sm">Nodes</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
          <span className="material-symbols-outlined text-lg">menu_book</span>
          <span className="text-sm">Diary</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
          <span className="material-symbols-outlined text-lg">eco</span>
          <span className="text-sm">Sprouts</span>
        </div>
      </div>
      <div className="px-4 py-2 border border-[var(--glass-border)] rounded text-[var(--glass-text-subtle)] text-sm">
        Project Dashboard — Coming in Grove 1.0
      </div>
    </div>
  );
}
