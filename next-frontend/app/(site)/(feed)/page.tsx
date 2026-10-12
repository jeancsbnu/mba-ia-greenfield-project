import Link from "next/link"

import { CategoryFilter } from "@/components/videos/category-filter"
import { FeedPagination } from "@/components/videos/feed-pagination"
import { VideoGrid } from "@/components/videos/video-grid"
import type {
  VideoCategory,
  VideoFeedPage,
  VideoFeedQuery,
} from "@/lib/api/contracts"
import { upstream } from "@/lib/api/upstream"
import {
  FEED_PAGE_SIZE,
  parsePage,
  toOffset,
  totalPages,
} from "@/lib/pagination"
import { VIDEO_CATEGORIES } from "@/lib/videos/edit-schema"

// A categoria vem da URL, editável à mão. Fora do enum é ignorada e a home
// lista sem filtro: um 400 aqui seria hostil sem ganho, o mesmo critério do
// parsePage (home-busca/TD-01, Revision de 2026-10-11).
function parseCategory(raw: string | string[] | undefined): VideoCategory | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  return VIDEO_CATEGORIES.find((category) => category === value) ?? null
}

function homeHref(category: VideoCategory | null, page: number): string {
  const params = new URLSearchParams()
  if (category) params.set("category", category)
  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `/?${query}` : "/"
}

// Página inicial: Server Component que lê `GET /videos` direto do upstream,
// sem rota BFF (home-busca/TD-01), por recência e 12 por página
// (home-busca/TD-02 e TD-03). Uma falha do upstream lança para o error.tsx da
// listagem.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const category = parseCategory(params.category)
  const page = parsePage(params.page)

  const query: VideoFeedQuery = {
    offset: toOffset(page, FEED_PAGE_SIZE),
    limit: FEED_PAGE_SIZE,
    ...(category ? { category } : {}),
  }
  const { data, error } = await upstream.GET("/videos", {
    params: { query },
  })
  if (error || !data) {
    throw new Error("Falha ao carregar a listagem de vídeos")
  }
  const feed: VideoFeedPage = data
  const lastPage = totalPages(feed.total, FEED_PAGE_SIZE)

  return (
    <div className="flex flex-1 flex-col gap-6 py-8">
      <CategoryFilter current={category} />

      {feed.total === 0 ? (
        category ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-body-lg text-muted-foreground">
              {`Nenhum vídeo em ${category}.`}
            </p>
            <Link href="/" className="text-label-md text-link hover:underline">
              Ver todos os vídeos
            </Link>
          </div>
        ) : (
          <p className="py-16 text-center text-body-lg text-muted-foreground">
            Nenhum vídeo publicado ainda.
          </p>
        )
      ) : (
        <>
          <VideoGrid items={feed.items} />
          {lastPage > 1 ? (
            <FeedPagination
              page={page}
              lastPage={lastPage}
              hrefFor={(target) => homeHref(category, target)}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
