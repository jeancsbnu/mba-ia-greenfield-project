import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

// Quantas páginas numeradas aparecem de cada vez, centradas na atual.
const PAGE_WINDOW = 5

type FeedPaginationProps = {
  page: number
  lastPage: number
  /** Monta o href de uma página preservando os filtros da listagem. */
  hrefFor: (page: number) => string
  className?: string
}

function pageWindow(page: number, lastPage: number): number[] {
  const start = Math.max(1, Math.min(page - 2, lastPage - PAGE_WINDOW + 1))
  const end = Math.min(lastPage, start + PAGE_WINDOW - 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

// Paginação numerada por URL da home e dos resultados (home-busca/TD-02):
// "Anterior · 1 · 2 · 3 · Próxima", com as pontas em aria-disabled. Quem
// renderiza decide se ela aparece (só com mais de uma página) e monta os
// hrefs com os filtros que precisam sobreviver à troca de página.
function FeedPagination({
  page,
  lastPage,
  hrefFor,
  className,
}: FeedPaginationProps) {
  const hasPrevious = page > 1
  const hasNext = page < lastPage

  return (
    <Pagination className={cn("justify-center sm:justify-end", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hrefFor(Math.max(1, page - 1))}
            aria-disabled={!hasPrevious}
            tabIndex={hasPrevious ? undefined : -1}
            className={hasPrevious ? undefined : "pointer-events-none opacity-50"}
          />
        </PaginationItem>
        {pageWindow(page, lastPage).map((number) => (
          <PaginationItem key={number}>
            <PaginationLink href={hrefFor(number)} isActive={number === page}>
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={hrefFor(Math.min(lastPage, page + 1))}
            aria-disabled={!hasNext}
            tabIndex={hasNext ? undefined : -1}
            className={hasNext ? undefined : "pointer-events-none opacity-50"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export { FeedPagination }
