import { CategoryFilter } from "@/components/videos/category-filter"

// Carregamento das listagens da home e dos resultados: a faixa de chips e 12
// placeholders no formato do card (home-busca/TD-01, Revision de 2026-10-11).
export default function FeedLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando vídeos"
      className="flex flex-1 flex-col gap-6 py-8"
    >
      <CategoryFilter current={null} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="aspect-video w-full animate-pulse rounded-[var(--radius-2)] bg-muted" />
            <div className="flex gap-2.5">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-full animate-pulse rounded-[var(--radius-1)] bg-muted" />
                <div className="h-3 w-3/4 animate-pulse rounded-[var(--radius-1)] bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
