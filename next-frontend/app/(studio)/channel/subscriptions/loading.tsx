// Esqueleto com a mesma moldura da lista real, para a troca não deslocar o
// layout quando os dados chegam.
export default function ChannelSubscriptionsLoading() {
  return (
    <div className="flex flex-col gap-6 px-12 py-12">
      <div className="flex flex-col gap-1.5">
        <div className="h-8 w-72 animate-pulse rounded-[var(--radius-2)] bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded-[var(--radius-1)] bg-muted" />
      </div>

      <div
        aria-busy="true"
        aria-label="Carregando os canais que você segue"
        role="status"
        className="flex flex-col gap-3"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-[var(--radius-4)] border border-border bg-card px-5 py-4"
          >
            <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-40 animate-pulse rounded-[var(--radius-1)] bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded-[var(--radius-1)] bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
