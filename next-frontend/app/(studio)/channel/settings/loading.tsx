export default function ChannelSettingsLoading() {
  return (
    <div className="flex justify-center px-8 py-12">
      <div
        role="status"
        aria-busy="true"
        aria-label="Carregando as configurações do canal"
        className="flex w-full max-w-[520px] flex-col gap-6 rounded-[var(--radius-2)] border border-border bg-card p-8"
      >
        <div className="h-6 w-40 animate-pulse rounded-[var(--radius-1)] bg-muted" />
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <div className="h-3 w-28 animate-pulse rounded-[var(--radius-1)] bg-muted" />
            <div className="h-9 w-full animate-pulse rounded-[var(--radius-2)] bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
