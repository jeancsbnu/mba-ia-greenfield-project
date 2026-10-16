// Grade-esqueleto dos vídeos do canal, no lugar da grade enquanto a lista
// carrega. O cabeçalho não tem esqueleto: o canal é lido antes de a página
// começar a ser transmitida, para o canal inexistente responder 404.
function ChannelVideosSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando os vídeos do canal"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="aspect-video w-full animate-pulse rounded-[var(--radius-2)] bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-[var(--radius-1)] bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded-[var(--radius-1)] bg-muted" />
        </div>
      ))}
    </div>
  )
}

export { ChannelVideosSkeleton }
