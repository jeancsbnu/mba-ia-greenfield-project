import Link from "next/link"

import { PlusIcon } from "@/components/icons/plus-icon"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { VideoTable, type VideoTableRow } from "@/components/videos/video-table"
import type { OwnerVideosPage } from "@/lib/api/contracts"
import { fetchFromUpstream } from "@/lib/api/server-upstream"
import { upstream } from "@/lib/api/upstream"
import { formatRelativeDate } from "@/lib/format"
import { OWNER_PAGE_SIZE, parsePage, toOffset, totalPages } from "@/lib/pagination"

const ROUTE = "/channel/videos"

function EmptyState() {
  return (
    <div
      data-slot="videos-empty-state"
      className="flex flex-col items-center gap-4 rounded-[var(--radius-4)] border border-border bg-card px-6 py-16 text-center"
    >
      <p className="text-body-lg text-muted-foreground">Nenhum vídeo ainda</p>
      <Button asChild size="md">
        <Link href="/upload">
          <PlusIcon />
          Criar novo vídeo
        </Link>
      </Button>
    </div>
  )
}

export default async function ChannelVideosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const page = parsePage((await searchParams).page)
  const offset = toOffset(page, OWNER_PAGE_SIZE)

  // O returnTo carrega a página atual: depois de renovar a sessão o usuário
  // volta para o mesmo recorte da lista, não para o começo.
  const data = await fetchFromUpstream<OwnerVideosPage>(
    (init) =>
      upstream.GET("/me/videos", {
        ...init,
        params: { query: { offset, limit: OWNER_PAGE_SIZE } },
      }),
    `${ROUTE}?page=${String(page)}`
  )

  const rows: VideoTableRow[] = data.items.map((item) => ({
    publicId: item.publicId,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    durationSeconds: item.durationSeconds,
    status: item.status,
    visibility: item.visibility,
    publishedAt: item.publishedAt,
    viewsCount: item.viewsCount,
    likesCount: item.likesCount,
    commentsCount: item.commentsCount,
  }))

  const lastPage = totalPages(data.total, OWNER_PAGE_SIZE)
  const hasPrevious = page > 1
  const hasNext = page < lastPage

  return (
    <div className="flex flex-col gap-6 px-12 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 uppercase text-foreground">Seus vídeos</h1>

        <Button asChild size="md">
          <Link href="/upload">
            <PlusIcon />
            Criar novo vídeo
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <VideoTable
            videos={rows}
            formatPublishedAt={(isoDate) => formatRelativeDate(isoDate)}
          />

          {lastPage > 1 ? (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={`${ROUTE}?page=${String(page - 1)}`}
                    aria-disabled={!hasPrevious}
                    className={hasPrevious ? undefined : "pointer-events-none opacity-50"}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink href={`${ROUTE}?page=${String(page)}`} isActive>
                    {page}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    href={`${ROUTE}?page=${String(page + 1)}`}
                    aria-disabled={!hasNext}
                    className={hasNext ? undefined : "pointer-events-none opacity-50"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      )}
    </div>
  )
}
