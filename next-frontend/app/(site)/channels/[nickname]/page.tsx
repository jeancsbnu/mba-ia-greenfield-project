import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ChannelHeader } from "@/components/channels/channel-header"
import { ChannelVideosSkeleton } from "@/components/channels/channel-videos-skeleton"
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

  const session = await getSession()
  const isAuthenticated = session.isLoggedIn === true

  // Rota pública: o canal abre para quem não tem conta (TD-08 da Fase 04). O
  // canal é lido com auth opcional para `viewerSubscribed` chegar na primeira
  // pintura (social-interactions-anonymous-gate/TD-02); os vídeos seguem
  // anônimos, como na Fase 04. A lista começa a carregar junto com o canal,
  // mas só é lida dentro do Suspense da grade.
  const videosPromise = upstream
    .GET("/channels/{nickname}/videos", {
      params: {
        path: { nickname },
        query: {
          offset: toOffset(page, PUBLIC_PAGE_SIZE),
          limit: PUBLIC_PAGE_SIZE,
        },
      },
    })
    .then(({ data }) => data as PublicVideosPage | undefined)
  // Canal inexistente descarta a lista sem lê-la: sem isso, uma falha de rede
  // dela viraria rejeição não tratada.
  videosPromise.catch(() => undefined)

  const channelResult = await fetchWithOptionalAuth((init) =>
    upstream.GET("/channels/{nickname}", {
      ...init,
      params: { path: { nickname } },
    })
  )

  // Antes de qualquer Suspense, para o canal inexistente responder 404: depois
  // que a resposta começa a ser transmitida o status já saiu como 200 (Next,
  // guia de streaming, "The HTTP contract"). Por isso o segmento não tem
  // loading.tsx — só a grade de vídeos tem esqueleto.
  if (channelResult.error || channelResult.data === undefined) {
    notFound()
  }

  const channel = channelResult.data as PublicChannel

  return (
    <div className="flex flex-1 flex-col gap-6 py-12">
      <ChannelHeader
        name={channel.name}
        nickname={channel.nickname}
        description={channel.description}
        videosCount={channel.videosCount}
        subscribersCount={channel.subscribersCount}
        viewerSubscribed={channel.viewerSubscribed}
        viewerIsOwner={channel.viewerIsOwner}
        isAuthenticated={isAuthenticated}
      />

      <hr className="border-border" />

      <Suspense fallback={<ChannelVideosSkeleton />}>
        <ChannelVideos
          nickname={nickname}
          page={page}
          videosPromise={videosPromise}
        />
      </Suspense>
    </div>
  )
}

async function ChannelVideos({
  nickname,
  page,
  videosPromise,
}: {
  nickname: string
  page: number
  videosPromise: Promise<PublicVideosPage | undefined>
}) {
  const videos = (await videosPromise) ?? {
    items: [],
    total: 0,
    offset: toOffset(page, PUBLIC_PAGE_SIZE),
    limit: PUBLIC_PAGE_SIZE,
  }

  const lastPage = totalPages(videos.total, PUBLIC_PAGE_SIZE)
  const basePath = `/@${nickname}`

  if (videos.items.length === 0) {
    return (
      <p className="py-16 text-center text-body-lg text-muted-foreground">
        Este canal ainda não tem vídeos publicados
      </p>
    )
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {videos.items.map((video) => (
          <li key={video.publicId}>
            <VideoCard
              publicId={video.publicId}
              title={video.title}
              thumbnailUrl={video.thumbnailUrl}
              durationSeconds={video.durationSeconds}
              viewsCount={video.viewsCount}
              publishedAt={formatRelativeDate(video.publishedAt).label}
            />
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
                  page < lastPage ? undefined : "pointer-events-none opacity-50"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  )
}
