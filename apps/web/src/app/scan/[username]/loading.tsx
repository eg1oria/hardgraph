export default function ScanLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-16">
      <div className="max-w-3xl mx-auto space-y-10 animate-pulse">
        {/* Profile header skeleton */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-surface-light" />
          <div className="space-y-3 text-center sm:text-left">
            <div className="h-9 w-48 rounded-lg bg-surface-light" />
            <div className="h-5 w-64 rounded bg-surface-light" />
          </div>
        </div>

        {/* Radar chart skeleton */}
        <div className="rounded-xl border border-border bg-surface/80 p-6">
          <div className="h-4 w-24 rounded bg-surface-light mb-4" />
          <div className="h-[300px] rounded-lg bg-surface-light" />
        </div>

        {/* Top skills skeleton */}
        <div>
          <div className="h-4 w-20 rounded bg-surface-light mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface/80 p-4 h-20" />
            ))}
          </div>
        </div>

        {/* Category bars skeleton */}
        <div className="space-y-6">
          <div className="h-4 w-24 rounded bg-surface-light" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-surface-light" />
                <div className="h-4 w-10 rounded bg-surface-light" />
              </div>
              <div className="h-2.5 rounded-full bg-surface-light" />
              <div className="flex gap-1.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-6 w-20 rounded-full bg-surface-light" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
