import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { FeedPagination } from "@/components/videos/feed-pagination"
import { SearchEmptyState } from "@/components/videos/search-empty-state"
import { VideoGrid } from "@/components/videos/video-grid"
import type { VideoFeedPage } from "@/lib/api/contracts"
import { upstream } from "@/lib/api/upstream"
import { formatVideosCount } from "@/lib/format"
import {
  FEED_PAGE_SIZE,
  parsePage,
  toOffset,
  totalPages,
} from "@/lib/pagination"
import { parseSearchTerm, SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "@/lib/search"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const search = parseSearchTerm((await searchParams).q)
  return search.kind === "empty"
    ? {}
    : { title: `Resultados para “${search.term}” · StreamTube` }
}

function resultsHref(term: string, page: number): string {
  const params = new URLSearchParams({ q: term })
  if (page > 1) params.set("page", String(page))
  return `/results?${params.toString()}`
}

// Resultados da busca: Server Component que lê `GET /videos?q=` direto do
// upstream (home-busca/TD-01). Só vídeos, por recência; o termo casa com o
// título, o nome do canal ou o nickname (home-busca/TD-04 e TD-05). O termo
// vem da URL e entra sempre como texto.
export default async function ResultsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const search = parseSearchTerm(params.q)

  if (search.kind === "empty") {
    redirect("/")
  }

  // Termo fora da faixa não chega ao upstream, que responderia 400.
  if (search.kind === "short" || search.kind === "long") {
    return (
      <div className="flex flex-1 flex-col items-center gap-3 py-16 text-center">
        <p className="text-body-lg text-muted-foreground">
          {search.kind === "short"
            ? `Digite pelo menos ${SEARCH_MIN_LENGTH} caracteres para buscar.`
            : `Use no máximo ${SEARCH_MAX_LENGTH} caracteres para buscar.`}
        </p>
      </div>
    )
  }

  const page = parsePage(params.page)
  const { data, error } = await upstream.GET("/videos", {
    params: {
      query: {
        q: search.term,
        offset: toOffset(page, FEED_PAGE_SIZE),
        limit: FEED_PAGE_SIZE,
      },
    },
  })
  if (error || !data) {
    throw new Error("Falha ao carregar os resultados da busca")
  }
  const feed: VideoFeedPage = data

  // Zero resultados não é erro: o estado vazio ocupa o lugar do título, da
  // grade e da paginação (home-busca/TD-05).
  if (feed.total === 0) {
    return (
      <div className="flex flex-1 flex-col py-8">
        <SearchEmptyState q={search.term} />
      </div>
    )
  }

  const lastPage = totalPages(feed.total, FEED_PAGE_SIZE)

  return (
    <div className="flex flex-1 flex-col gap-6 py-8">
      <header data-slot="results-heading" className="flex flex-col gap-1">
        <h1 className="text-h2 text-foreground">
          {`Resultados para “${search.term}”`}
        </h1>
        <p className="text-caption text-muted-foreground">
          {formatVideosCount(feed.total)}
        </p>
      </header>
      <VideoGrid items={feed.items} />
      {lastPage > 1 ? (
        <FeedPagination
          page={page}
          lastPage={lastPage}
          hrefFor={(target) => resultsHref(search.term, target)}
        />
      ) : null}
    </div>
  )
}
