import Link from "next/link"
import { notFound } from "next/navigation"

import { ChannelHeader } from "@/components/channels/channel-header"
import { PublicSiteNavbar } from "@/components/layout/public-site-navbar"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { VideoCard } from "@/components/videos/video-card"
import type { PublicChannel, PublicVideosPage } from "@/lib/api/contracts"
import { fetchWithOptionalAuth } from "@/lib/api/optional-auth"
import { upstream } from "@/lib/api/upstream"
import { getSession } from "@/lib/auth/session"
import { formatRelativeDate } from "@/lib/format"
import {
  parsePage,
  PUBLIC_PAGE_SIZE,
  toOffset,
  totalPages,
} from "@/lib/pagination"

export default async function PublicChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ nickname: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { nickname } = await params
  const page = parsePage((await searchParams).page)
  const offset = toOffset(page, PUBLIC_PAGE_SIZE)

  const session = await getSession()
  const isAuthenticated = session.isLoggedIn === true

  // Rota pública: o canal abre para quem não tem conta (TD-08 da Fase 04). O
  // canal é lido com auth opcional para `viewerSubscribed` chegar na primeira
  // pintura (social-interactions-anonymous-gate/TD-02); os vídeos seguem
  // anônimos, como na Fase 04.
  const [channelResult, videosResult] = await Promise.all([
    fetchWithOptionalAuth((init) =>
      upstream.GET("/channels/{nickname}", {
        ...init,
        params: { path: { nickname } },
      })
    ),
    upstream.GET("/channels/{nickname}/videos", {
      params: {
        path: { nickname },
        query: { offset, limit: PUBLIC_PAGE_SIZE },
      },
    }),
  ])

  if (channelResult.error || channelResult.data === undefined) {
    notFound()
  }

  const channel = channelResult.data as PublicChannel
  const videos = (videosResult.data ?? {
    items: [],
    total: 0,
    offset,
    limit: PUBLIC_PAGE_SIZE,
  }) as PublicVideosPage

  const lastPage = totalPages(videos.total, PUBLIC_PAGE_SIZE)
  const basePath = `/@${nickname}`

  return (
    <div className="flex min-h-screen flex-col">
      <PublicSiteNavbar loginVariant="outline" />

      <main className="flex flex-1 flex-col gap-6 px-12 py-12">
        <ChannelHeader
          name={channel.name}
          nickname={channel.nickname}
          description={channel.description}
          videosCount={channel.videosCount}
          subscribersCount={channel.subscribersCount}
          viewerSubscribed={channel.viewerSubscribed}
          isAuthenticated={isAuthenticated}
        />

        <hr className="border-border" />

        {videos.items.length === 0 ? (
          <p className="py-16 text-center text-body-lg text-muted-foreground">
            Este canal ainda não tem vídeos publicados
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {videos.items.map((video) => (
                <li key={video.publicId}>
                  <Link href={`/videos/${video.publicId}`}>
                    <VideoCard
                      title={video.title}
                      thumbnailUrl={video.thumbnailUrl}
                      durationSeconds={video.durationSeconds}
                      viewsCount={video.viewsCount}
                      publishedAt={formatRelativeDate(video.publishedAt).label}
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {lastPage > 1 ? (
              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`${basePath}?page=${String(page - 1)}`}
                      aria-disabled={page <= 1}
                      className={
                        page > 1 ? undefined : "pointer-events-none opacity-50"
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href={`${basePath}?page=${String(page)}`}
                      isActive
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={`${basePath}?page=${String(page + 1)}`}
                      aria-disabled={page >= lastPage}
                      className={
                        page < lastPage
                          ? undefined
                          : "pointer-events-none opacity-50"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
