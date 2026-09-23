export default function PublicChannelLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o canal"
      className="flex flex-col gap-6 px-12 py-12"
    >
      <div className="flex items-center gap-4">
        <div className="size-20 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-8 w-56 animate-pulse rounded-[var(--radius-1)] bg-muted" />
          <div className="h-3 w-40 animate-pulse rounded-[var(--radius-1)] bg-muted" />
        </div>
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="aspect-video w-full animate-pulse rounded-[var(--radius-2)] bg-muted" />
            <div className="h-4 w-full animate-pulse rounded-[var(--radius-1)] bg-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded-[var(--radius-1)] bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
