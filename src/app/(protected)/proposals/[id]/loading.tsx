export default function ProposalLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex justify-end">
        <div className="h-9 w-28 bg-muted animate-pulse rounded" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="h-12 bg-muted/30 animate-pulse border-b" />
        <div className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div
                className="h-4 bg-muted animate-pulse rounded"
                style={{ width: `${70 + Math.random() * 30}%` }}
              />
              <div
                className="h-4 bg-muted animate-pulse rounded"
                style={{ width: `${50 + Math.random() * 40}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
