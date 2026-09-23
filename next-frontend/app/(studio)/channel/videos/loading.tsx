// Esqueleto com a mesma moldura da tabela real, para a troca não deslocar o
// layout quando os dados chegam.
export default function ChannelVideosLoading() {
  return (
    <div className="flex flex-col gap-6 px-12 py-12">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 animate-pulse rounded-[var(--radius-2)] bg-muted" />
        <div className="h-10 w-44 animate-pulse rounded-[var(--radius-3)] bg-muted" />
      </div>

      <div
        aria-busy="true"
        aria-label="Carregando seus vídeos"
        role="status"
        className="overflow-hidden rounded-[var(--radius-4)] border border-border bg-card"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex h-22 items-center gap-4 border-b border-border px-6 last:border-b-0"
          >
            <div className="h-14 w-25 shrink-0 animate-pulse rounded-[var(--radius-2)] bg-muted" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-64 animate-pulse rounded-[var(--radius-1)] bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded-[var(--radius-1)] bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
