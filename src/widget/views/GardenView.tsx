// src/widget/views/GardenView.tsx
// Garden mode content - placeholder for Sprout gallery

export function GardenView() {
  return (
    <div className="garden-view flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4">🌱</div>
      <h2 className="text-2xl font-semibold text-[var(--grove-text)] mb-2">
        Your Garden
      </h2>
      <p className="text-[var(--grove-text-muted)] max-w-md">
        Watch your captured insights grow. Sprouts you plant in Explore mode
        will appear here, organized by growth stage.
      </p>
      <div className="mt-8 p-4 rounded-lg bg-[var(--grove-surface)] border border-[var(--grove-border)]">
        <p className="text-[var(--grove-text-dim)] text-sm">
          No sprouts yet. Use <code className="text-[var(--grove-accent)]">/sprout</code> in Explore mode to capture insights.
        </p>
      </div>
    </div>
  );
}
